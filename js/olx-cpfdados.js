// // const axios = require("axios");
// // const fs = require("fs");
// // const cheerio = require("cheerio"); // Adicione esta linha para importar cheerio

// // // Função para criar a configuração com ID personalizado
// // function criarConfig(listId) {
// //   return {
// //     method: "get",
// //     maxBodyLength: Infinity,
// //     url: `https://comprasegura.olx.com.br/?listId=${listId}&source=ADVIEW`,
// //     headers: {
// //       accept:
// //         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
// //       "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
// //       "user-agent":
// //         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
// //       "sec-ch-ua":
// //         '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
// //       "sec-ch-ua-mobile": "?0",
// //       "sec-ch-ua-platform": '"Windows"',
// //       "upgrade-insecure-requests": "1",
// //       referer: "https://pa.olx.com.br/",
// //       cookie:
// //         "r_id=0c37e463-ec02-481e-a64b-f0a195df5965; nl_id=3760142a-67eb-430c-89ef-cba4f37c110b; l_id=9a189615-f425-4e3d-8952-f05a994d7efa; _tt_enable_cookie=1; _ttp=01JX5CXH3MJHRG76NN4S7V776E_.tt.2; _fbp=fb.2.1749306754225.217143965748204928; AdoptVisitorId=MYUwRgrAHAbBAsBaeBDAZi5AGNxEE5gYkBmNMGYfMAE2lCA=; __gsas=ID=5a7a4d56fbc9d03d:T=1749306777:RT=1749306777:S=ALNI_MYa2_UrEUu1SHotUzJxfTgmqS_u9w; _cc_id=193482ed181e153470406e0a8a964807; _hjSessionUser_1425418=eyJpZCI6ImRhMDRhZjRhLTk4OTItNTA1ZC04M2Y1LTk4NTIyYzU3MDU2MCIsImNyZWF0ZWQiOjE3NTA2MjI0MjkwOTIsImV4aXN0aW5nIjp0cnVlfQ==; _ga_E6M9NP0QM5=GS2.3.s1750622429$o1$g1$t1750622562$j60$l0$h0; sf_utm_content=; sf_utm_term=; __spdt=21a87c0b9056458eba0605c854992b6f; _ga=GA1.1.1556582239.1749306754; _hjSessionUser_3507498=eyJpZCI6Ijk1ZmExZDlkLTE3ZjctNTVkNC05MmI4LWVlYWE4NGVhZDgwZCIsImNyZWF0ZWQiOjE3NjE1OTk5NTc0NjIsImV4aXN0aW5nIjpmYWxzZX0=; ACC_LL=2|MTAyMzU3NTE0OTI2MTQ5Nzk3Njgz; loginIdentifier=M2NhMmU2ZWNiMmZlMTdhNGFlYzQ3MmY5YzU1OWQ5OGE6OTU3MzZmZDUwYjBjYjM2MGE5ZDEwYjM2ZjMzZjFjNzE5MmZmNTA5YjVmY2YzMmM4ZTVkZmViOTIyNzA1NTY5NDM4YzllMDYzYmI1NDFmNmQ1NzY4MGQ1YmM4MWY2OTMzODFjYzBiMjIwNjY3NDBlMTg3YmZiMzgyZTQ3NTMxY2RjODNkMjRmYTVlMWY2ZTk4N2YyMmRlMmNmYjAxOTA4MDdlYzAzMTI5NTM5Y2Q2ZDk5YWI1ZDRlNTJlZjM2NGJlNzg2MGU3ZGVkNGUwOGFlOGRjMWJlOTk0MmUyMTNmYTJlYzE3NmRhMjczZjUxY2U2ZDgxZTY0MzRkZjVhMGMzZDk4NTE3ZmJhOTcxNTMwZjIyZjI5ZWYyYTdkZjI5MDc3; userID=bef21590-66ac-42b5-9448-841c569fc989; sf_utm_campaign=; _clck=3y1zg6%5E2%5Eg2g%5E0%5E2029; userID=bef21590-66ac-42b5-9448-841c569fc989; ttcsid=1769172931695::9Ze_KakomKdq7Nqa7Ius.54.1769173424813.0; ttcsid_C8LQ3HO3N5R2M2PTDC50=1769172931690::xSgfG0hXjqVSVBpz_niT.54.1769173424814.1; ttcsid_CFL4LE3C77UEUGLEBCA0=1769172931698::s7XgDGZtxL3Wor5y_G5g.54.1769173424814.1; ab.storage.deviceId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3Ac3eda653-b9ec-b9d3-9fed-9dcbddf0bff7%7Ce%3Aundefined%7Cc%3A1767634079079%7Cl%3A1770151036126; ab.storage.userId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3Abef21590-66ac-42b5-9448-841c569fc989%7Ce%3Aundefined%7Cc%3A1767634079062%7Cl%3A1770151036127; ab.storage.sessionId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3A2a799ef1-da35-4ef3-7857-9b10fda9febf%7Ce%3A1770175681744%7Cc%3A1770173881745%7Cl%3A1770173881745; ajs_anonymous_id=87e36019-a451-4a11-b751-2823ba1575c5; badgeStates=hms-settings-li-security-and-privacy|false|2026-03-31; _gcl_au=1.1.913606329.1774960107; pbjs_sharedId=a9dcd03c-b7f1-47f1-bed0-ae23875d370d; pbjs_sharedId_cst=znv0HA%3D%3D; _pubcid=ad894491-819a-49f6-8325-20267f0d04c3; _pubcid_cst=zix7LPQsHA%3D%3D; panoramaId_expiry=1775934285567; panoramaId=2221ab1eb70ea79c2ed1bbfbe7984945a7023813a2f4ea9cf75cc2ad8f817152; sf_utm_source=social_media_ad_share; sf_utm_medium=instagram_stories; TestAB_Groups=lp265_enabled.sa-fg-sc_control.payg-discount-re-julius_ml-ranges.tenerity_ckt.ne-midiav2_A.lp204_control.ng-chatopt_control.ln-midiav1_A.sxp-rmatc_enabled.sa-in-dlv_enabled.ln-chredir_A.lp85_A.topovip_enabled.dpdFsWebMS_control.lp202_enabled.lp206_enabled.new-price_enabled.adv-lit4bo_enabled.lp199_control.lp43_enabled.ng-spam_A.map-im-web_enabled.sanityweb50_A.ai-con-det_control.banner-ecg_enabled.rp-bsc-off_enabled.stempesp_enabled.vc-fmcn_enabled.rp-new-acc_enabled.imo-92fed3_enabled.palq-1528_control.acc-wpp_control.bse-header_control.lp203_control.imo-514362_enabled.sa-inf-ml_control.lp187_enabled; _cfuvid=moLvCD7dHQjTqWOkU26LGuuTiCfqsFRL4BMiyMww1lw-1775831949.963016-1.0.1.1-ASNTvza_wink2QWU.OkjUtycR7pR3Jz2MWGZQe2O6uE; pubaccid=bef21590-66ac-42b5-9448-841c569fc989; s_id=68d446d8-767f-4715-b73c-047385523cb22026-04-10T14:39:11.317740Z; __gads=ID=55d21a50ef530675:T=1749306758:RT=1775831951:S=ALNI_MZrqDwrst9tsMcWwnhd_X7zx9I5ng; __eoi=ID=08d08ee25a5c8cea:T=1765309864:RT=1775831951:S=AA-AfjY8PksnKPh92aG2WTlP1qsQ; mf_b837e449-83ee-457f-9ef5-8f976953f2bc=||1775831952921||0||||0|0|13.78826|0|; _lr_env=eyJ0aW1lc3RhbXAiOjE3NzU4MzE5NTQxMjEsInZlcnNpb24iOiIxLjYuMCIsImVudmVsb3BlIjoiQXVqUEItei1yVDduSkNhS0Y3WFF2eUoxeFBORjVOLVRMOUNrNzk2eHRfZTZ2Nk1kX2laclhuZ2pnWkhNQVc1Ml9zMHY2RjhMTmtPVWFRS3llY0tlQ2tKRGQ3aVZIek5NYUtlOEp2eGtCSlZoQTJPUWlOdGhjamY0c1lqbUh4N0FlMy1HX2tMRFFmRVVyR0pPeWUzeEdmZ29yMjVjQUx0MGlRMzcxN0lZR1NzamE0SjhGZTRnRUU1MThDbUlfeHJqQWxYRWp6ZHdVNmlieElYeWs3dUxFbEhyZkJ3NUpZb3AzSkVZXzdXN0dSMVlFS0ExanB3bldCLWlsMWVHOU1ySXdWdzFNakhrd0xQMFhZYW5TYUQ4WUJESVQ1SnNRZ1FmQllwQ0hMcGI3VzZMeXF5UEx3cFdJZ1RNZVVnMjgxNHI1VUhXbThNbG5ZQUJxdmN6Y3Q4RU1mbVZKbkw2UXFNaDAtSG44MWw2Z3dEcFdSY0hCanBITHNNcmtnIiwiY3JlYXRpb25UaW1lc3RhbXAiOjE3NzUzMjA5NzcyNjl9; _lr_pairId=eyJ0aW1lc3RhbXAiOjE3NzU4MzE5NTQxMjMsInZlcnNpb24iOiIxLjYuMCIsImVudmVsb3BlIjpbIkF2aXduWWpURFlGclFLQUFGZjdPbzFnSVlVcldGRXVjc3RXQ2FwdjU2ZUh0Il0sImNyZWF0aW9uVGltZXN0YW1wIjoxNzc1MzIwOTc3MjcxfQ%3D%3D; cf_clearance=iq.WIfX_bvIAkMh_i2oIePoXKaH2SS40DkdzUu5aKI0-1775831959-1.2.1.1-5xaxfGitRAy8jw4ymqw5FV58Ea3TixpxAmnJi4oxZyJAGKAwa5K0VbrOFF_5yp_RbDxmU6hwmLjDT.aftg4upT9uqcZv6ZqfMpEBF43I0LZU89oZSsJtms3nIBO0rgabgSHoFJKUgy10WFeXU8KiLQjGgiHLUzWiUjevWAteB7EH5Jh_0Lbtikyhe0uqXiDcmi2pUx_wXVul3wqShSG.5ollkotyVEIsJbUsEW6CEyBFgARJdZAWPLn8KV5mzaDnRDi_ZMUjeZXTgwDmIi5vtPKXITvFgGzMPCk00QgRw4cmEjNhx3bsd4QFPxA8hWw1NNbFYPn3gJfedx6Fu3TA.g; __cf_bm=_TBH6nzvVVf8tfCFkbqL5mipiTe2WZ7TrJSVXkBsZkg-1775831959.8746262-1.0.1.1-X.pNPNDGQB8b_BjHg1Wl4uiDweyilU6wXs3tukLvtJeYc0_6rkh.5Yew58BkzaQ224NmyIvjOtEk4BrkIJmXUceUAnUY6HMeRXI26QaL98NFuhRbIDNprboB1423b77C; ___iat_ses=43E1DCAFEAA3A4D9; ___iat_vis=43E1DCAFEAA3A4D9.07e747e87a9ce7d1926cbaf23edcfec7.1775831959653.b9b6e272c28b97ded9139b52f78286b3.ZBRIRRMABA.11111111.1-0.07e747e87a9ce7d1926cbaf23edcfec7; cto_bidid=7O_56V96VHNZbjV0c2RGcjVXS09mYk9ITXZXWHFQcWNuVElpZkpCN0E0SGhXbU83ZnhSTUNSWWYxMXpiaVpidnU2OWI2eDdPM0pzNHFRMkhQY1BmWUJGdnhkRVBSUXZZTzZsbU5ybWV3TWczV2c1OCUzRA; nvg83482=164a43e3c0c7b12c48534f817510|0_101; FCCDCF=%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5B32%2C%22%5B%5C%22a7a92b9e-c964-4b75-b8ec-b0e01f5c0264%5C%22%2C%5B1761589985%2C976000000%5D%5D%22%5D%5D%5D; FCNEC=%5B%5B%22AKsRol84LjYIBssmDBVMM_hKIfM3nu5kMNG4VLmK9hjN_KgkBLzPZeQhfpAMok7AiO6c26eZ3zvTT3Y5G7vY_bPENhv2XPP9Blzq838EzIY8bwHliKYdYQ-DzJ3dEEwacLQ7isHbG9tak0nBwuJdcXfBQyJHrt0cfA%3D%3D%22%5D%5D; is-webview=false; _ga_50C013M2CC=GS2.1.s1775831953$o77$g1$t1775832102$j59$l0$h0; __rtbh.uid=%7B%22eventType%22%3A%22uid%22%2C%22id%22%3A%22bef21590-66ac-42b5-9448-841c569fc989%22%2C%22hash%22%3A%22wBiML0Lv0cEh18cEd5DU%22%2C%22expiryDate%22%3A%222027-04-10T14%3A41%3A42.842Z%22%7D; __rtbh.lid=%7B%22eventType%22%3A%22lid%22%2C%22id%22%3A%2243LnMN33dIrUdp7IuEzf%22%2C%22expiryDate%22%3A%222027-04-10T14%3A41%3A42.842Z%22%7D; cto_bundle=uY4i9F9SJTJGSE82QXp1TGF5V0RRdEVIRUxpVXhIJTJGQ0J1SElMczh0UVN6T0FRYkNLV0d3QzFwVGQ1b2k0UFpCZk4wdVhqcmhtSm1UdmVUbEd6Q0l6TlFKOUklMkJYWUdXRTVvSkMxblptazVUblVoUU1xNFVJVSUyRmdTaDRLQ2UwUWk0c0kwdHJHNGdnRThpTEhmJTJGU0RhQnAxazU2YnpnJTNEJTNE; _dd_s=rum=0&expire=1775833059200",
// //     },
// //   };
// // }

