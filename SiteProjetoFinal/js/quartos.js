/* ================================================== */
/* INICIALIZAÇÃO */
/* ================================================== */
// Arranque da página de Quartos
// Renderiza e usa delegação de eventos para reagir aos botões criados dinamicamente
function iniciarPaginaQuartos() {
  renderizarQuartos();

  const lista = document.getElementById("lista-quartos");
  lista.addEventListener("click", (evento) => {
    // `closest` garante que o clique funciona mesmo se carregar no texto dentro do botão
    const botao = evento.target.closest("button[data-acao='alternar']");
    if (!botao) {
      return;
    }
    // dataset guarda o id do quarto no HTML para ligar UI -> dados
    const idQuarto = Number(botao.dataset.id);
    alternarEstadoQuarto(idQuarto);
  });
}

/* ================================================== */
/* RENDERIZAÇÃO */
/* ================================================== */
// Cria os cartões de quartos a partir do array `quartos` e injeta no DOM
function renderizarQuartos() {
  const lista = document.getElementById("lista-quartos");
  lista.innerHTML = "";

  quartos.forEach((quarto) => {
    // Colunas responsivas com Bootstrap para mobile-first
    const coluna = document.createElement("div");
    coluna.className = "col-12 col-md-6 col-xl-4";
    coluna.appendChild(criarCartaoQuarto(quarto));
    lista.appendChild(coluna);
  });
}

// Monta o HTML de um cartão de quarto com dados e botão de estado
function criarCartaoQuarto(quarto) {
  const cartao = document.createElement("div");
  cartao.className = "card cartao-quarto h-100 hover-suave";

  // Classes diferentes para destacar ativo vs inativo
  const estadoClasse = quarto.estado === "ativo" ? "estado-ativa" : "estado-cancelada";
  const estadoTexto = quarto.estado === "ativo" ? "Ativo" : "Inativo";

  cartao.innerHTML = `
    <div class="card-body d-flex flex-column gap-3">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h5 class="card-title mb-1">${quarto.nomeQuarto} - ${quarto.tipo}</h5>
          <span class="text-muted">Capacidade: ${quarto.capacidade} pessoas</span>
        </div>
        <span class="badge badge-estado ${estadoClasse}">${estadoTexto}</span>
      </div>
      <div>
        <div class="preco">${formatarMoedaEUR(quarto.precoBaseNoite)} / noite</div>
        <small class="texto-secundario">Preço base por noite, antes das tarifas sazonais.</small>
      </div>
      <div>
        <strong>Comodidades:</strong>
        <ul class="lista-comodidades">
          ${quarto.comodidades.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
      <div class="mt-auto">
        <button class="btn btn-sm btn-outline-primary" data-acao="alternar" data-id="${quarto.id}">
          ${quarto.estado === "ativo" ? "Desativar" : "Ativar"}
        </button>
      </div>
    </div>
  `;

  return cartao;
}

/* ================================================== */
/* ESTADO */
/* ================================================== */
function alternarEstadoQuarto(idQuarto) {
  // Encontra o quarto pelo id e troca ativo <-> inativo
  const quarto = quartos.find((item) => item.id === idQuarto);
  if (!quarto) {
    return;
  }

  quarto.estado = quarto.estado === "ativo" ? "inativo" : "ativo";
  // Persistir no localStorage e re-renderizar para refletir na UI
  guardarEstado();
  renderizarQuartos();
}
