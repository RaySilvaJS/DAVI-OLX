document.addEventListener("DOMContentLoaded", function () {
  // Obter ID da URL
  const params = new URLSearchParams(window.location.search);
  const vendaId = params.get("id");

  if (!vendaId) {
    // Sem ID na URL, mostrar mensagem de erro
    mostrarErro();
    return;
  }

  // Carregar dados da venda
  buscarDadosVenda(vendaId);

  // Adicionar event listeners para botões
  adicionarEventListeners();

  // Mostrar modal de sucesso após 10 segundos
  setTimeout(() => {
    const modal = document.getElementById("sucesso-modal");
    if (modal) {
      modal.classList.remove("hidden");
      setTimeout(() => {
        modal.classList.add("show");
      }, 50);
    }
  }, 10000);
});

async function buscarDadosVenda(id) {
  try {
    const response = await fetch(`/api/venda/${id}`);

    if (!response.ok) {
      throw new Error(`Venda não encontrada (Erro ${response.status})`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Resposta inválida do servidor - esperado JSON");
    }

    const venda = await response.json();

    if (!venda || typeof venda !== "object") {
      throw new Error("Dados de venda inválidos");
    }

    restaurarPagina();
    preencherDadosVenda(venda);
  } catch (error) {
    console.warn("Falha ao buscar venda via API, tentando JSON local:", error);
    buscarVendaLocal(id);
  }
}

async function buscarVendaLocal(id) {
  try {
    const response = await fetch("/data/vendas.json");

    if (!response.ok) {
      throw new Error(
        `Falha ao carregar vendas.json (Erro ${response.status})`,
      );
    }

    const vendas = await response.json();
    if (!Array.isArray(vendas)) {
      throw new Error("Formato inválido de vendas.json");
    }

    const venda = vendas.find((item) => item.codigo === id);
    if (!venda) {
      throw new Error(`Venda ${id} não encontrada em vendas.json`);
    }

    restaurarPagina();
    preencherDadosVenda(venda);
  } catch (error) {
    console.error("Erro ao buscar venda no JSON local:", error);
    mostrarErro();
  }
}

function restaurarPagina() {
  const mainContent = document.querySelector(".main-content");
  const sucessoBanner = document.querySelector(".sucesso-banner");
  const dicasSeguranca = document.querySelector(".dicas-seguranca");
  const erroContainer = document.getElementById("erro-container");

  if (mainContent) mainContent.style.display = "";
  if (sucessoBanner) sucessoBanner.style.display = "";
  if (dicasSeguranca) dicasSeguranca.style.display = "";
  if (erroContainer) erroContainer.classList.add("hidden");
}

function criarPlaceholderImagem(produto) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#6e0ad6";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(produto || "Produto OLX", canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL("image/png");
}

function aplicarFallbackImagem(imgElement, produto) {
  imgElement.onerror = null;
  imgElement.src = criarPlaceholderImagem(produto);
}

function getImageSource(imgSrc) {
  if (typeof imgSrc !== "string") return "";
  if (/^https?:\/\//i.test(imgSrc)) {
    return `/proxy-image?url=${encodeURIComponent(imgSrc)}`;
  }
  return imgSrc;
}