// // function extrairDadosVendedor(html) {
// //   try {
// //     const $ = cheerio.load(html);

// //     let nomeVendedor = null;
// //     let cpfVendedor = null;
// //     let localizacao = null;

// //     // 🔹 Procura qualquer span que tenha "Vendedor:"
// //     $("span").each((_, el) => {
// //       const texto = $(el).text().trim();

// //       if (texto.startsWith("Vendedor:")) {
// //         nomeVendedor = texto.replace("Vendedor:", "").trim();
// //       }

// //       if (texto.startsWith("CPF:")) {
// //         cpfVendedor = texto.replace("CPF:", "").trim();
// //       }

// //       // pega cidade/estado (padrão "- SP", "- RJ" etc)
// //       if (/ - [A-Z]{2}$/.test(texto)) {
// //         localizacao = texto;
// //       }
// //     });

// //     return {
// //       nome: nomeVendedor,
// //       cpf: cpfVendedor,
// //       localizacao,
// //     };
// //   } catch (error) {
// //     console.error("Erro ao extrair dados do vendedor:", error);
// //     return null;
// //   }
// // }

// // // function extrairDadosVendedor(html) {
// // //   try {
// // //     const $ = cheerio.load(html);

// // //     // Procura o texto que contém o nome do vendedor e CPF
// // //     const vendedorElement = $(
// // //       'span.olx-text.olx-text--body-small:contains("Vendedor:")',
// // //     );
// // //     const loc = $(
// // //       "#main > div.grid.w-full.grid-cols-1.pt-4.md\:grid-cols-12.md\:gap-4 > div.flex.w-full.flex-col.gap-4.pb-2.md\:col-span-7.lg\:col-span-8 > div:nth-child(1) > div > div > div.hover\:bg-neutral-80.rounded-1.relative.grid.items-center.overflow-visible.border-1.border-solid.border-secondary-100.grid-cols-1 > div > span > span",
// // //     );

