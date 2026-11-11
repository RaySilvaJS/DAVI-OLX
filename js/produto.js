const puppeteer = require("puppeteer");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function obterConfiguracaoProxy() {
  const proxyRaw = process.env.OLX_PROXY_URL;
  if (!proxyRaw) return null;

  try {
    const proxyUrl = proxyRaw.includes("://")
      ? new URL(proxyRaw)
      : new URL(`http://${proxyRaw}`);

    const servidor = `${proxyUrl.protocol}//${proxyUrl.hostname}${proxyUrl.port ? `:${proxyUrl.port}` : ""}`;
    const username = decodeURIComponent(proxyUrl.username || "");
    const password = decodeURIComponent(proxyUrl.password || "");

    return {
      servidor,
      auth: username ? { username, password } : null,
    };
  } catch (erro) {
    console.error("Proxy OLX_PROXY_URL inválido:", erro.message);
    return null;
  }
}

async function fecharConsentimentoCookies(page) {
  try {
    await page.evaluate(() => {
      const seletoresBotao = [
        "#didomi-notice-agree-button",
        ".didomi-continue-without-agreeing",
        "#onetrust-accept-btn-handler",
        'button[id*="consent" i]',
      ];
      for (const sel of seletoresBotao) {
        const btn = document.querySelector(sel);
        if (btn) {
          btn.click();
          return;
        }
      }

      const textosAceitar = ["consent", "aceitar", "concordo", "concordar"];
      const botoes = Array.from(document.querySelectorAll("button"));
      const alvo = botoes.find((b) => {
        const texto = (b.innerText || "").trim().toLowerCase();
        return textosAceitar.some((t) => texto === t || texto.includes(t));
      });
      if (alvo) alvo.click();
    });
  } catch (e) {
    /* ignora se não houver popup de consentimento */
  }
  await wait(500);
}

async function extrairDadosProdutoOLX(url) {
  const configProxy = obterConfiguracaoProxy();

  const launchArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-blink-features=AutomationControlled",
  ];

  if (configProxy?.servidor) {
    launchArgs.push(`--proxy-server=${configProxy.servidor}`);
    console.log(`Usando proxy OLX: ${configProxy.servidor}`);
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: launchArgs,
  });

  try {
    let ultimoResultado = null;

    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const page = await browser.newPage();

      if (configProxy?.auth) {
        await page.authenticate(configProxy.auth);
      }

      await page.setViewport({ width: 1366, height: 768 });
      await page.setExtraHTTPHeaders({
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      });
      await page.setUserAgent(USER_AGENTS[tentativa % USER_AGENTS.length]);

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => false,
        });
      });

      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      await fecharConsentimentoCookies(page);

      await page
        .waitForSelector("span.typo-body-small.text-neutral-120.font-regular", {
          timeout: 8000,
        })
        .catch(() => {
          /* ignora se não aparecer */
        });
      await page.waitForSelector("h1", { timeout: 8000 }).catch(() => {
        /* ignora se não aparecer */
      });
      await page
        .waitForFunction(
          () => {
            const h1 = document.querySelector("h1");
            const preco = document.querySelector("#price-box-container");
            return h1?.innerText?.trim() && preco?.innerText?.includes("R$");
          },
          { timeout: 10000 }
        )
        .catch(() => {
          /* ignora se não hidratar a tempo */
        });

      const dados = await page.evaluate(() => {
        const textoPagina = (document.body?.innerText || "").toLowerCase();
        const tituloPagina = (document.title || "").toLowerCase();
        const bloqueado =
          textoPagina.includes("sorry, you have been blocked") ||
          textoPagina.includes("you have been blocked") ||
          textoPagina.includes("access denied") ||
          tituloPagina.includes("blocked");

        if (bloqueado) {
          return {
            bloqueado: true,
            titulo: null,
            preco: null,
            nomeDono: null,
            vendasConcluidas: null,
            descricao: null,
            localizacao: null,
            imagens: [],
            url: window.location.href,
            dataExtracao: new Date().toISOString(),
          };
        }

        const textOf = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const texto = (el.innerText || el.textContent || "").trim();
          return texto || null;
        };

        const textoTitulo = () => {
          const candidatos = Array.from(document.querySelectorAll("h1"));
          const valido = candidatos.find((el) => {
            const texto = (el.innerText || el.textContent || "").trim();
            if (!texto) return false;
            const dentroDeConsentimento = el.closest(
              '[id*="didomi" i], [class*="didomi" i], [id*="onetrust" i], [class*="onetrust" i], [id*="consent" i], [class*="consent" i], [id*="cookie" i], [class*="cookie" i]'
            );
            return !dentroDeConsentimento;
          });
          return valido ? valido.innerText.trim() : null;
        };

        const allTexts = (sel) => {
          const nodes = Array.from(document.querySelectorAll(sel) || []);
          return nodes.map((n) => n.innerText.trim());
        };

        const obterImagens = () =>
          Array.from(document.querySelectorAll("img"))
            .map((img) => img.src)
            .filter((src) => src && src.includes("olx"));

        const spans = allTexts(
          "span.typo-body-small.text-neutral-120.font-regular"
        );

        let localizacao = spans && spans.length > 1 ? spans[1] : null;

        if (!localizacao) {
          const withComma = spans.find((s) => s && s.includes(","));
          if (withComma) localizacao = withComma;
        }

        if (!localizacao) {
          try {
            const pathElems = Array.from(document.querySelectorAll("svg path"));
            const match = pathElems.find(
              (p) =>
                p.getAttribute("d") &&
                p.getAttribute("d").includes("17.0444645,19.6408084")
            );
            if (match) {
              const container = match.closest(".flex") || match.closest("div");
              const span = container
                ? container.querySelector(
                    "span.typo-body-small.text-neutral-120.font-regular"
                  )
                : null;
              if (span) localizacao = span.innerText.trim();
            }
          } catch (e) {
            /* ignora */
          }
        }

        return {
          titulo:
            textoTitulo() ||
            textOf("#description-title span.typo-title-medium") ||
            textOf("#description-title"),
          preco:
            (
              textOf("#price-box-container span.font-semibold.text-neutral-100") ||
              textOf("#price-box-container .typo-display-large") ||
              ""
            )
              .replace("R$", "")
              .replace(/\./g, "")
              .trim() || null,
          nomeDono: textOf("span.typo-body-large[class*='ad__sc-ypp2u2-4']"),
          vendasConcluidas: textOf("span.typo-body-large.font-semibold.mr-0-25"),
          descricao: textOf(".advc-ad-description__lines") || textOf(".advc-ad-description"),
          localizacao,
          imagens: obterImagens(),
          url: window.location.href,
          dataExtracao: new Date().toISOString(),
        };
      });

      ultimoResultado = dados;
      await page.close();

      if (!dados?.bloqueado) {
        break;
      }

      await wait(2000 + tentativa * 1000);
    }

    const dados = ultimoResultado;

    if (dados?.bloqueado) {
      await browser.close();
      return {
        sucesso: true,
        bloqueado: true,
        erro:
          "A OLX bloqueou temporariamente a coleta automatica. Continue preenchendo manualmente.",
        dados,
      };
    }

    await browser.close();
    console.log("Dados extraídos com sucesso:", dados);
    return { sucesso: true, dados };
  } catch (erro) {
    try {
      await browser.close();
    } catch (e) {
      /* ignora */
    }
    console.error("Erro na extração:", erro);
    return {
      sucesso: false,
      erro: erro.message,
    };
  }
}


module.exports = { extrairDadosProduto: extrairDadosProdutoOLX };