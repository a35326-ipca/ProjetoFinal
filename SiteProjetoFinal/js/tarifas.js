    let janelaTarifa = null;
    // Variáveis de apoio para controlar o modal e a tarifa em edição
    let idTarifaEmEdicao = null;

/* ================================================== */
/* INICIALIZAÇÂO */
/* ================================================== */

    // Arranque da página de Tarifas
    // Renderiza a tabela e prepara os eventos do modal
    function iniciarPaginaTarifas() {
      renderizarTabelaTarifas();
      prepararMesesJanela();

      // Criar o modal do Bootstrap a partir do elemento do DOM
      const janelaElemento = document.getElementById("janela-tarifa");
      janelaTarifa = new bootstrap.Modal(janelaElemento);

      document.getElementById("corpo-tabela-tarifas").addEventListener("click", (evento) => {
        // Delegação de eventos para apanhar cliques em botões "Editar"
        const botao = evento.target.closest("button[data-acao='editar']");
        if (!botao) {
          return;
        }
        // dataset liga o botão à tarifa correta
        const idTarifa = Number(botao.dataset.id);
        abrirJanelaTarifa(idTarifa);
      });

      document.getElementById("form-tarifa").addEventListener("submit", (evento) => {
        // Evita reload da página e trata a gravação via JavaScript
        evento.preventDefault();
        guardarTarifa();
      });
    }

/* ================================================== */
/* TABELA */
/* ================================================== */

    // Cria as linhas da tabela a partir do array `tarifas`
    function renderizarTabelaTarifas() {
      const corpo = document.getElementById("corpo-tabela-tarifas");
      corpo.innerHTML = "";

      tarifas.forEach((tarifa) => {
        const linha = document.createElement("tr");
        // Converte os números dos meses para nomes em PT-PT
        const mesesTexto = tarifa.mesesAplicados.map((mes) => obterNomeMes(mes)).join(", ");

        linha.innerHTML = `
          <td>${tarifa.nomeTarifa}</td>
          <td>${mesesTexto}</td>
          <td class="fw-semibold">x ${Number(tarifa.multiplicador).toFixed(2)}</td>
          <td>${tarifa.descricao}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary" data-acao="editar" data-id="${tarifa.id}">
              Editar
            </button>
          </td>
        `;

        corpo.appendChild(linha);
      });
    }

/* ================================================== */
/* JANELA */
/* ================================================== */

    // Gera os 12 checkboxes dos meses dentro do modal
    function prepararMesesJanela() {
      const lista = document.getElementById("lista-meses-tarifa");
      lista.innerHTML = "";

      NOMES_MESES.forEach((mes, indice) => {
        const idCheckbox = `mes-${indice + 1}`;
        const div = document.createElement("div");
        div.className = "form-check form-check-inline";

        div.innerHTML = `
          <input class="form-check-input" type="checkbox" id="${idCheckbox}" value="${indice + 1}">
          <label class="form-check-label" for="${idCheckbox}">${mes}</label>
        `;

        lista.appendChild(div);
      });
    }

    // Preenche o modal com os dados da tarifa selecionada e abre a janela
    function abrirJanelaTarifa(idTarifa) {
      const tarifa = tarifas.find((item) => item.id === idTarifa);
      if (!tarifa) {
        return;
      }

      idTarifaEmEdicao = idTarifa;

      // Preencher inputs e checkboxes com base no objeto tarifa
      document.getElementById("nome-tarifa").value = tarifa.nomeTarifa;
      document.getElementById("multiplicador-tarifa").value = tarifa.multiplicador;

      document.querySelectorAll("#lista-meses-tarifa input[type='checkbox']").forEach((input) => {
        const mes = Number(input.value);
        input.checked = tarifa.mesesAplicados.includes(mes);
      });

      janelaTarifa.show();
    }

    // Lê os valores do formulário, valida e atualiza o array `tarifas`
    // No fim grava no localStorage e atualiza a tabela
    function guardarTarifa() {
      const tarifa = tarifas.find((item) => item.id === idTarifaEmEdicao);
      if (!tarifa) {
        return;
      }

      // Ler valores do DOM e converter para número
      const multiplicador = Number(document.getElementById("multiplicador-tarifa").value);
      const mesesSelecionados = Array.from(
        document.querySelectorAll("#lista-meses-tarifa input[type='checkbox']:checked")
      ).map((input) => Number(input.value));

      // Validação simples para evitar dados inválidos
      if (!multiplicador || multiplicador <= 0) {
        mostrarAlerta("alertas-tarifas", "O multiplicador deve ser superior a zero.", "danger");
        return;
      }

      if (!mesesSelecionados.length) {
        mostrarAlerta("alertas-tarifas", "Selecione pelo menos um mês.", "danger");
        return;
      }

      // Atualizar o objeto e ordenar meses para ficar consistente
      tarifa.multiplicador = multiplicador;
      tarifa.mesesAplicados = mesesSelecionados.sort((a, b) => a - b);

      // Persistir alterações e refrescar UI
      guardarEstado();
      renderizarTabelaTarifas();
      janelaTarifa.hide();

      mostrarAlerta("alertas-tarifas", "Tarifa atualizada com sucesso.", "success");
    }