// // //     const cpfElement = $('span.olx-text.olx-text--body-small:contains("CPF:")');

// // //     // Extrair o texto completo
// // //     const vendedorTextoCompleto = vendedorElement.text().trim();
// // //     const cpfTextoCompleto = cpfElement.text().trim();

// // //     console.log("Localização extraída:", loc.text().trim());
// // //     // Extrair apenas o nome do vendedor e CPF
// // //     const nomeVendedor = vendedorTextoCompleto.replace("Vendedor:", "").trim();
// // //     const cpfVendedor = cpfTextoCompleto.replace("CPF:", "").trim();

// // //     return {
// // //       nome: nomeVendedor,
// // //       cpf: cpfVendedor,
// // //     };
// // //   } catch (error) {
// // //     console.error("Erro ao extrair dados do vendedor:", error);
// // //     return null;
// // //   }
// // // }

// // // Nova função para formatar os dados no formato solicitado
// // function formatarDadosVendedor(dados) {
// //   if (!dados || !dados.nome || !dados.cpf) return "/Nome3 Indisponível";

// //   // Extrair componentes do nome
// //   const partsNome = dados.nome.split(" ");
// //   const primeiroNome = partsNome[0] || "";

// //   // Obter as iniciais dos demais nomes
// //   let iniciais = "";
// //   for (let i = 1; i < partsNome.length && i <= 4; i++) {
// //     if (partsNome[i] && partsNome[i].length > 0) {
// //       iniciais += " " + partsNome[i][0].toUpperCase();
// //     }
// //   }

// //   // Preencher com iniciais padrão se faltarem
// //   while (iniciais.split(" ").length <= 4) {
// //     iniciais += " ";
// //   }

// //   // Extrair números do CPF (primeiros 6 dígitos ou o que estiver disponível)
// //   const numerosCpf = dados.cpf.replace(/\D/g, "").substring(0, 6);

// //   return `/nome2 ${primeiroNome}${iniciais}${numerosCpf}`;
// // }

// // // Nova função para buscar informações com ID personalizado
// // async function buscarInfoComId(listId) {
// //   try {
// //     const novaConfig = criarConfig(listId);
// //     const response = await axios.request(novaConfig);

// //     // Extrai os dados do vendedor
// //     const dadosVendedor = extrairDadosVendedor(response.data);

// //     if (dadosVendedor) {
// //       const dadosFormatados = formatarDadosVendedor(dadosVendedor);

// //       const resultDadosOlx = {
// //         dadosOriginais: dadosVendedor,
// //         dadosFormatados: dadosFormatados,
// //         localizacao: dadosVendedor.localizacao || null,
// //       };
// //       console.log("Dados extraídos e formatados:", resultDadosOlx);
// //       return resultDadosOlx;
// //     } else {
// //       console.log(`Não foi possível extrair dados do anúncio ${listId}`);
// //       return null;
// //     }
// //   } catch (error) {
// //     console.error(
// //       `Erro ao buscar informações para o anúncio ${listId}:`,
// //       error.message,
// //     );
// //     return null;
// //   }
// // }

// // // buscarInfoComId("1482671371");

// // // Exporta a função para ser usada por outros scripts
// // module.exports = {
// //   buscarInfoComId,
// //   formatarDadosVendedor,
// //   extrairDadosVendedor,
// // };

// const puppeteer = require("puppeteer");
// const cheerio = require("cheerio");

