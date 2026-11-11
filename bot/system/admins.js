const { extrairDadosProduto } = require("../../js/produto.js");
const { enviarEmMassa } = require("../../js/envio-email.js");
const { extrairTipoConteudo } = require("../../js/pagamento-info.js");
const {
  getDominio,
  normalizarDominio,
  linkProduto,
} = require("../../js/dominio.js");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

// Sistema para rastrear mensagens que aguardam respostas de bots
if (!global.pendingResponses) {
  global.pendingResponses = {};
}

const config = require("../../config.json");
const configJSON = JSON.parse(fs.readFileSync("./config.json"));

module.exports = async (conn, mek, dataVendas) => {
  try {
    console.log(JSON.stringify({ mek }, null, 2));
    const from = mek.key.remoteJid;
    const type = Object.keys(mek.message).find(
      (key) =>
        !["senderKeyDistributionMessage", "messageContextInfo"].includes(key),
    );

    // PREFIXO
    const prefix = "/";

    // Sistema de produtos em edição
    if (!global.produtosEmEdicao) {
      global.produtosEmEdicao = {};
    }

    // MENSAGENS
    const body =
      type === "conversation" && mek.message.conversation.startsWith(prefix)
        ? mek.message.conversation
        : type == "extendedTextMessage" &&
            mek.message[type].text.startsWith(prefix)
          ? mek.message[type].text
          : "";
    const budy =
      type === "conversation"
        ? mek.message.conversation
        : type === "extendedTextMessage"
          ? mek.message.extendedTextMessage.text
          : "";

    const comando = body
      ?.replace(prefix, "")
      .trim()
      .split(/ +/)
      .shift()
      .toLowerCase()
      .normalize("NFD")
      ?.replace(/[\u0300-\u036f]/gi, "");
    const isCmd = body.startsWith(prefix);
    const args = body.trim().split(/ +/).slice(1);

    // Verificar se esta mensagem é uma resposta a um comando pendente
    checkIfResponseToCommand(conn, mek, budy);

    // Verificar se usuário está em modo de edição
    const usuarioEditando = global.produtosEmEdicao[from];
    const respondendo =
      type === "conversation" || type === "extendedTextMessage";

    const enviar = async (text) => {
      console.log("Enviando mensagem:", text);
      return conn.sendMessage(from, { text }, { quoted: mek });
    };

    // Função para gerar código aleatório de 10 caracteres
    const gerarCodigo = () => {
      const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let codigo = "";
      for (let i = 0; i < 10; i++) {
        codigo += caracteres.charAt(
          Math.floor(Math.random() * caracteres.length),
        );
      }
      return codigo;
    };

    // Caminho para o arquivo de vendas
    const caminhoArquivo = path.join(__dirname, "../../data/vendas.json");

    // Função para salvar dados no arquivo JSON
    const salvarDados = () => {
      try {
        fs.writeFileSync(caminhoArquivo, JSON.stringify(dataVendas, null, 4));
        console.log("Dados salvos com sucesso em: " + caminhoArquivo);
        return true;
      } catch (erro) {
        console.error("Erro ao salvar dados:", erro);
        return false;
      }
    };

    const salvarArquivoRecebido = (buffer, extensao) => {
      try {
        const nomeArquivo = `pagamento-${Date.now()}-${Math.random().toString(36).slice(2)}${extensao}`;
        const caminhoDestino = path.join(__dirname, "../../uploads", nomeArquivo);
        fs.mkdirSync(path.dirname(caminhoDestino), { recursive: true });
        fs.writeFileSync(caminhoDestino, buffer);
        return `/uploads/${nomeArquivo}`;
      } catch (erro) {
        console.error("Erro ao salvar arquivo recebido:", erro);
        return null;
      }
    };

    const contemTextoBloqueio = (texto) => {
      const valor = String(texto || "").toLowerCase();
      return (
        valor.includes("sorry, you have been blocked") ||
        valor.includes("you have been blocked") ||
        valor.includes("access denied")
      );
    };

    // Função para iniciar o processo de perguntas
    const iniciarPerguntas = (codigo) => {
      const camposPerguntas = {
        linkProduto:
          "👀 Digite o *link do produto na OLX* (opcional, apenas pressione enter para pular):",
        produto: "📦 Digite o *nome do produto*:",
        valor: "💰 Digite o *valor do produto*:",
        dataVenda: "📅 Digite a *data da venda* (formato: DD/MM):",
        comprador: "👤 Digite o *nome do comprador*:",
        plataforma: "🌐 Digite a *plataforma de venda* (ex: OLX, Marketplace):",
        "vendedor.nome": "🧑‍💼 Digite o *nome do vendedor*:",
        "vendedor.localizacao": "📍 Digite a *localização do vendedor*:",
        "vendedor.avaliacao": "⭐ Digite a *avaliação do vendedor* (0-5):",
        "vendedor.produtosVendidos":
          "📊 Digite a *quantidade de produtos vendidos pelo vendedor*:",
        imagem: "🖼️ Digite a *URL da imagem*:",
        pagamento: "💳 Envie o *QR Code, link de pagamento ou texto* que o cliente deve usar para pagar. Pode ser uma imagem, link ou mensagem curta:",
      };

      // Iniciar objeto de edição
      global.produtosEmEdicao[from] = {
        codigo: codigo,
        etapaAtual: 0,
        campos: [
          "linkProduto",
          ...Object.keys(camposPerguntas).filter(
            (campo) => campo !== "linkProduto",
          ),
        ],
        perguntas: camposPerguntas,
        dadosExtraidos: null,
      };

      // Fazer a primeira pergunta (sobre o link)
      const primeiroCampo = global.produtosEmEdicao[from].campos[0]; // Garantir que estamos usando o campo correto
      const primeiraPergunta = camposPerguntas[primeiroCampo];

      // Enviar com pequeno atraso para garantir que a mensagem seja enviada após a confirmação
      setTimeout(() => {
        enviar(primeiraPergunta);
      }, 1000);
    };

    // Função para definir valor no objeto usando path
    const setNestedValue = (obj, path, value) => {
      if (path.includes(".")) {
        const parts = path.split(".");
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
      } else {
        obj[path] = value;
      }
      return obj;
    };

    // Processar resposta de edição
    const processarResposta = async (resposta) => {
      const edicao = global.produtosEmEdicao[from];
      const campoAtual = edicao.campos[edicao.etapaAtual];
      const produtoIndex = dataVendas.findIndex(
        (p) => p.codigo === edicao.codigo,
      );

      if (produtoIndex === -1) {
        enviar("❌ Erro: Produto não encontrado!");
        delete global.produtosEmEdicao[from];
        return;
      }

      // Caso especial: processamento do link do produto
      if (
        campoAtual === "linkProduto" &&
        resposta.trim() &&
        resposta.startsWith("https://")
      ) {
        enviar("⏳ Extraindo dados do produto... Aguarde um momento.");

        try {
          const resultado = await extrairDadosProduto(resposta.trim());
          if (resultado.sucesso === false)
            return enviar(
              "Não foi possível extrair dados do produto. Tente novamente.\n\n" +
                resultado.erro,
            );

          if (resultado?.bloqueado) {
            await enviar(
              "⚠️ A OLX bloqueou temporariamente a coleta automatica deste anuncio. Vamos continuar com o preenchimento manual.",
            );
          }

          if (resultado.sucesso && resultado.dados) {
            // Armazenar dados extraídos
            edicao.dadosExtraidos = resultado.dados;

            // Coletar todos os dados preenchidos em um array
            const camposPreenchidos = [];

            // Preencher campos automaticamente sem enviar mensagens individuais
            if (
              resultado.dados.titulo &&
              !contemTextoBloqueio(resultado.dados.titulo)
            ) {
              dataVendas[produtoIndex].produto = resultado.dados.titulo;
              camposPreenchidos.push(
                `✅ Nome do produto obtido: ${resultado.dados.titulo}`,
              );
            }

            if (resultado.dados.preco) {
              dataVendas[produtoIndex].valor = Number(resultado.dados.preco);
              camposPreenchidos.push(
                `✅ Valor do produto obtido: R$ ${resultado.dados.preco}`,
              );
              camposPreenchidos.push(`✅ Campo valor já está preenchido.`);
            }

            // Processar todas as imagens
            if (resultado.dados.imagens && resultado.dados.imagens.length > 0) {
              // Converter o campo imagem para um array
              dataVendas[produtoIndex].imagem = resultado.dados.imagens.filter(
                (img) => img.startsWith("https://img.olx.com.br/"),
              );

              camposPreenchidos.push(
                `✅ Campo imagem já está preenchido com ${dataVendas[produtoIndex].imagem.length} imagem(ns).`,
              );
            }

            if (resultado.dados.nomeDono) {
              dataVendas[produtoIndex].vendedor.nome = resultado.dados.nomeDono;
              camposPreenchidos.push(
                `✅ NOME DO VENDEDOR OBTIDO: ${resultado.dados.nomeDono}`,
              );
            }

            if (resultado.dados.localizacao) {
              dataVendas[produtoIndex].vendedor.localizacao =
                resultado.dados.localizacao;
              camposPreenchidos.push(
                `✅ LOCALIZAÇÃO OBTIDA: ${resultado.dados.localizacao}`,
              );
            }

            if (resultado.dados.titulo) {
              camposPreenchidos.push(`✅ Campo produto já está preenchido.`);
            }

            dataVendas[produtoIndex].plataforma = "OLX";

            // Enviar todos os campos preenchidos em uma única mensagem
            if (camposPreenchidos.length > 0) {
              await enviar(camposPreenchidos.join("\n"));
            }
          } else {
            enviar(
              "⚠️ Não foi possível extrair dados do link fornecido. Continuaremos com o preenchimento manual.",
            );
          }
        } catch (error) {
          console.error("Erro ao processar link:", error);
          enviar(
            "⚠️ Erro ao processar o link. Continuaremos com o preenchimento manual.",
          );
        }
        // Salvar após extrair dados do produto
        salvarDados();
      }
      // Processamento para o campo de imagem
      else if (campoAtual === "imagem") {
        // Se o usuário inserir uma URL de imagem manualmente
        if (resposta.trim()) {
          // Verificar se o campo imagem já é um array
          if (!Array.isArray(dataVendas[produtoIndex].imagem)) {
            dataVendas[produtoIndex].imagem = [];
          }

          // Adicionar a nova imagem ao array
          dataVendas[produtoIndex].imagem.push(resposta.trim());
          enviar(`✅ Imagem adicionada ao produto!`);
        }
        // Salvar após cada campo atualizado
        salvarDados();
      }
      // Processamento para o campo de pagamento
      else if (campoAtual === "pagamento") {
        let textoPagamento = resposta.trim();
        let tipo = "texto";
        let valor = "";

        const mediaKey = ["imageMessage", "videoMessage", "documentMessage"].find(
          (key) => mek.message?.[key],
        );

        if (mediaKey) {
          try {
            const buffer = await downloadMediaMessage(mek, "buffer", {});
            const extensao = mediaKey === "documentMessage" ? ".pdf" : mediaKey === "videoMessage" ? ".mp4" : ".jpg";
            const caminhoArquivo = salvarArquivoRecebido(buffer, extensao);

            if (caminhoArquivo) {
              tipo = "imagem";
              valor = caminhoArquivo;
            }
          } catch (erro) {
            console.error("Erro ao baixar mídia de pagamento:", erro);
          }
        }

        if (!valor) {
          ({ tipo, valor } = extrairTipoConteudo(textoPagamento));
        }

        dataVendas[produtoIndex].pagamento = valor;
        dataVendas[produtoIndex].pagamentoTipo = tipo;
        salvarDados();

        enviar(
          `✅ Informação de pagamento salva para esta venda!\n\nTipo: ${tipo === "imagem" ? "imagem/QR" : "texto/link"}`,
        );
      }
      // Processamento normal para outros campos
      else if (campoAtual !== "linkProduto") {
        // Converter valor para número quando necessário
        let valorProcessado = resposta;
        if (
          campoAtual === "valor" ||
          campoAtual === "vendedor.avaliacao" ||
          campoAtual === "vendedor.produtosVendidos"
        ) {
          valorProcessado = Number(resposta);
        }

        // Salvar resposta
        setNestedValue(dataVendas[produtoIndex], campoAtual, valorProcessado);
        // Salvar após cada campo atualizado
        salvarDados();
      }

      // Avançar para próxima etapa
      edicao.etapaAtual++;

      // Verificar se deve pular campos já preenchidos pelo link
      const camposPreenchidos = [];

      while (edicao.etapaAtual < edicao.campos.length) {
        const campoAtual = edicao.campos[edicao.etapaAtual];
        let campoPreenchido = false;

        // Verificação detalhada para cada campo se já está preenchido com valor válido
        if (
          campoAtual === "produto" &&
          dataVendas[produtoIndex].produto &&
          dataVendas[produtoIndex].produto.trim() !== ""
        ) {
          campoPreenchido = true;
          // Não adicionamos aqui pois já foi adicionado durante o processamento do link
        } else if (
          campoAtual === "valor" &&
          dataVendas[produtoIndex].valor > 0
        ) {
          campoPreenchido = true;
          // Não adicionamos aqui pois já foi adicionado durante o processamento do link
        } else if (
          campoAtual === "dataVenda" &&
          dataVendas[produtoIndex].dataVenda &&
          dataVendas[produtoIndex].dataVenda.trim() !== ""
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(`✅ Campo dataVenda já está preenchido.`);
        } else if (
          campoAtual === "comprador" &&
          dataVendas[produtoIndex].comprador &&
          dataVendas[produtoIndex].comprador.trim() !== ""
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(`✅ Campo comprador já está preenchido.`);
        } else if (
          campoAtual === "plataforma" &&
          dataVendas[produtoIndex].plataforma &&
          dataVendas[produtoIndex].plataforma.trim() !== ""
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(`✅ Campo plataforma já está preenchido.`);
        } else if (
          campoAtual === "vendedor.nome" &&
          dataVendas[produtoIndex].vendedor &&
          dataVendas[produtoIndex].vendedor.nome &&
          dataVendas[produtoIndex].vendedor.nome.trim() !== ""
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(`✅ Campo vendedor.nome já está preenchido.`);
        } else if (
          campoAtual === "vendedor.localizacao" &&
          dataVendas[produtoIndex].vendedor &&
          dataVendas[produtoIndex].vendedor.localizacao &&
          dataVendas[produtoIndex].vendedor.localizacao.trim() !== ""
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(
            `✅ Campo vendedor.localizacao já está preenchido.`,
          );
        } else if (
          campoAtual === "vendedor.avaliacao" &&
          dataVendas[produtoIndex].vendedor &&
          dataVendas[produtoIndex].vendedor.avaliacao > 0
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(
            `✅ Campo vendedor.avaliacao já está preenchido.`,
          );
        } else if (
          campoAtual === "vendedor.produtosVendidos" &&
          dataVendas[produtoIndex].vendedor &&
          dataVendas[produtoIndex].vendedor.produtosVendidos > 0
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(
            `✅ Campo vendedor.produtosVendidos já está preenchido.`,
          );
        } else if (
          campoAtual === "imagem" &&
          Array.isArray(dataVendas[produtoIndex].imagem) &&
          dataVendas[produtoIndex].imagem.length > 0
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(
            `✅ Campo imagem já está preenchido com ${dataVendas[produtoIndex].imagem.length} imagem(ns).`,
          );
        } else if (
          campoAtual === "pagamento" &&
          dataVendas[produtoIndex].pagamento &&
          dataVendas[produtoIndex].pagamento.trim() !== ""
        ) {
          campoPreenchido = true;
          camposPreenchidos.push(`✅ Campo pagamento já está preenchido.`);
        } else if (campoAtual === "linkProduto") {
          // Para o link do produto, sempre considere como "preenchido" se já foi processado
          // mesmo que esteja vazio, pois é opcional
          if (edicao.etapaAtual > 0) {
            campoPreenchido = true;
          }
        }

        if (campoPreenchido) {
          console.log(`Campo ${campoAtual} já preenchido, pulando...`);
          edicao.etapaAtual++;
        } else {
          break; // Encontrou um campo não preenchido, sai do loop
        }
      }

      // Se tiver campos preenchidos, mostra em uma única mensagem
      if (camposPreenchidos.length > 0) {
        await enviar(
          `TODOS OS DADOS PREENCHIDOS JUNTOS\n\n${camposPreenchidos.join("\n")}`,
        );
      }

      // Verificar se terminou
      if (edicao.etapaAtual >= edicao.campos.length) {
        // Salvar dados finais antes de concluir
        if (salvarDados()) {
          enviar(
            `✅ Produto cadastrado com sucesso!\n\nCódigo: ${edicao.codigo}\n\n*LINK:* ${linkProduto(edicao.codigo)}`,
          );
        } else {
          enviar(
            `⚠️ Produto cadastrado, mas houve um problema ao salvar os dados permanentemente. Código: ${edicao.codigo}`,
          );
        }
        delete global.produtosEmEdicao[from];
      } else {
        // Próxima pergunta
        const proximoCampo = edicao.campos[edicao.etapaAtual];
        const proximaPergunta = edicao.perguntas[proximoCampo];
        await enviar(proximaPergunta);
      }
    };

    // Se estiver no modo de edição e receber uma mensagem sem comando
    if (usuarioEditando && respondendo && !isCmd) {
      processarResposta(budy);
      return;
    }

    if (isCmd) console.log(`[ CMD ] ${comando} - ${from} - ${budy}`);

    switch (comando) {
      case "menu":
      case "comandos":
      case "ajuda":
        enviar(
          [
            "📋 *MENU DE COMANDOS*",
            "",
            "*📦 Produtos*",
            "/novo — cria um produto e abre as perguntas de cadastro",
            "/cancelar — cancela o cadastro em andamento",
            "/enviar <email1,email2> [código] — envia e-mails com o link do produto",
            "/olx <CPF ou link> — consulta dados pelo CPF ou link da OLX",
            "",
            "*⚙️ Configurações*",
            "/dominio [domínio] — mostra ou troca o domínio dos links",
            "/token <token> — troca o token (reinicia o bot)",
            "/bot <número> — troca o número do bot (reinicia o bot)",
            "/puxadas <link do grupo> — troca o grupo de puxadas",
            "",
            "*🛠️ Sistema*",
            "/att — atualiza o bot pelo GitHub e reinicia",
            "/bash <comando> — executa um comando na VPS",
            "/eval <código> — executa código JavaScript no bot",
            "",
            "/menu — mostra esta lista",
          ].join("\n"),
        );
        break;

      case "menor":
        enviar("Maior da cu de Sp");
        break;

      case "enviar":
        // Verificar se há argumentos (emails e código do produto)
        if (args.length < 1) {
          return enviar(
            "⚠️ Uso: /email <email1,email2,email3...> [código_produto]",
          );
        }

        // Extrair emails e código do produto
        const emailsRaw = args[0].split(",").map((email) => email.trim());
        const codigoProduto = args.length > 1 ? args[1] : null;

        // Se foi informado um código, verificar se existe no JSON
        if (codigoProduto) {
          const existe = dataVendas.some((p) => p.codigo === codigoProduto);
          if (!existe) {
            return enviar(
              `⚠️ Código de produto "${codigoProduto}" não encontrado nos registros!`,
            );
          }
        }

        // Filtrar emails válidos
        const emailsValidos = emailsRaw.filter((email) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        });

        if (emailsValidos.length === 0) {
          return enviar("⚠️ Nenhum e-mail válido encontrado!");
        }

        // Iniciar processo de envio
        await enviar(
          `⏳ Iniciando envio para ${emailsValidos.length} emails...`,
        );

        try {
          // Passar os emails para a função de envio em massa
          await enviarEmMassa(emailsValidos, codigoProduto);

          // Mensagem de sucesso
          await enviar(
            `✅ E-mails enviados com sucesso para ${emailsValidos.length} destinatários!`,
          );
        } catch (error) {
          console.error("Erro no envio de emails:", error);
          await enviar("❌ Ocorreu um erro durante o envio dos e-mails.");
        }
        break;

      case "olx":
        var toText = args.join(" ");
        if (!toText)
          return enviar("⚠️ Você não informou um CPF ou link do produto.");

        console.log({ toText });

        // Função para limpar o formato do CPF
        function limparCPF(cpf) {
          return cpf?.replace(/[^\d]/g, "");
        }

        // Verificar se é um CPF (com ou sem pontuação)
        const cpfPattern = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
        const isCPF = cpfPattern.test(toText);
        const isLink = toText.match(/\d{10}/g) !== null;

        if (!isCPF && !isLink) {
          return enviar(
            "⚠️ Formato inválido. Informe um CPF válido ou link que contenha ID do produto.",
          );
        }

        enviar("⏳ Consultando dados... Aguarde um momento.");

        try {
          const extrairDados = require("../../js/olx-cpfdados");
          let resultado;

          // Processar de acordo com o tipo de entrada (CPF ou ID)
          if (isCPF) {
            // Limpa o CPF para ficar apenas números
            const cpfLimpo = limparCPF(toText);
            // Chamar função específica para consulta de CPF
            resultado = {
              dadosFormatados: `/cpf ${cpfLimpo}`, // Este formato parece ser o que o sistema espera para CPFs
              localizacao: null, // Para CPF, não há localização
            };
          } else {
            // Caso seja um ID/link, extrair o ID de 10 dígitos e proceder como antes
            resultado = await extrairDados.buscarInfoComId(
              toText.match(/\d{10}/g)[0],
            );
          }

          if (
            (resultado && resultado.dadosFormatados.includes("Indisponível")) ||
            !resultado
          ) {
            return enviar("⚠️ Não foi possível extrair dados da consulta.");
          }

          // Grupo de origem onde enviamos o comando

          const origemGrupo = config.groupPuxadas;
          // Grupo de destino onde queremos receber a resposta
          const destinoGrupo = from; // Usar o grupo atual como destino

          // Enviar a mensagem para o grupo de origem (grupo de bot)
          conn
            .sendMessage(origemGrupo, {
              text: resultado.dadosFormatados,
            })
            .then((sentMsg) => {
              // Registrar que estamos aguardando uma resposta
              global.pendingResponses[origemGrupo] = {
                command: resultado.dadosFormatados,
                timestamp: Date.now(),
                targetGroup: destinoGrupo, // para onde enviar a resposta quando receber
                location: resultado.localizacao, // Adicionar localização para filtro
              };

              enviar("✅ Consulta enviada! Aguardando resposta...");

              // Timeout para limpar comandos não respondidos
              setTimeout(() => {
                if (global.pendingResponses[origemGrupo]) {
                  delete global.pendingResponses[origemGrupo];
                  return conn.sendMessage(from, {
                    text: "⌛ Tempo limite excedido para resposta da consulta.",
                  });
                }
              }, 60000); // 60 segundos de timeout
            });
        } catch (error) {
          enviar("⚠️ Ocorreu um erro ao processar sua consulta.");
          console.error("Erro ao processar consulta:", error);
        }
        break;

      case "token":
        const token = args.join(" ");
        const tokenMetaDados = JSON.parse(fs.readFileSync("./config.json"));

        if (!token) {
          return enviar("⚠️ Você não digitou o token.");
        }

        tokenMetaDados.token = token;
        enviar(
          "✅ Token atualizado com sucesso!\n\nReiniciando para aplicar as mudanças...",
        );

        fs.writeFileSync(
          "./config.json",
          JSON.stringify(tokenMetaDados, null, 2),
        );

        setTimeout(() => {
          process.exit(0);
        }, 2000);
        break;

      case "dominio": {
        const atual = getDominio();
        const novoDominio = normalizarDominio(args[0]);

        if (!args[0]) {
          return enviar(
            `🌐 Domínio atual: ${atual}\n\nPara trocar: /dominio <novo dominio>\nExemplo: /dominio www.meusite.com`,
          );
        }

        if (!novoDominio) {
          return enviar(
            "⚠️ Domínio inválido.\n\nExemplo: /dominio www.meusite.com",
          );
        }

        const cfgDominio = JSON.parse(fs.readFileSync("./config.json"));
        cfgDominio.dominio = novoDominio;
        fs.writeFileSync("./config.json", JSON.stringify(cfgDominio, null, 2));

        enviar(
          `✅ Domínio atualizado!\n\nAntes: ${atual}\nAgora: ${novoDominio}\n\nExemplo de link:\n${linkProduto("CODIGO")}\n\nJá vale para os próximos links, sem reiniciar.`,
        );
        break;
      }

      case "valor":
        const valor = args.join(" ");

        if (!token) {
          return enviar("⚠️ Você não digitou o token.");
        }

        preco.token = token;
        enviar(
          "✅ Token atualizado com sucesso!\n\nReiniciando para aplicar as mudanças...",
        );

        fs.writeFileSync("./config.json", JSON.stringify(preco, null, 2));

        setTimeout(() => {
          process.exit(0);
        }, 2000);
        break;

      case "puxadas":
        const idGroupPuxadas = args.join(" ");
        const idGroupPuxadasMetaDados = JSON.parse(
          fs.readFileSync("./config.json"),
        );

        if (!idGroupPuxadas) {
          return enviar("⚠️ Você não digitou o Link do Grupo.");
        }

        if (!idGroupPuxadas.includes("https://chat.whatsapp.com/"))
          return enviar(
            "⚠️ Link inválido. Certifique-se de que é um link de convite para grupo do WhatsApp.",
          );

        const getIdGroup = await conn.groupGetInviteInfo(
          idGroupPuxadas.split("https://chat.whatsapp.com/")[1],
        );

        if (getIdGroup.id) {
          idGroupPuxadasMetaDados.groupPuxadas = getIdGroup.id;
          enviar(
            "✅ ID do Grupo atualizado!\n\nReiniciando para aplicar as mudanças...",
          );
        } else
          enviar(
            "⚠️ Não foi possível obter o ID do grupo. Verifique se o link está correto.",
          );

        fs.writeFileSync(
          "./config.json",
          JSON.stringify(idGroupPuxadasMetaDados, null, 2),
        );

        setTimeout(() => {
          process.exit(0);
        }, 2000);
        break;

      case "bot":
        var text = args.join(" ");

        if (!text) {
          return enviar("⚠️ Você não digitou o NUMERO do BOT.");
        }

        text = text?.replace(/\D/g, "");
        if (text.length < 11)
          return enviar("⚠️ Número inválido. Deve ter pelo menos 11 dígitos.");

        configJSON.numerodobot = text + "@s.whatsapp.net";
        enviar(
          "✅ ID do BOT atualizado!\n\nReiniciando para aplicar as mudanças...",
        );

        fs.writeFileSync("./config.json", JSON.stringify(configJSON, null, 2));

        setTimeout(() => {
          process.exit(0);
        }, 2000);
        break;

      case "att":
        enviar("Atualizando o bot... Aguarde um momento.");
        var util = require("util");
        var execPromise = util.promisify(require("child_process").exec);

        // OneDrive trava o .git/index periodicamente durante a sincronização;
        // essas falhas são passageiras, então vale tentar de novo antes de desistir.
        var execComRetry = async (cmd, tentativas = 3, esperaMs = 2000) => {
          for (let i = 1; i <= tentativas; i++) {
            try {
              return await execPromise(cmd);
            } catch (erro) {
              const mensagem = erro.stderr || erro.message || "";
              const eLockTransitorio =
                /could not write index|index\.lock|unable to create|resource busy|EBUSY/i.test(
                  mensagem,
                );
              if (!eLockTransitorio || i === tentativas) throw erro;
              await new Promise((resolve) => setTimeout(resolve, esperaMs));
            }
          }
        };

        // Detecta conflitos de merge (linhas "DU"/"UU"/"AU"/etc de `git status --porcelain`)
        // e, se forem apenas arquivos de runtime "deletados por nós" (config.json,
        // vendas.json, uploads...), resolve automaticamente. Qualquer outro tipo de
        // conflito é reportado para revisão manual em vez de seguir adiante.
        var resolverConflitosSeguros = async () => {
          const { stdout: statusPorcelain } = await execPromise(
            "git status --porcelain",
          );
          const linhas = statusPorcelain
            .split("\n")
            .filter((linha) => linha.trim().length > 0);
          const linhasConflito = linhas.filter((linha) =>
            /^(DD|AU|UD|UA|DU|AA|UU) /.test(linha),
          );

          if (linhasConflito.length === 0) {
            return { temConflito: false, resolvido: false };
          }

          const apenasConflitosSeguro =
            linhasConflito.length > 0 &&
            linhasConflito.every((linha) => linha.startsWith("DU "));

          if (!apenasConflitosSeguro) {
            return {
              temConflito: true,
              resolvido: false,
              arquivos: linhasConflito.map((linha) => linha.slice(3).trim()),
            };
          }

          for (const linha of linhasConflito) {
            const arquivo = linha.slice(3).trim();
            await execPromise(`git rm --cached "${arquivo}"`);
          }

          try {
            await execPromise(
              'git commit -m "Resolver conflito automático: parar de rastrear arquivo(s) de runtime"',
            );
          } catch (erroCommit) {
            /* nada para commitar, tudo bem */
          }

          return { temConflito: true, resolvido: true };
        };

        (async () => {
          let deuStash = false;
          try {
            const conflitoPreExistente = await resolverConflitosSeguros();
            if (conflitoPreExistente.temConflito && !conflitoPreExistente.resolvido) {
              return enviar(
                `⚠️ O repositório tem conflitos de merge não resolvidos:\n${conflitoPreExistente.arquivos.join("\n")}\n\nResolva manualmente (git status) antes de rodar /att novamente.`,
              );
            }

            const { stdout: statusOut } = await execComRetry(
              "git status --porcelain --untracked-files=no",
            );
            deuStash = statusOut.trim().length > 0;

            if (deuStash) {
              try {
                await execComRetry("git stash");
              } catch (erroStash) {
                return enviar(
                  `❌ Não foi possível guardar as alterações locais para atualizar: ${erroStash.message}`,
                );
              }
            }

            const { stdout: pullOut } = await execComRetry("git pull");

            if (deuStash) {
              try {
                await execComRetry("git stash pop");
              } catch (erroPop) {
                const resultado = await resolverConflitosSeguros();
                if (!resultado.resolvido) throw erroPop;
                await execPromise("git stash drop");
              }
              deuStash = false;
            }

            if (pullOut.includes("Already up to date.")) {
              return enviar("O bot já está atualizado.");
            }

            enviar(
              `✅ Bot atualizado com sucesso!\n\nDetalhes:\n${pullOut.trim()}\n\nReiniciando para aplicar as mudanças...`,
            );

            setTimeout(() => {
              process.exit(0);
            }, 2000);
          } catch (erro) {
            enviar(`Ocorreu um erro: ${erro.message}`);
          }
        })();
        break;

      // case "olx":
      //   var toText = args.join(" ");
      //   if (!toText) return enviar("⚠️ Você não digitou o link do produto.");
      //   if (!toText.match(/\d{10}/g)) return enviar("⚠️ Link inválido.");

      //   console.log({ toText });
      //   enviar("⏳ Extraindo dados do produto... Aguarde um momento.");

      //   try {
      //     const extrairDados = require("../../js/olx-cpfdados");
      //     const resultado = await extrairDados.buscarInfoComId(
      //       toText.match(/\d{10}/g)[0]
      //     );

      //     if (
      //       (resultado && resultado.dadosFormatados.includes("Indisponível")) ||
      //       !resultado
      //     )
      //       return enviar("⚠️ Não foi possível extrair dados do produto.");

      //     // Grupo de origem onde enviamos o comando
      //     const origemGrupo = "120363400171925124@g.us";
      //     // Grupo de destino onde queremos receber a resposta
      //     const destinoGrupo = "120363397924256528@g.us"; // ou um ID específico para outro grupo

      //     // Enviar a mensagem para o grupo de origem
      //     conn
      //       .sendMessage(origemGrupo, {
      //         text: resultado.dadosFormatados,
      //       })
      //       .then((sentMsg) => {
      //         // Registrar que estamos aguardando uma resposta
      //         global.pendingResponses[origemGrupo] = {
      //           command: resultado.dadosFormatados,
      //           timestamp: Date.now(),
      //           targetGroup: destinoGrupo, // para onde enviar a resposta quando receber
      //         };

      //         enviar("✅ Comando enviado! Aguardando resposta...");

      //         // Opcional: definir um timeout para limpar comandos não respondidos
      //         setTimeout(() => {
      //           if (global.pendingResponses[origemGrupo]) {
      //             delete global.pendingResponses[origemGrupo];
      //             return conn.sendMessage(from, {
      //               text: "Tempo limite excedido para resposta do comando.",
      //             });
      //           }
      //         }, 60000); // 30 segundos de timeout
      //       });
      //   } catch (error) {
      //     enviar("⚠️ Ocorreu um erro ao extrair dados do produto.");
      //     console.error("Erro ao extrair dados do produto:", error);
      //   }
      //   break;

      case "novo":
        const novoItem = {
          codigo: gerarCodigo(),
          linkProduto: "",
          produto: "",
          valor: 0,
          dataVenda: "",
          comprador: "",
          plataforma: "",
          vendedor: {
            nome: "",
            localizacao: "",
            avaliacao: 0,
            produtosVendidos: 0,
          },
          imagem: [],
          pagamento: "",
        };
        dataVendas.push(novoItem);

        salvarDados();

        const mensagem = `✅ Novo item criado com sucesso!\nCódigo: ${novoItem.codigo}\n\nVamos preencher os dados do produto. Responda as perguntas a seguir:`;

        await enviar(mensagem);

        return iniciarPerguntas(novoItem.codigo);

        break;

      case "cancelar":
        if (usuarioEditando) {
          delete global.produtosEmEdicao[from];
          enviar("❌ Edição cancelada!");
        } else {
          enviar("Não há nenhuma edição em andamento.");
        }
        break;

      case "eval":
        try {
          (async () => {
            try {
              const code = budy.slice(5); // pega o código do usuário
              eval(code); // executa diretamente
            } catch (err) {
              enviar("Erro ao executar o código:\n" + err.toString());
            }
          })();
        } catch (err) {
          enviar(err.toString());
        }
        break;

      case "bash":
        var { exec } = require("child_process");
        var text = args.join(" ");
        exec(text, (erro, stdoutk) => {
          if (erro) return enviar(`Ocorreu um erro, ${erro}`);
          if (stdoutk) {
            return enviar(stdoutk.trim());
          }
        });
        break;

      default:
        break;
    }
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
  }
};