function preencherDadosVenda(venda) {
  // Validar dados essenciais
  if (!venda) {
    console.error("Dados de venda não fornecidos");
    mostrarErro();
    return;
  }

  // Preencher dados do produto
  const produtoNomeEl = document.getElementById("produto-nome");
  const produtoValorEl = document.getElementById("produto-valor");
  const produtoDataEl = document.getElementById("produto-data");

  if (produtoNomeEl) produtoNomeEl.textContent = venda.produto || "Produto";
  if (produtoValorEl)
    produtoValorEl.textContent = `R$ ${(venda.valor || 0).toLocaleString("pt-BR")}`;
  if (produtoDataEl)
    produtoDataEl.textContent = venda.dataVenda || "Data não informada";

  // Configura as imagens do produto
  const imagemPrincipalEl = document.getElementById("produto-imagem-principal");
  const galeriaMiniaturasEl = document.getElementById("galeria-miniaturas");

  if (galeriaMiniaturasEl) {
    galeriaMiniaturasEl.innerHTML = ""; // Limpa miniaturas existentes
  }

  const definirImagemPrincipal = (src) => {
    if (!imagemPrincipalEl) return;
    imagemPrincipalEl.alt = venda.produto || "Imagem do produto";
    imagemPrincipalEl.onerror = function (event) {
      console.error("Erro ao carregar imagem principal:", src, event);
      aplicarFallbackImagem(this, venda.produto);
    };
    imagemPrincipalEl.src = getImageSource(src);
  };

  const criarMiniatura = (imgSrc, index) => {
    const miniatura = document.createElement("img");
    miniatura.alt = `${venda.produto} - Imagem ${index + 1}`;
    miniatura.classList.add("miniatura");
    if (index === 0) miniatura.classList.add("ativa");

    miniatura.onerror = function (event) {
      console.error("Erro ao carregar miniatura:", imgSrc, event);
      aplicarFallbackImagem(this, venda.produto);
    };
    miniatura.src = getImageSource(imgSrc);

    const ativarMiniatura = () => {
      definirImagemPrincipal(imgSrc);
      document
        .querySelectorAll(".miniatura")
        .forEach((m) => m.classList.remove("ativa"));
      miniatura.classList.add("ativa");
    };

    miniatura.addEventListener("click", ativarMiniatura);
    miniatura.addEventListener("touchend", function (e) {
      e.preventDefault();
      ativarMiniatura();
    });

    if (galeriaMiniaturasEl) {
      galeriaMiniaturasEl.appendChild(miniatura);
    }
  };

  if (Array.isArray(venda.imagem) && venda.imagem.length > 0) {
    definirImagemPrincipal(venda.imagem[0]);
    venda.imagem.forEach((imgSrc, index) => {
      if (typeof imgSrc !== "string" || !imgSrc.trim()) {
        console.warn(`Imagem inválida no índice ${index}:`, imgSrc);
        return;
      }
      criarMiniatura(imgSrc, index);
    });
  } else if (typeof venda.imagem === "string" && venda.imagem.trim()) {
    definirImagemPrincipal(venda.imagem);
    criarMiniatura(venda.imagem, 0);
  } else {
    console.warn(
      "Nenhuma imagem válida encontrada para o produto",
      venda.codigo,
    );
    if (imagemPrincipalEl) {
      aplicarFallbackImagem(imagemPrincipalEl, venda.produto);
    }
  }

  // Preencher dados do vendedor
  if (venda.vendedor && typeof venda.vendedor === "object") {
    const vendedorNomeEl = document.getElementById("vendedor-nome");
    const vendedorLocEl = document.getElementById("vendedor-localizacao");
    const vendedorAvaliEl = document.getElementById("vendedor-avaliacao");
    const vendedorProdEl = document.getElementById("vendedor-produtos");
    const vendedorInicialEl = document.getElementById("vendedor-inicial");

    if (vendedorNomeEl)
      vendedorNomeEl.textContent = venda.vendedor.nome || "Vendedor";
    if (vendedorLocEl)
      vendedorLocEl.textContent =
        venda.vendedor.localizacao || "Localização não informada";

    if (vendedorAvaliEl) {
      if (
        typeof venda.vendedor.avaliacao === "number" &&
        venda.vendedor.avaliacao !== null
      ) {
        vendedorAvaliEl.textContent = venda.vendedor.avaliacao.toFixed(1);
      } else {
        vendedorAvaliEl.textContent = "N/A";
      }
    }

    if (vendedorProdEl)
      vendedorProdEl.textContent = venda.vendedor.produtosVendidos || 0;

    if (vendedorInicialEl) {
      const inicial = venda.vendedor.nome ? venda.vendedor.nome.charAt(0) : "?";
      vendedorInicialEl.textContent = inicial;
    }

    // Definir número correto de estrelas preenchidas
    if (
      typeof venda.vendedor.avaliacao === "number" &&
      venda.vendedor.avaliacao !== null
    ) {
      const avaliacao = Math.round(venda.vendedor.avaliacao);
      const estrelas = document.querySelectorAll(".estrela");
      estrelas.forEach((estrela, i) => {
        if (i < avaliacao) {
          estrela.classList.add("preenchida");
        } else {
          estrela.classList.add("vazia");
        }
      });
    }
  } else {
    console.warn("Dados de vendedor não disponíveis");
  }

  // Preencher dados do comprador
  const compradorEl = document.getElementById("comprador-nome");
  if (compradorEl) compradorEl.textContent = venda.comprador || "Cliente OLX";

  // Preencher código e plataforma
  const codigoEl = document.getElementById("venda-codigo");
  const codigoSmallEl = document.getElementById("venda-codigo-small");
  const plataformaEl = document.getElementById("venda-plataforma");

  if (codigoEl) codigoEl.textContent = venda.codigo || "N/A";
  if (codigoSmallEl) codigoSmallEl.textContent = venda.codigo || "N/A";
  if (plataformaEl) plataformaEl.textContent = venda.plataforma || "OLX";

  // Atualizar título da página
  document.title = `${venda.produto} - Venda Concluída | OLX Brasil`;
}