// // 🔑 COLE SEU COOKIE AQUI
// const COOKIE_STRING = `r_id=0c37e463-ec02-481e-a64b-f0a195df5965; nl_id=3760142a-67eb-430c-89ef-cba4f37c110b; l_id=9a189615-f425-4e3d-8952-f05a994d7efa; _tt_enable_cookie=1; _ttp=01JX5CXH3MJHRG76NN4S7V776E_.tt.2; _fbp=fb.2.1749306754225.217143965748204928; AdoptVisitorId=MYUwRgrAHAbBAsBaeBDAZi5AGNxEE5gYkBmNMGYfMAE2lCA=; __gsas=ID=5a7a4d56fbc9d03d:T=1749306777:RT=1749306777:S=ALNI_MYa2_UrEUu1SHotUzJxfTgmqS_u9w; _cc_id=193482ed181e153470406e0a8a964807; _hjSessionUser_1425418=eyJpZCI6ImRhMDRhZjRhLTk4OTItNTA1ZC04M2Y1LTk4NTIyYzU3MDU2MCIsImNyZWF0ZWQiOjE3NTA2MjI0MjkwOTIsImV4aXN0aW5nIjp0cnVlfQ==; _ga_E6M9NP0QM5=GS2.3.s1750622429$o1$g1$t1750622562$j60$l0$h0; sf_utm_content=; sf_utm_term=; __spdt=21a87c0b9056458eba0605c854992b6f; _ga=GA1.1.1556582239.1749306754; _hjSessionUser_3507498=eyJpZCI6Ijk1ZmExZDlkLTE3ZjctNTVkNC05MmI4LWVlYWE4NGVhZDgwZCIsImNyZWF0ZWQiOjE3NjE1OTk5NTc0NjIsImV4aXN0aW5nIjpmYWxzZX0=; ACC_LL=2|MTAyMzU3NTE0OTI2MTQ5Nzk3Njgz; loginIdentifier=M2NhMmU2ZWNiMmZlMTdhNGFlYzQ3MmY5YzU1OWQ5OGE6OTU3MzZmZDUwYjBjYjM2MGE5ZDEwYjM2ZjMzZjFjNzE5MmZmNTA5YjVmY2YzMmM4ZTVkZmViOTIyNzA1NTY5NDM4YzllMDYzYmI1NDFmNmQ1NzY4MGQ1YmM4MWY2OTMzODFjYzBiMjIwNjY3NDBlMTg3YmZiMzgyZTQ3NTMxY2RjODNkMjRmYTVlMWY2ZTk4N2YyMmRlMmNmYjAxOTA4MDdlYzAzMTI5NTM5Y2Q2ZDk5YWI1ZDRlNTJlZjM2NGJlNzg2MGU3ZGVkNGUwOGFlOGRjMWJlOTk0MmUyMTNmYTJlYzE3NmRhMjczZjUxY2U2ZDgxZTY0MzRkZjVhMGMzZDk4NTE3ZmJhOTcxNTMwZjIyZjI5ZWYyYTdkZjI5MDc3; userID=bef21590-66ac-42b5-9448-841c569fc989; sf_utm_campaign=; _clck=3y1zg6%5E2%5Eg2g%5E0%5E2029; userID=bef21590-66ac-42b5-9448-841c569fc989; ttcsid=1769172931695::9Ze_KakomKdq7Nqa7Ius.54.1769173424813.0; ttcsid_C8LQ3HO3N5R2M2PTDC50=1769172931690::xSgfG0hXjqVSVBpz_niT.54.1769173424814.1; ttcsid_CFL4LE3C77UEUGLEBCA0=1769172931698::s7XgDGZtxL3Wor5y_G5g.54.1769173424814.1; ab.storage.deviceId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3Ac3eda653-b9ec-b9d3-9fed-9dcbddf0bff7%7Ce%3Aundefined%7Cc%3A1767634079079%7Cl%3A1770151036126; ab.storage.userId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3Abef21590-66ac-42b5-9448-841c569fc989%7Ce%3Aundefined%7Cc%3A1767634079062%7Cl%3A1770151036127; ab.storage.sessionId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3A2a799ef1-da35-4ef3-7857-9b10fda9febf%7Ce%3A1770175681744%7Cc%3A1770173881745%7Cl%3A1770173881745; ajs_anonymous_id=87e36019-a451-4a11-b751-2823ba1575c5; badgeStates=hms-settings-li-security-and-privacy|false|2026-03-31; _gcl_au=1.1.913606329.1774960107; pbjs_sharedId=a9dcd03c-b7f1-47f1-bed0-ae23875d370d; pbjs_sharedId_cst=znv0HA%3D%3D; _pubcid=ad894491-819a-49f6-8325-20267f0d04c3; _pubcid_cst=zix7LPQsHA%3D%3D; panoramaId_expiry=1775934285567; panoramaId=2221ab1eb70ea79c2ed1bbfbe7984945a7023813a2f4ea9cf75cc2ad8f817152; sf_utm_source=social_media_ad_share; sf_utm_medium=instagram_stories; TestAB_Groups=lp265_enabled.sa-fg-sc_control.payg-discount-re-julius_ml-ranges.tenerity_ckt.ne-midiav2_A.lp204_control.ng-chatopt_control.ln-midiav1_A.sxp-rmatc_enabled.sa-in-dlv_enabled.ln-chredir_A.lp85_A.topovip_enabled.dpdFsWebMS_control.lp202_enabled.lp206_enabled.new-price_enabled.adv-lit4bo_enabled.lp199_control.lp43_enabled.ng-spam_A.map-im-web_enabled.sanityweb50_A.ai-con-det_control.banner-ecg_enabled.rp-bsc-off_enabled.stempesp_enabled.vc-fmcn_enabled.rp-new-acc_enabled.imo-92fed3_enabled.palq-1528_control.acc-wpp_control.bse-header_control.lp203_control.imo-514362_enabled.sa-inf-ml_control.lp187_enabled; _cfuvid=moLvCD7dHQjTqWOkU26LGuuTiCfqsFRL4BMiyMww1lw-1775831949.963016-1.0.1.1-ASNTvza_wink2QWU.OkjUtycR7pR3Jz2MWGZQe2O6uE; pubaccid=bef21590-66ac-42b5-9448-841c569fc989; s_id=68d446d8-767f-4715-b73c-047385523cb22026-04-10T14:39:11.317740Z; __gads=ID=55d21a50ef530675:T=1749306758:RT=1775831951:S=ALNI_MZrqDwrst9tsMcWwnhd_X7zx9I5ng; __eoi=ID=08d08ee25a5c8cea:T=1765309864:RT=1775831951:S=AA-AfjY8PksnKPh92aG2WTlP1qsQ; mf_b837e449-83ee-457f-9ef5-8f976953f2bc=||1775831952921||0||||0|0|13.78826|0|; _lr_env=eyJ0aW1lc3RhbXAiOjE3NzU4MzE5NTQxMjEsInZlcnNpb24iOiIxLjYuMCIsImVudmVsb3BlIjoiQXVqUEItei1yVDduSkNhS0Y3WFF2eUoxeFBORjVOLVRMOUNrNzk2eHRfZTZ2Nk1kX2laclhuZ2pnWkhNQVc1Ml9zMHY2RjhMTmtPVWFRS3llY0tlQ2tKRGQ3aVZIek5NYUtlOEp2eGtCSlZoQTJPUWlOdGhjamY0c1lqbUh4N0FlMy1HX2tMRFFmRVVyR0pPeWUzeEdmZ29yMjVjQUx0MGlRMzcxN0lZR1NzamE0SjhGZTRnRUU1MThDbUlfeHJqQWxYRWp6ZHdVNmlieElYeWs3dUxFbEhyZkJ3NUpZb3AzSkVZXzdXN0dSMVlFS0ExanB3bldCLWlsMWVHOU1ySXdWdzFNakhrd0xQMFhZYW5TYUQ4WUJESVQ1SnNRZ1FmQllwQ0hMcGI3VzZMeXF5UEx3cFdJZ1RNZVVnMjgxNHI1VUhXbThNbG5ZQUJxdmN6Y3Q4RU1mbVZKbkw2UXFNaDAtSG44MWw2Z3dEcFdSY0hCanBITHNNcmtnIiwiY3JlYXRpb25UaW1lc3RhbXAiOjE3NzUzMjA5NzcyNjl9; _lr_pairId=eyJ0aW1lc3RhbXAiOjE3NzU4MzE5NTQxMjMsInZlcnNpb24iOiIxLjYuMCIsImVudmVsb3BlIjpbIkF2aXduWWpURFlGclFLQUFGZjdPbzFnSVlVcldGRXVjc3RXQ2FwdjU2ZUh0Il0sImNyZWF0aW9uVGltZXN0YW1wIjoxNzc1MzIwOTc3MjcxfQ%3D%3D; cf_clearance=iq.WIfX_bvIAkMh_i2oIePoXKaH2SS40DkdzUu5aKI0-1775831959-1.2.1.1-5xaxfGitRAy8jw4ymqw5FV58Ea3TixpxAmnJi4oxZyJAGKAwa5K0VbrOFF_5yp_RbDxmU6hwmLjDT.aftg4upT9uqcZv6ZqfMpEBF43I0LZU89oZSsJtms3nIBO0rgabgSHoFJKUgy10WFeXU8KiLQjGgiHLUzWiUjevWAteB7EH5Jh_0Lbtikyhe0uqXiDcmi2pUx_wXVul3wqShSG.5ollkotyVEIsJbUsEW6CEyBFgARJdZAWPLn8KV5mzaDnRDi_ZMUjeZXTgwDmIi5vtPKXITvFgGzMPCk00QgRw4cmEjNhx3bsd4QFPxA8hWw1NNbFYPn3gJfedx6Fu3TA.g; __cf_bm=_TBH6nzvVVf8tfCFkbqL5mipiTe2WZ7TrJSVXkBsZkg-1775831959.8746262-1.0.1.1-X.pNPNDGQB8b_BjHg1Wl4uiDweyilU6wXs3tukLvtJeYc0_6rkh.5Yew58BkzaQ224NmyIvjOtEk4BrkIJmXUceUAnUY6HMeRXI26QaL98NFuhRbIDNprboB1423b77C; ___iat_ses=43E1DCAFEAA3A4D9; ___iat_vis=43E1DCAFEAA3A4D9.07e747e87a9ce7d1926cbaf23edcfec7.1775831959653.b9b6e272c28b97ded9139b52f78286b3.ZBRIRRMABA.11111111.1-0.07e747e87a9ce7d1926cbaf23edcfec7; cto_bidid=7O_56V96VHNZbjV0c2RGcjVXS09mYk9ITXZXWHFQcWNuVElpZkpCN0E0SGhXbU83ZnhSTUNSWWYxMXpiaVpidnU2OWI2eDdPM0pzNHFRMkhQY1BmWUJGdnhkRVBSUXZZTzZsbU5ybWV3TWczV2c1OCUzRA; nvg83482=164a43e3c0c7b12c48534f817510|0_101; FCCDCF=%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5B32%2C%22%5B%5C%22a7a92b9e-c964-4b75-b8ec-b0e01f5c0264%5C%22%2C%5B1761589985%2C976000000%5D%5D%22%5D%5D%5D; FCNEC=%5B%5B%22AKsRol84LjYIBssmDBVMM_hKIfM3nu5kMNG4VLmK9hjN_KgkBLzPZeQhfpAMok7AiO6c26eZ3zvTT3Y5G7vY_bPENhv2XPP9Blzq838EzIY8bwHliKYdYQ-DzJ3dEEwacLQ7isHbG9tak0nBwuJdcXfBQyJHrt0cfA%3D%3D%22%5D%5D; is-webview=false; _ga_50C013M2CC=GS2.1.s1775831953$o77$g1$t1775832102$j59$l0$h0; __rtbh.uid=%7B%22eventType%22%3A%22uid%22%2C%22id%22%3A%22bef21590-66ac-42b5-9448-841c569fc989%22%2C%22hash%22%3A%22wBiML0Lv0cEh18cEd5DU%22%2C%22expiryDate%22%3A%222027-04-10T14%3A41%3A42.842Z%22%7D; __rtbh.lid=%7B%22eventType%22%3A%22lid%22%2C%22id%22%3A%2243LnMN33dIrUdp7IuEzf%22%2C%22expiryDate%22%3A%222027-04-10T14%3A41%3A42.842Z%22%7D; cto_bundle=uY4i9F9SJTJGSE82QXp1TGF5V0RRdEVIRUxpVXhIJTJGQ0J1SElMczh0UVN6T0FRYkNLV0d3QzFwVGQ1b2k0UFpCZk4wdVhqcmhtSm1UdmVUbEd6Q0l6TlFKOUklMkJYWUdXRTVvSkMxblptazVUblVoUU1xNFVJVSUyRmdTaDRLQ2UwUWk0c0kwdHJHNGdnRThpTEhmJTJGU0RhQnAxazU2YnpnJTNEJTNE; _dd_s=rum=0&expire=1775833059200`;

