document.addEventListener("DOMContentLoaded", () => {
  // Elementos do formulário
  const vendaForm = document.getElementById("vendaForm");
  const limparBtn = document.getElementById("limparBtn");
  const imageInput = document.getElementById("imagem");
  const fileNameDisplay = document.getElementById("file-name");
  const imagePreview = document.getElementById("image-preview");
  const notification = document.getElementById("notification");
  const notificationMessage = document.getElementById("notification-message");
  const notificationClose = document.getElementById("notification-close");

  // Gerar um código aleatório de 10 caracteres
  function gerarCodigo() {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
    for (let i = 0; i < 10; i++) {
      codigo += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }
    return codigo;
  }

  // Exibir notificação
  function mostrarNotificacao(mensagem) {
    notificationMessage.textContent = mensagem;
    notification.classList.add("show");

    // Ocultar notificação após 5 segundos
    setTimeout(() => {
      notification.classList.remove("show");
    }, 5000);
  }

  // Evento de envio do formulário
  vendaForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Obter valores do formulário
    const novaVenda = {
      codigo: gerarCodigo(),
      produto: document.getElementById("produto").value,
      valor: parseFloat(document.getElementById("valor").value),
      dataVenda: document.getElementById("dataVenda").value,
      comprador: document.getElementById("comprador").value,
      plataforma: document.getElementById("plataforma").value,
      vendedor: {
        nome: document.getElementById("nomeVendedor").value,
        localizacao: document.getElementById("localizacao").value,
        avaliacao: parseFloat(document.getElementById("avaliacao").value),
        produtosVendidos: parseInt(
          document.getElementById("produtosVendidos").value
        ),
      },
      imagem: imageInput.files[0] ? imageInput.files[0].name : "sem-imagem.jpg",
    };

    // Na implementação real, aqui enviaria os dados para um backend para salvar no JSON
    // Por enquanto, apenas mostramos no console e exibimos uma notificação
    console.log("Dados da nova venda:", novaVenda);

    // Simulação de sucesso
    mostrarNotificacao("Venda cadastrada com sucesso!");

    // Limpar formulário após envio bem-sucedido
    vendaForm.reset();
    imagePreview.innerHTML = "";
    fileNameDisplay.textContent = "Nenhum arquivo selecionado";
  });

  // Evento para botão limpar
  limparBtn.addEventListener("click", () => {
    vendaForm.reset();
    imagePreview.innerHTML = "";
    fileNameDisplay.textContent = "Nenhum arquivo selecionado";
  });

  // Evento para fechar notificação
  notificationClose.addEventListener("click", () => {
    notification.classList.remove("show");
  });

  // Configurar prévia da imagem
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (file) {
      fileNameDisplay.textContent = file.name;

      const reader = new FileReader();
      reader.onload = function (event) {
        imagePreview.innerHTML = `<img src="${event.target.result}" alt="Prévia da imagem">`;
      };

      reader.readAsDataURL(file);
    } else {
      fileNameDisplay.textContent = "Nenhum arquivo selecionado";
      imagePreview.innerHTML = "";
    }
  });

  // Máscara para o campo de data
  const dataVendaInput = document.getElementById("dataVenda");
  dataVendaInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }

    e.target.value = value;
  });
});
