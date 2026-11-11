function extrairTipoConteudo(pagamentoTexto) {
  const texto = String(pagamentoTexto || "").trim();

  if (!texto) {
    return {
      tipo: "texto",
      valor: "Pagamento a combinar.",
    };
  }

  if (/^https?:\/\//i.test(texto) || texto.startsWith("data:image/")) {
    return {
      tipo: "imagem",
      valor: texto,
    };
  }

  return {
    tipo: "texto",
    valor: texto,
  };
}

module.exports = {
  extrairTipoConteudo,
};