// // 🔄 Converter cookies
// function parseCookies(cookieString) {
//   return cookieString.split(";").map((cookie) => {
//     const parts = cookie.split("=");
//     const name = parts.shift().trim();
//     const value = parts.join("=");
//     return {
//       name,
//       value,
//       domain: ".olx.com.br",
//       path: "/",
//     };
//   });
// }

// // 🔎 Extrair dados
// function extrairDadosVendedor(html) {
//   try {
//     const $ = cheerio.load(html);

//     let nome = null;
//     let cpf = null;
//     let localizacao = null;

//     $("span").each((_, el) => {
//       const texto = $(el).text().trim();

//       if (texto.startsWith("Vendedor:")) {
//         nome = texto.replace("Vendedor:", "").trim();
//       }

//       if (texto.startsWith("CPF:")) {
//         cpf = texto.replace("CPF:", "").trim();
//       }

//       if (/ - [A-Z]{2}$/.test(texto)) {
//         localizacao = texto;
//       }
//     });

//     return { nome, cpf, localizacao };
//   } catch (err) {
//     console.log("Erro ao extrair:", err);
//     return null;
//   }
// }

// // 🔧 FORMATAR IGUAL SEU SISTEMA
// function formatarDadosVendedor(dados) {
//   if (!dados || !dados.nome || !dados.cpf) return "/Nome3 Indisponível";