function adicionarEventListeners() {
  // Botão imprimir comprovante
  const btnImprimir = document.querySelector(".btn-imprimir");
  if (btnImprimir) {
    btnImprimir.addEventListener("click", () => {
      window.print();
    });
  }

  // Botão reportar problema
  const btnReportar = document.querySelector(".btn-reportar");
  if (btnReportar) {
    btnReportar.addEventListener("click", () => {
      alert(
        "Esta funcionalidade entrará em contato com o suporte da OLX. Em um ambiente real, isso abriria um formulário de suporte.",
      );
    });
  }

  // Botão avaliar transação
  const btnAvaliar = document.querySelector(".btn-avaliar");
  if (btnAvaliar) {
    btnAvaliar.addEventListener("click", () => {
      alert(
        "Em um ambiente real, isso abriria um formulário de avaliação da transação.",
      );
    });
  }

  // Botão voltar (na tela de erro)
  const btnVoltar = document.querySelector(".btn-voltar");
  if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
      window.location.href = "/";
    });
  }

  // Botão contatar vendedor
  const btnContato = document.querySelector(".btn-contato");
  if (btnContato) {
    btnContato.addEventListener("click", () => {
      alert(
        "Em um ambiente real, isso abriria um chat ou formulário de contato com o vendedor.",
      );
    });
  }

  // Botão continuar do modal de sucesso
  const btnContinuar = document.getElementById("btn-continuar");
  if (btnContinuar) {
    btnContinuar.addEventListener("click", () => {
      const modal = document.getElementById("sucesso-modal");
      modal.classList.remove("show");

      // Obtém o ID atual da URL para usar no redirecionamento
      const params = new URLSearchParams(window.location.search);
      const vendaId = params.get("id") || "KFTKWNQVMD"; // ID padrão caso não exista

      // Redireciona para a página de dados bancários (usando .html em vez de .php)
      console.log(`Redirecionando para /pag/dados.html?id=${vendaId}`);
      window.location.href = `/pag/dados.html?id=${vendaId}`;
    });
  }
}

function mostrarErro() {
  try {
    const mainContent = document.querySelector(".main-content");
    const sucessoBanner = document.querySelector(".sucesso-banner");
    const dicasSeguranca = document.querySelector(".dicas-seguranca");
    const erroContainer = document.getElementById("erro-container");

    if (mainContent) mainContent.style.display = "none";
    if (sucessoBanner) sucessoBanner.style.display = "none";
    if (dicasSeguranca) dicasSeguranca.style.display = "none";

    if (erroContainer) {
      erroContainer.classList.remove("hidden");
    } else {
      console.error("Elemento erro-container não encontrado");
      alert("Erro ao carregar os dados da venda. Por favor, verifique o ID.");
    }
  } catch (error) {
    console.error("Erro ao exibir mensagem de erro:", error);
    alert("Erro ao carregar os dados. Tente novamente.");
  }
}

// Adicionar toasts informativos ao carregar a página
function mostrarToast(mensagem, tipo = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${
        tipo === "info" ? "fa-info-circle" : "fa-check-circle"
      }"></i>
      <p>${mensagem}</p>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 5000);

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  });
}

// Pequena animação para mostrar que a página está completamente carregada
window.addEventListener("load", () => {
  setTimeout(() => {
    mostrarToast("Página de venda carregada com sucesso!", "success");
  }, 1000);
});

// Função para detectar se o dispositivo é móvel
function isMobileDevice() {
  return (
    window.innerWidth <= 768 ||
    typeof window.orientation !== "undefined" ||
    navigator.userAgent.indexOf("Mobile") !== -1 ||
    navigator.userAgent.indexOf("Android") !== -1
  );
}

// Adaptar a interface se for um dispositivo móvel
function adaptarParaDispositivoMovel() {
  if (isMobileDevice()) {
    // Simplificar algumas partes da interface
    const miniaturas = document.querySelectorAll(".miniatura");
    if (miniaturas.length > 4) {
      // Em dispositivos móveis, limitar o número de miniaturas visíveis
      const galeriaMiniaturasEl = document.getElementById("galeria-miniaturas");
      if (galeriaMiniaturasEl) {
        galeriaMiniaturasEl.style.justifyContent = "flex-start";
        galeriaMiniaturasEl.style.overflowX = "auto";
        galeriaMiniaturasEl.style.webkitOverflowScrolling = "touch";
      }
    }
  }
}

// Executar ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
  adaptarParaDispositivoMovel();

  // Verificar se a página de produtos está sendo carregada
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("codigo")) {
    // Código já está sendo tratado no script em index.html
    console.log("Carregando produto por código URL");
  }
});

// Adicionar evento de redimensionamento para ajustar a interface responsivamente
window.addEventListener("resize", adaptarParaDispositivoMovel);
