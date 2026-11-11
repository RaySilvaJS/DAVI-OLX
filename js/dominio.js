const fs = require("fs");
const path = require("path");

const DOMINIO_PADRAO = "www.desapegaareadevendidos.online";
const CONFIG_PATH = path.join(__dirname, "..", "config.json");

// Aceita "dominio.com", "www.dominio.com", "https://dominio.com/pag" etc.
// Retorna só o host em minúsculas, ou null se for inválido.
function normalizarDominio(entrada) {
  const host = String(entrada || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(/[/?#]/)[0];

  const valido = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(host);
  return valido ? host : null;
}

// Lê do config.json a cada chamada para valer sem reiniciar o bot
function getDominio() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return normalizarDominio(cfg.dominio) || DOMINIO_PADRAO;
  } catch {
    return DOMINIO_PADRAO;
  }
}

function linkProduto(codigo) {
  return `https://${getDominio()}/pag/?id=${codigo}`;
}

module.exports = { DOMINIO_PADRAO, normalizarDominio, getDominio, linkProduto };