//   const partsNome = dados.nome.split(" ");
//   const primeiroNome = partsNome[0] || "";

//   let iniciais = "";
//   for (let i = 1; i < partsNome.length && i <= 4; i++) {
//     if (partsNome[i]) {
//       iniciais += " " + partsNome[i][0].toUpperCase();
//     }
//   }

//   const numerosCpf = dados.cpf.replace(/\D/g, "").substring(0, 6);

//   return `/nome2 ${primeiroNome}${iniciais}${numerosCpf}`;
// }

// // 🚀 FUNÇÃO PRINCIPAL (PADRÃO DO SEU SISTEMA)
// async function buscarInfoComId(listId) {
//   let browser;

//   try {
//     browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox"],
//     });

//     const page = await browser.newPage();

//     // 🍪 Injeta cookies
//     const cookies = parseCookies(COOKIE_STRING);
//     await page.setCookie(...cookies);

//     await page.goto(`https://comprasegura.olx.com.br/?listId=${listId}`, {
//       waitUntil: "networkidle2",
//       timeout: 60000,
//     });

//     await new Promise((r) => setTimeout(r, 5000));

//     const urlAtual = page.url();

//     if (urlAtual.includes("acesso")) {
//       console.log("❌ Token inválido");
//       return null;
//     }

//     const html = await page.content();

//     const dadosVendedor = extrairDadosVendedor(html);

//     if (dadosVendedor) {
//       const dadosFormatados = formatarDadosVendedor(dadosVendedor);

//       const resultDadosOlx = {
//         dadosOriginais: dadosVendedor,
//         dadosFormatados: dadosFormatados,
//         localizacao: dadosVendedor.localizacao || null,
//       };

//       return resultDadosOlx;
//     } else {
//       return null;
//     }
//   } catch (error) {
//     console.log("Erro:", error.message);
//     return null;
//   } finally {
//     if (browser) await browser.close();
//   }
// }

// // EXPORT IGUAL SEU PADRÃO
// module.exports = {
//   buscarInfoComId,
//   formatarDadosVendedor,
//   extrairDadosVendedor,
// };

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