// Função para verificar se a mensagem atual é uma resposta a algum comando pendente
async function checkIfResponseToCommand(conn, message, budy) {
  try {
    const groupId = message.key.remoteJid;

    // Verificar se este grupo tem comandos aguardando resposta
    if (!global.pendingResponses[groupId]) return;

    // Logs para depuração
    console.log("✓ Verificando resposta em grupo com comando pendente");
    console.log("→ De:", message.key.participant || "desconhecido");
    console.log("→ Texto recebido:", budy.substring(0, 50) + "...");

    // ID do bot que responde às consultas
    const botId = config.numerodobot;

    // Verificar se é mensagem do bot
    //  const isBotMessage = message.key.participantAlt === botId;
    const isBotMessage = message.key.remoteJid === botId;

    // Verificar se o conteúdo parece ser uma resposta de consulta
    const isQueryResponse =
      budy.includes("Resultado da sua consulta") ||
      budy.includes("☞") ||
      budy.match(/CPF:\s*[\d.\-]+/i) ||
      budy.includes("Dados não encontrados") ||
      budy.includes("Você está consultando muito rápido");

    console.log("→ É mensagem do bot?", isBotMessage);
    console.log("→ Parece resposta de consulta?", isQueryResponse);

    //  if (isBotMessage && isQueryResponse) {
    if (isQueryResponse) {
      console.log("✓ Mensagem identificada como resposta de consulta do bot", {
        message,
      });
      const pendingCommand = global.pendingResponses[groupId];

      if (pendingCommand && pendingCommand.targetGroup) {
        console.log("✓ Encontrou comando pendente, processando resposta");

        function limparTexto(txt) {
          return txt
            ?.replace(/[\u200e\u200f\u00a0\r]/g, "")
            ?.replace(/[ \t]+\n/g, "\n")
            ?.replace(/\n{2,}/g, "\n\n")
            .trim();
        }

        const texto = limparTexto(budy);

        // Casos de erro
        if (budy.includes("Você está consultando muito rápido")) {
          console.log("⚠️ Consulta muito rápida detectada");
          conn.sendMessage(pendingCommand.targetGroup, {
            text: "⚠️ Você está consultando muito rápido. Por favor, aguarde alguns minutos e tente novamente.",
          });
          delete global.pendingResponses[groupId];
          return;
        }

        if (
          budy.includes(
            "Para consultar utilizando o /nome3 é necessário você especificar alguns digitos do cpf",
          )
        ) {
          console.log("⚠️ Consulta inválida detectada");
          conn.sendMessage(pendingCommand.targetGroup, {
            text: "⚠️ Consulta não realizada!\n\nO link enviado contém um nome incorreto ou mal formatado nos dados do bico.",
          });
          delete global.pendingResponses[groupId];
          return;
        }

        // Quando há lista de pessoas
        if (budy.includes("PESSOAS ENCONTRADAS:")) {
          console.log("✓ Detectada lista de pessoas encontradas na consulta");

          const linhas = texto.split("\n");
          const pessoasLinhas = linhas.filter((linha) =>
            linha.trim().match(/^\d+\s*->\s*[\d.\-]+\s*\|/),
          );

          console.log(`✓ Encontradas ${pessoasLinhas.length} pessoas na lista`);

          if (pessoasLinhas.length > 0) {
            let pessoasInfo = [];

            pessoasLinhas.forEach((linha) => {
              const match = linha.match(
                /\d+\s*->\s*([\d.\-]+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)/,
              );

              if (match) {
                const cpf = match[1].trim();
                const nome = match[2].trim();
                const dadosIdade = match[3].trim();
                const local = match[4].trim();

                pessoasInfo.push({
                  cpf,
                  nome,
                  dadosIdade,
                  local,
                });
              }
            });

            // Filtrar pela localização se disponível
            if (pendingCommand.location) {
              // Função para normalizar texto (remover acentos e converter para maiúsculas)
              const normalizar = (texto) => {
                return texto
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/gi, "")
                  .toUpperCase()
                  .trim();
              };

              // Extrair estado (após " - ")
              const estadoProduto = normalizar(
                pendingCommand.location.split(" - ").pop(),
              );

              // Extrair cidade (antes de " - ", remove tudo após a última vírgula)
              const localidadeProduto = normalizar(
                pendingCommand.location.split(" - ")[0].split(",").pop(),
              );

              console.log(
                `→ Filtrando por Cidade: ${localidadeProduto}, Estado: ${estadoProduto}`,
              );

              pessoasInfo = pessoasInfo.filter((pessoa) => {
                const pessoaCidade = normalizar(pessoa.local.split("/")[0]); // Extrair cidade normalizada
                const pessoaEstado = normalizar(pessoa.local.split("/")[1]); // Extrair estado normalizado

                // Filtrar por estado exato e cidade correspondentes
                return (
                  pessoaEstado === estadoProduto &&
                  pessoaCidade === localidadeProduto
                );
              });

              console.log(
                `✓ Filtradas ${pessoasInfo.length} pessoas para ${localidadeProduto}/${estadoProduto}`,
              );
            }

            if (pessoasInfo.length === 0) {
              conn.sendMessage(pendingCommand.targetGroup, {
                text: "⚠️ Nenhuma pessoa encontrada na localização do produto.",
              });
              delete global.pendingResponses[groupId];
              return;
            }

            const respostaPessoas = pessoasInfo
              .map((pessoa, index) => {
                return `Pessoa ${index + 1}:
CPF: ${pessoa.cpf}
Nome: ${pessoa.nome}
${pessoa.dadosIdade}
Localização: ${pessoa.local}
`;
              })
              .join("\n-----------------\n");

            const mensagemFinal = `🔍 PESSOAS ENCONTRADAS (${pessoasInfo.length}):
    
${respostaPessoas}

⚠️ Use o comando /olx novamente com o CPF desejado para consultar detalhes completos.`;

            conn
              .sendMessage(pendingCommand.targetGroup, { text: mensagemFinal })
              .then(() => {
                console.log("✅ Lista de pessoas enviada com sucesso!");
                delete global.pendingResponses[groupId];
                console.log(
                  "✅ Resposta processada e comando pendente removido!",
                );
              })
              .catch((err) => {
                console.error(
                  "❌ Erro ao enviar lista de pessoas:",
                  err.message,
                );
              });

            return;
          }
        } else {
          // 🔹 Correção principal: extração tolerante de CPF e Nome
          const cpfMatch = texto.match(
            /\*?\s*CPF\s*\*?\s*[:\-]?\s*([0-9.\-]+(?:\s*\([A-Z]{2}\))?)/i,
          );
          const nomeMatch = texto.match(
            /\*?\s*NOME\s*\*?\s*[:\-]?\s*([A-Za-zÀ-ÿ\s]+)/i,
          );

          const cpf = cpfMatch ? cpfMatch[1].trim() : "Não encontrado";
          const nome = nomeMatch ? nomeMatch[1].trim() : "Não encontrado";

          console.log(`✓ Dados extraídos: CPF=${cpf}, Nome=${nome}`);

          // 2. Extrair números de telefone
          const numerosRaw =
            texto.match(/\(\d{2}\)\d{4,5}-\d{4}(?:\s*-\s*[^-\n]*)*/gi) || [];

          console.log(`✓ Números encontrados: ${numerosRaw.length}`);

          const numerosWhatsapp = [];
          const numerosNormais = [];

          numerosRaw.forEach((numero, index) => {
            const isWhatsapp = /whatsapp/i.test(numero);
            const prefixo = index === 0 ? "★ " : "   ";
            const item = `${prefixo}${numero.trim()}`;
            if (isWhatsapp) numerosWhatsapp.push(item);
            else numerosNormais.push(item);
          });

          // 3. Extrair e-mails
          const emailsRaw = texto.match(/[\w.+-]+@[\w.-]+\.\w+/g) || [];
          const emailsFormatados = emailsRaw.map((email) => `   ${email}`);

          console.log(`✓ E-mails encontrados: ${emailsRaw.length}`);

          // 4. Montar resposta
          const resposta = `CPF: ${cpf}
Nome: ${nome}

- ✅ NÚMEROS COM WHATSAPP (${numerosWhatsapp.length}):
${
  numerosWhatsapp.length > 0
    ? numerosWhatsapp.join("\n")
    : "   Nenhum encontrado"
}

- 📞 NÚMEROS SEM WHATSAPP (${numerosNormais.length}):
${
  numerosNormais.length > 0 ? numerosNormais.join("\n") : "   Nenhum encontrado"
}

- ✉️ E-MAILS (${emailsFormatados.length}):
${
  emailsFormatados.length > 0
    ? emailsFormatados.join("\n")
    : "   Nenhum encontrado"
}
`.trim();

          console.log("→ Enviando resposta para:", pendingCommand.targetGroup);

          conn
            .sendMessage(pendingCommand.targetGroup, { text: resposta })
            .then(() => {
              // const listaLimpa = emailsFormatados
              //   .map((e) => e.trim())
              //   .join(",");
              // conn.sendMessage(pendingCommand.targetGroup, {
              //   text: `/enviar ${listaLimpa} CODIGO`,
              // });

              console.log("✅ Resposta enviada com sucesso!");
            })
            .catch((err) => {
              console.error("❌ Erro ao enviar resposta:", err.message);
            });

          delete global.pendingResponses[groupId];
          console.log("✅ Resposta processada e comando pendente removido!");
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar resposta de comando:", error);
    console.error("→ Stack trace:", error.stack);

    const pendingCommand = global.pendingResponses?.[message.key.remoteJid];
    if (pendingCommand) {
      console.error(
        "→ Havia um comando pendente para:",
        pendingCommand.targetGroup,
      );
    }
  }
}
