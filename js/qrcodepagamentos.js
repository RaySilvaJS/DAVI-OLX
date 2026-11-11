const axios = require("axios");
const puppeteer = require("puppeteer");

/**
 * Acessa a URL de redirecionamento e extrai a imagem do QR code em formato base64
 * @param {string} redirectUrl - URL de redirecionamento
 * @returns {Promise<string|null>} Imagem em base64 ou null em caso de erro
 */
async function acessarImagemBase64(redirectUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(redirectUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // Captura a imagem base64 do QR code e o título da div
    const result = await page.evaluate(() => {
      const img = Array.from(document.querySelectorAll("img")).find((i) =>
        i.src.startsWith("data:image/png;base64")
      );

      const qrDiv = document.querySelector("#qrcode");
      const pixTitle = qrDiv ? qrDiv.getAttribute("title") : null;

      return {
        imgBase64: img ? img.src : null,
        pixTitle: pixTitle.replace(/[\r\n\t]/g, ""),
      };
    });

    return result;
  } catch (error) {
    console.error("Erro:", error.message);
    return { imgBase64: null, pixTitle: null, error };
  } finally {
    await browser.close();
  }
}

/**
 * Envia requisição para gerar QR Code e retorna o base64
 */
const token = require("../config.json").token
const config = require("../public/config.json")


async function gerarQRCode() {
  const url = "https://www.br8bet.com/wps/relay/MCSFE_depositByLaunchUrl";

  const headers = {
    Language: "PT",
    "sec-ch-ua-platform": '"Windows"',
    Authorization: token,
    Referer: "https://www.br8bet.com/",
    "sec-ch-ua":
      '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    "X-Timestamp": "1751631143280",
    "sec-ch-ua-mobile": "?0",
    Merchant: "goal11brl",
    ModuleId: "DPSTBAS3",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Content-Type": "application/json",
  };

  const data = {
    targetUsername: "predestinado7",
    amount: "99",
    bankCode: "0155",
    bankType: "PGMT",
    vendorId: "4574387",
    deviceId: "6c8b48b2-491c-4e05-a34b-c238f9a0e66f",
    mcsBankCode: "PAY4ZBRLWL",
    token: token,
  };


  
  // const data = {
  //   targetUsername: "predestinado7",
  //   amount: "99",
  //   bankCode: "0155",
  //   bankType: "PGMT",
  //   vendorId: "4574387",
  //   mcsBankCode: "U2CPAYBRLWL",
  //   token: token
  // };

  try {
    const response = await axios.post(url, data, { headers });
    const redirectUrl = response.data?.value?.redirectUrl;

    if (!redirectUrl) {
      console.log("URL de redirecionamento não encontrada.");
      return null;
    }

    const result = await acessarImagemBase64(redirectUrl);

    return result;
  } catch (error) {
    if (error.response) {
      const message = error.response?.data?.message || error.message || "Erro ao gerar QR Code PIX";
      console.error("❌ Erro ao gerar QR Code PIX:", error.response.status, error.response.data);
      return { status: error.response.status || 500, error: message, details: error.response.data };
    }

    console.error("❌ Erro desconhecido ao gerar QR Code PIX:", error.message);
    return { status: 500, error: error.message || "Erro desconhecido ao gerar QR Code PIX" };
  }
}

module.exports = {
  gerarQRCode
};