// 🔑 COOKIE
const COOKIE_STRING = `r_id=0c37e463-ec02-481e-a64b-f0a195df5965; nl_id=3760142a-67eb-430c-89ef-cba4f37c110b; l_id=9a189615-f425-4e3d-8952-f05a994d7efa; _tt_enable_cookie=1; _ttp=01JX5CXH3MJHRG76NN4S7V776E_.tt.2; _fbp=fb.2.1749306754225.217143965748204928; AdoptVisitorId=MYUwRgrAHAbBAsBaeBDAZi5AGNxEE5gYkBmNMGYfMAE2lCA=; __gsas=ID=5a7a4d56fbc9d03d:T=1749306777:RT=1749306777:S=ALNI_MYa2_UrEUu1SHotUzJxfTgmqS_u9w; _cc_id=193482ed181e153470406e0a8a964807; _hjSessionUser_1425418=eyJpZCI6ImRhMDRhZjRhLTk4OTItNTA1ZC04M2Y1LTk4NTIyYzU3MDU2MCIsImNyZWF0ZWQiOjE3NTA2MjI0MjkwOTIsImV4aXN0aW5nIjp0cnVlfQ==; _ga_E6M9NP0QM5=GS2.3.s1750622429$o1$g1$t1750622562$j60$l0$h0; sf_utm_content=; sf_utm_term=; __spdt=21a87c0b9056458eba0605c854992b6f; _ga=GA1.1.1556582239.1749306754; _hjSessionUser_3507498=eyJpZCI6Ijk1ZmExZDlkLTE3ZjctNTVkNC05MmI4LWVlYWE4NGVhZDgwZCIsImNyZWF0ZWQiOjE3NjE1OTk5NTc0NjIsImV4aXN0aW5nIjpmYWxzZX0=; ACC_LL=2|MTAyMzU3NTE0OTI2MTQ5Nzk3Njgz; loginIdentifier=M2NhMmU2ZWNiMmZlMTdhNGFlYzQ3MmY5YzU1OWQ5OGE6OTU3MzZmZDUwYjBjYjM2MGE5ZDEwYjM2ZjMzZjFjNzE5MmZmNTA5YjVmY2YzMmM4ZTVkZmViOTIyNzA1NTY5NDM4YzllMDYzYmI1NDFmNmQ1NzY4MGQ1YmM4MWY2OTMzODFjYzBiMjIwNjY3NDBlMTg3YmZiMzgyZTQ3NTMxY2RjODNkMjRmYTVlMWY2ZTk4N2YyMmRlMmNmYjAxOTA4MDdlYzAzMTI5NTM5Y2Q2ZDk5YWI1ZDRlNTJlZjM2NGJlNzg2MGU3ZGVkNGUwOGFlOGRjMWJlOTk0MmUyMTNmYTJlYzE3NmRhMjczZjUxY2U2ZDgxZTY0MzRkZjVhMGMzZDk4NTE3ZmJhOTcxNTMwZjIyZjI5ZWYyYTdkZjI5MDc3; userID=bef21590-66ac-42b5-9448-841c569fc989; sf_utm_campaign=; _clck=3y1zg6%5E2%5Eg2g%5E0%5E2029; userID=bef21590-66ac-42b5-9448-841c569fc989; ttcsid=1769172931695::9Ze_KakomKdq7Nqa7Ius.54.1769173424813.0; ttcsid_C8LQ3HO3N5R2M2PTDC50=1769172931690::xSgfG0hXjqVSVBpz_niT.54.1769173424814.1; ttcsid_CFL4LE3C77UEUGLEBCA0=1769172931698::s7XgDGZtxL3Wor5y_G5g.54.1769173424814.1; ab.storage.deviceId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3Ac3eda653-b9ec-b9d3-9fed-9dcbddf0bff7%7Ce%3Aundefined%7Cc%3A1767634079079%7Cl%3A1770151036126; ab.storage.userId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3Abef21590-66ac-42b5-9448-841c569fc989%7Ce%3Aundefined%7Cc%3A1767634079062%7Cl%3A1770151036127; ab.storage.sessionId.c911c7ba-781d-4f65-8373-2449fe0fc0c8=g%3A2a799ef1-da35-4ef3-7857-9b10fda9febf%7Ce%3A1770175681744%7Cc%3A1770173881745%7Cl%3A1770173881745; ajs_anonymous_id=87e36019-a451-4a11-b751-2823ba1575c5; badgeStates=hms-settings-li-security-and-privacy|false|2026-03-31; _gcl_au=1.1.913606329.1774960107; pbjs_sharedId=a9dcd03c-b7f1-47f1-bed0-ae23875d370d; pbjs_sharedId_cst=znv0HA%3D%3D; _pubcid=ad894491-819a-49f6-8325-20267f0d04c3; _pubcid_cst=zix7LPQsHA%3D%3D; panoramaId_expiry=1775934285567; panoramaId=2221ab1eb70ea79c2ed1bbfbe7984945a7023813a2f4ea9cf75cc2ad8f817152; sf_utm_source=social_media_ad_share; sf_utm_medium=instagram_stories; TestAB_Groups=lp265_enabled.sa-fg-sc_control.payg-discount-re-julius_ml-ranges.tenerity_ckt.ne-midiav2_A.lp204_control.ng-chatopt_control.ln-midiav1_A.sxp-rmatc_enabled.sa-in-dlv_enabled.ln-chredir_A.lp85_A.topovip_enabled.dpdFsWebMS_control.lp202_enabled.lp206_enabled.new-price_enabled.adv-lit4bo_enabled.lp199_control.lp43_enabled.ng-spam_A.map-im-web_enabled.sanityweb50_A.ai-con-det_control.banner-ecg_enabled.rp-bsc-off_enabled.stempesp_enabled.vc-fmcn_enabled.rp-new-acc_enabled.imo-92fed3_enabled.palq-1528_control.acc-wpp_control.bse-header_control.lp203_control.imo-514362_enabled.sa-inf-ml_control.lp187_enabled; _cfuvid=moLvCD7dHQjTqWOkU26LGuuTiCfqsFRL4BMiyMww1lw-1775831949.963016-1.0.1.1-ASNTvza_wink2QWU.OkjUtycR7pR3Jz2MWGZQe2O6uE; pubaccid=bef21590-66ac-42b5-9448-841c569fc989; s_id=68d446d8-767f-4715-b73c-047385523cb22026-04-10T14:39:11.317740Z; __gads=ID=55d21a50ef530675:T=1749306758:RT=1775831951:S=ALNI_MZrqDwrst9tsMcWwnhd_X7zx9I5ng; __eoi=ID=08d08ee25a5c8cea:T=1765309864:RT=1775831951:S=AA-AfjY8PksnKPh92aG2WTlP1qsQ; mf_b837e449-83ee-457f-9ef5-8f976953f2bc=||1775831952921||0||||0|0|13.78826|0|; _lr_env=eyJ0aW1lc3RhbXAiOjE3NzU4MzE5NTQxMjEsInZlcnNpb24iOiIxLjYuMCIsImVudmVsb3BlIjoiQXVqUEItei1yVDduSkNhS0Y3WFF2eUoxeFBORjVOLVRMOUNrNzk2eHRfZTZ2Nk1kX2laclhuZ2pnWkhNQVc1Ml9zMHY2RjhMTmtPVWFRS3llY0tlQ2tKRGQ3aVZIek5NYUtlOEp2eGtCSlZoQTJPUWlOdGhjamY0c1lqbUh4N0FlMy1HX2tMRFFmRVVyR0pPeWUzeEdmZ29yMjVjQUx0MGlRMzcxN0lZR1NzamE0SjhGZTRnRUU1MThDbUlfeHJqQWxYRWp6ZHdVNmlieElYeWs3dUxFbEhyZkJ3NUpZb3AzSkVZXzdXN0dSMVlFS0ExanB3bldCLWlsMWVHOU1ySXdWdzFNakhrd0xQMFhZYW5TYUQ4WUJESVQ1SnNRZ1FmQllwQ0hMcGI3VzZMeXF5UEx3cFdJZ1RNZVVnMjgxNHI1VUhXbThNbG5ZQUJxdmN6Y3Q4RU1mbVZKbkw2UXFNaDAtSG44MWw2Z3dEcFdSY0hCanBITHNNcmtnIiwiY3JlYXRpb25UaW1lc3RhbXAiOjE3NzUzMjA5NzcyNjl9; _lr_pairId=eyJ0aW1lc3RhbXAiOjE3NzU4MzE5NTQxMjMsInZlcnNpb24iOiIxLjYuMCIsImVudmVsb3BlIjpbIkF2aXduWWpURFlGclFLQUFGZjdPbzFnSVlVcldGRXVjc3RXQ2FwdjU2ZUh0Il0sImNyZWF0aW9uVGltZXN0YW1wIjoxNzc1MzIwOTc3MjcxfQ%3D%3D; cf_clearance=iq.WIfX_bvIAkMh_i2oIePoXKaH2SS40DkdzUu5aKI0-1775831959-1.2.1.1-5xaxfGitRAy8jw4ymqw5FV58Ea3TixpxAmnJi4oxZyJAGKAwa5K0VbrOFF_5yp_RbDxmU6hwmLjDT.aftg4upT9uqcZv6ZqfMpEBF43I0LZU89oZSsJtms3nIBO0rgabgSHoFJKUgy10WFeXU8KiLQjGgiHLUzWiUjevWAteB7EH5Jh_0Lbtikyhe0uqXiDcmi2pUx_wXVul3wqShSG.5ollkotyVEIsJbUsEW6CEyBFgARJdZAWPLn8KV5mzaDnRDi_ZMUjeZXTgwDmIi5vtPKXITvFgGzMPCk00QgRw4cmEjNhx3bsd4QFPxA8hWw1NNbFYPn3gJfedx6Fu3TA.g; __cf_bm=_TBH6nzvVVf8tfCFkbqL5mipiTe2WZ7TrJSVXkBsZkg-1775831959.8746262-1.0.1.1-X.pNPNDGQB8b_BjHg1Wl4uiDweyilU6wXs3tukLvtJeYc0_6rkh.5Yew58BkzaQ224NmyIvjOtEk4BrkIJmXUceUAnUY6HMeRXI26QaL98NFuhRbIDNprboB1423b77C; ___iat_ses=43E1DCAFEAA3A4D9; ___iat_vis=43E1DCAFEAA3A4D9.07e747e87a9ce7d1926cbaf23edcfec7.1775831959653.b9b6e272c28b97ded9139b52f78286b3.ZBRIRRMABA.11111111.1-0.07e747e87a9ce7d1926cbaf23edcfec7; cto_bidid=7O_56V96VHNZbjV0c2RGcjVXS09mYk9ITXZXWHFQcWNuVElpZkpCN0E0SGhXbU83ZnhSTUNSWWYxMXpiaVpidnU2OWI2eDdPM0pzNHFRMkhQY1BmWUJGdnhkRVBSUXZZTzZsbU5ybWV3TWczV2c1OCUzRA; nvg83482=164a43e3c0c7b12c48534f817510|0_101; FCCDCF=%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5B32%2C%22%5B%5C%22a7a92b9e-c964-4b75-b8ec-b0e01f5c0264%5C%22%2C%5B1761589985%2C976000000%5D%5D%22%5D%5D%5D; FCNEC=%5B%5B%22AKsRol84LjYIBssmDBVMM_hKIfM3nu5kMNG4VLmK9hjN_KgkBLzPZeQhfpAMok7AiO6c26eZ3zvTT3Y5G7vY_bPENhv2XPP9Blzq838EzIY8bwHliKYdYQ-DzJ3dEEwacLQ7isHbG9tak0nBwuJdcXfBQyJHrt0cfA%3D%3D%22%5D%5D; is-webview=false; _ga_50C013M2CC=GS2.1.s1775831953$o77$g1$t1775832102$j59$l0$h0; __rtbh.uid=%7B%22eventType%22%3A%22uid%22%2C%22id%22%3A%22bef21590-66ac-42b5-9448-841c569fc989%22%2C%22hash%22%3A%22wBiML0Lv0cEh18cEd5DU%22%2C%22expiryDate%22%3A%222027-04-10T14%3A41%3A42.842Z%22%7D; __rtbh.lid=%7B%22eventType%22%3A%22lid%22%2C%22id%22%3A%2243LnMN33dIrUdp7IuEzf%22%2C%22expiryDate%22%3A%222027-04-10T14%3A41%3A42.842Z%22%7D; cto_bundle=uY4i9F9SJTJGSE82QXp1TGF5V0RRdEVIRUxpVXhIJTJGQ0J1SElMczh0UVN6T0FRYkNLV0d3QzFwVGQ1b2k0UFpCZk4wdVhqcmhtSm1UdmVUbEd6Q0l6TlFKOUklMkJYWUdXRTVvSkMxblptazVUblVoUU1xNFVJVSUyRmdTaDRLQ2UwUWk0c0kwdHJHNGdnRThpTEhmJTJGU0RhQnAxazU2YnpnJTNEJTNE; _dd_s=rum=0&expire=1775833059200`;

// 🔄 Converter cookies
function parseCookies(cookieString) {
  return cookieString.split(";").map((cookie) => {
    const parts = cookie.split("=");
    const name = parts.shift().trim();
    const value = parts.join("=");
    return {
      name,
      value,
      domain: ".olx.com.br",
      path: "/",
    };
  });
}

// 🔎 Extrair dados
function extrairDadosVendedor(html) {
  const $ = cheerio.load(html);

  let nome = null;
  let cpf = null;
  let localizacao = null;

  $("span").each((_, el) => {
    const texto = $(el).text().trim();

    if (texto.startsWith("Vendedor:")) {
      nome = texto.replace("Vendedor:", "").trim();
    }

    if (texto.startsWith("CPF:")) {
      cpf = texto.replace("CPF:", "").trim();
    }

    if (/ - [A-Z]{2}$/.test(texto)) {
      localizacao = texto;
    }
  });

  return { nome, cpf, localizacao };
}

// 🔧 FORMATAR
function formatarDadosVendedor(dados) {
  if (!dados || !dados.nome || !dados.cpf) return "/Nome3 Indisponível";

  const partsNome = dados.nome.split(" ");
  const primeiroNome = partsNome[0] || "";

  let iniciais = "";
  for (let i = 1; i < partsNome.length && i <= 4; i++) {
    if (partsNome[i]) {
      iniciais += " " + partsNome[i][0].toUpperCase();
    }
  }

  const numerosCpf = dados.cpf.replace(/\D/g, "").substring(0, 6);

  return `/nome2 ${primeiroNome}${iniciais}${numerosCpf}`;
}

// 🚀 FUNÇÃO PRINCIPAL
async function buscarInfoComId(listId) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false, // 🔥 IMPORTANTE (anti-block)
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    // 🧠 Anti-detecção
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    );

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    console.log("🍪 Injetando cookies...");
    const cookies = parseCookies(COOKIE_STRING);
    await page.setCookie(...cookies);

    console.log("🌐 Acessando página...");
    await page.goto(`https://comprasegura.olx.com.br/?listId=${listId}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 🔥 ESPERA INTELIGENTE (ESSENCIAL)
    await page.waitForFunction(
      () => {
        return document.body.innerText.includes("Vendedor:");
      },
      { timeout: 15000 },
    );

    const urlAtual = page.url();

    if (urlAtual.includes("acesso")) {
      console.log("❌ Token inválido");
      return null;
    }

    console.log("✅ Token válido");

    const html = await page.content();

    const dados = extrairDadosVendedor(html);

    const resultado = {
      dadosOriginais: dados,
      dadosFormatados: formatarDadosVendedor(dados),
      localizacao: dados.localizacao || null,
    };

    console.log("📦 RESULTADO:", resultado);

    return resultado;
  } catch (error) {
    console.log("Erro:", error.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

// 🔥 EXPORT
module.exports = {
  buscarInfoComId,
  formatarDadosVendedor,
  extrairDadosVendedor,
};