/* ================================================== */
/* INICIALIZAÇÃO */
/* ================================================== */
// Arranque da página de Reservas
// Junta referências do DOM, prepara eventos e renderiza a tabela inicial
function iniciarPaginaReservas() {
  const elementos = obterElementosReserva();

  prepararFormularioReserva(elementos);
  prepararFiltrosReserva(elementos);
  renderizarTabelaReservas(elementos);
}

// Limite de reservas para corresponder aos 9 quartos do hotel
const LIMITE_RESERVAS_LISTA = 9;

/* ================================================== */
/* ELEMENTOS DOM */
/* ================================================== */
// Centraliza todos os getElementById para evitar repetição e facilitar manutenção
function obterElementosReserva() {
  return {
    formulario: document.getElementById("form-reserva"),
    campoNome: document.getElementById("nome-hospede"),
    campoContacto: document.getElementById("contacto-hospede"),
    campoQuarto: document.getElementById("quarto-id"),
    campoEntrada: document.getElementById("data-entrada"),
    campoSaida: document.getElementById("data-saida"),
    campoHospedes: document.getElementById("numero-hospedes"),
    campoNoites: document.getElementById("numero-noites"),
    campoPreco: document.getElementById("preco-total"),
    botaoCalcular: document.getElementById("botao-calcular-preco"),
    alertas: document.getElementById("alertas-reservas"),
    filtroMes: document.getElementById("filtro-mes"),
    filtroQuarto: document.getElementById("filtro-quarto"),
    filtroEstado: document.getElementById("filtro-estado"),
    corpoTabela: document.getElementById("corpo-tabela-reservas"),
    modalDetalhes: document.getElementById("janela-reserva-detalhes"),
    tituloDetalhes: document.getElementById("titulo-detalhes-reserva"),
    corpoDetalhes: document.getElementById("corpo-detalhes-reserva"),
    modalConfirmar: document.getElementById("janela-confirmar-cancelamento"),
    botaoConfirmar: document.getElementById("botao-confirmar-cancelamento")
  };
}

/* ================================================== */
/* FORMULARIO */
/* ================================================== */
// Prepara o formulário de criação e liga botões a eventos
function prepararFormularioReserva(elementos) {
  // Popular o select de quartos com base no array `quartos`
  preencherSelectQuartos(elementos.campoQuarto, false);

  elementos.botaoCalcular.addEventListener("click", () => {
    // Calcula preço sem gravar a reserva
    atualizarResumoPreco(elementos);
  });

  elementos.formulario.addEventListener("submit", (evento) => {
    // Evita reload do browser e trata a submissão via JavaScript
    evento.preventDefault();
    submeterReserva(elementos);
  });
}

// Valida os campos necessários e calcula noites + preço total para mostrar no formulário
function atualizarResumoPreco(elementos) {
  limparErrosFormulario();
  const dados = obterDadosFormulario(elementos);
  // validarNome: false permite calcular preço mesmo antes de preencher o nome
  const erros = validarReserva(dados, { validarNome: false });

  if (erros.length) {
    aplicarErrosFormulario(erros);
    return;
  }

  // Bloqueia criação quando já existem 9 reservas registadas no sistema
  if (reservas.length >= LIMITE_RESERVAS_LISTA) {
    mostrarAlerta(
      "alertas-reservas",
      "Os 9 quartos estão ocupados.",
      "danger"
    );
    return;
  }

  // Recolhe dados do quarto e aplica tarifas para estimar o preço
  const quarto = quartos.find((item) => item.id === dados.quartoId);
  const noites = calcularNoites(dados.dataEntrada, dados.dataSaida);
  const precoTotal = calcularPrecoReserva(
    quarto,
    tarifas,
    dados.dataEntrada,
    dados.dataSaida
  );

  elementos.campoNoites.value = noites;
  elementos.campoPreco.value = formatarMoedaEUR(precoTotal);
}

// Cria a reserva, atualiza o array, guarda no localStorage e refresca a lista
function submeterReserva(elementos) {
  limparErrosFormulario();
  const dados = obterDadosFormulario(elementos);
  // Aqui valida tudo, incluindo nome do hóspede
  const erros = validarReserva(dados, { validarNome: true });

  if (erros.length) {
    aplicarErrosFormulario(erros);
    return;
  }

  const quarto = quartos.find((item) => item.id === dados.quartoId);
  const noites = calcularNoites(dados.dataEntrada, dados.dataSaida);
  const precoTotal = calcularPrecoReserva(
    quarto,
    tarifas,
    dados.dataEntrada,
    dados.dataSaida
  );

  // Monta o objeto reserva (modelo do enunciado) com campos calculados
  const novaReserva = {
    id: gerarIdReserva(),
    nomeHospede: dados.nomeHospede,
    contactoHospede: dados.contactoHospede,
    quartoId: dados.quartoId,
    dataEntrada: dados.dataEntrada,
    dataSaida: dados.dataSaida,
    numeroHospedes: dados.numeroHospedes,
    noites,
    precoTotal,
    estado: "ativa",
    dataCriacao: obterDataHojeISO()
  };

  // Atualiza o array (dados em memória) e persiste no localStorage
  reservas.push(novaReserva);
  guardarEstado();

  // Limpa o formulário e os campos calculados
  elementos.formulario.reset();
  elementos.campoNoites.value = "";
  elementos.campoPreco.value = "";

  renderizarTabelaReservas(elementos);
  mostrarAlerta("alertas-reservas", "Reserva criada com sucesso.", "success");
}

// Lê os valores do formulário e normaliza datas para ISO 2025 (AAAA-MM-DD)
function obterDadosFormulario(elementos) {
  const dataEntradaBruta = elementos.campoEntrada.value.trim();
  const dataSaidaBruta = elementos.campoSaida.value.trim();
  // Converte "dd/mm" para "2025-MM-DD" para validar e calcular
  const dataEntrada = normalizarData2025(dataEntradaBruta);
  const dataSaida = normalizarData2025(dataSaidaBruta);

  return {
    nomeHospede: elementos.campoNome.value.trim(),
    contactoHospede: elementos.campoContacto.value.trim(),
    quartoId: Number(elementos.campoQuarto.value),
    dataEntrada,
    dataSaida,
    dataEntradaBruta,
    dataSaidaBruta,
    numeroHospedes: Number(elementos.campoHospedes.value)
  };
}

// Converte "dd/mm" para "2025-MM-DD" e devolve string vazia se for inválida
// Evita o utilizador ter de escrever o ano porque o sistema é apenas 2025
function normalizarData2025(valor) {
  if (!valor) {
    return "";
  }
  const partes = valor.split("/");
  if (partes.length !== 2) {
    return "";
  }
  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  if (!dia || !mes) {
    return "";
  }
  // Valida dias máximos do mês para evitar datas impossíveis
  const maxDias = new Date(2025, mes, 0).getDate();
  if (dia < 1 || dia > maxDias || mes < 1 || mes > 12) {
    return "";
  }
  const diaFormatado = String(dia).padStart(2, "0");
  const mesFormatado = String(mes).padStart(2, "0");
  return `2025-${mesFormatado}-${diaFormatado}`;
}

// Valida os dados e devolve uma lista de erros para marcar campos e mostrar alerta
// Usa regras do enunciado: 2025, entrada < saída, capacidade, conflitos e quarto ativo
function validarReserva(dados, opcoes) {
  const erros = [];
  const quarto = quartos.find((item) => item.id === dados.quartoId);
  const validarNome = opcoes?.validarNome ?? true;

  if (validarNome && !dados.nomeHospede) {
    erros.push({ campo: "nome-hospede", mensagem: "Indique o nome do hóspede." });
  }

  if (!dados.quartoId || !quarto) {
    erros.push({ campo: "quarto-id", mensagem: "Selecione um quarto válido." });
  }

  if (!dados.dataEntrada) {
    const mensagem = dados.dataEntradaBruta
      ? "Formato de data inválido. Use dd/mm."
      : "Indique a data de entrada.";
    erros.push({ campo: "data-entrada", mensagem });
  }

  if (!dados.dataSaida) {
    const mensagem = dados.dataSaidaBruta
      ? "Formato de data inválido. Use dd/mm."
      : "Indique a data de sa?da.";
    erros.push({ campo: "data-saida", mensagem });
  }

  if (!dados.numeroHospedes || dados.numeroHospedes < 1) {
    erros.push({
      campo: "numero-hospedes",
      mensagem: "Indique o número de hóspedes."
    });
  }

  if (dados.dataEntrada && dados.dataSaida) {
    if (!validarIntervalo2025(dados.dataEntrada, dados.dataSaida)) {
      erros.push({
        campo: "data-entrada",
        mensagem: "As datas devem estar dentro de 2025."
      });
    }

    if (calcularNoites(dados.dataEntrada, dados.dataSaida) <= 0) {
      erros.push({
        campo: "data-saida",
        mensagem: "A data de saída deve ser posterior à entrada."
      });
    }
  }

  if (quarto && dados.numeroHospedes > quarto.capacidade) {
    erros.push({
      campo: "numero-hospedes",
      mensagem: "Número de hóspedes acima da capacidade do quarto."
    });
  }

  if (quarto && quarto.estado !== "ativo") {
    erros.push({
      campo: "quarto-id",
      mensagem: "O quarto selecionado está inativo."
    });
  }

  // Conflitos: não permitir sobreposição de datas no mesmo quarto (apenas reservas ativas)
  if (
    dados.quartoId &&
    dados.dataEntrada &&
    dados.dataSaida &&
    existeConflitoReserva(reservas, dados.quartoId, dados.dataEntrada, dados.dataSaida)
  ) {
    erros.push({
      campo: "data-entrada",
      mensagem: "Quarto indisponível para estas datas. Escolha outro período."
    });
  }

  return erros;
}

// Remove marcações de erro do Bootstrap (classe is-invalid)
function limparErrosFormulario() {
  document.querySelectorAll(".is-invalid").forEach((campo) => {
    campo.classList.remove("is-invalid");
  });
}

// Marca os campos inválidos e mostra um alerta com o motivo principal
// Dá prioridade à mensagem de conflito para o utilizador perceber a indisponibilidade
function aplicarErrosFormulario(erros) {
  erros.forEach((erro) => {
    const campo = document.getElementById(erro.campo);
    if (campo) {
      campo.classList.add("is-invalid");
    }
  });

  if (erros.length) {
    const erroConflito = erros.find((erro) =>
      String(erro.mensagem || "").toLowerCase().includes("indisponível")
    );
    const mensagem = erroConflito
      ? erroConflito.mensagem
      : "Introduza os dados que são pedidos, por favor.";
    mostrarAlerta("alertas-reservas", mensagem, "danger");
  }
}

// Gera um id incremental com base no maior id existente no array
function gerarIdReserva() {
  const ids = reservas.map((reserva) => reserva.id);
  const maximo = ids.length ? Math.max(...ids) : 0;
  return maximo + 1;
}

// Devolve a data de hoje no formato ISO (AAAA-MM-DD) para guardar na reserva
function obterDataHojeISO() {
  const hoje = new Date();
  return formatarDataISO(hoje);
}

/* ================================================== */
/* FILTROS */
/* ================================================== */
// Prepara filtros e ações da tabela (detalhes, cancelar e apagar)
// Usa delegação de eventos porque as linhas são renderizadas dinamicamente
function prepararFiltrosReserva(elementos) {
  preencherSelectMeses(elementos.filtroMes);
  preencherSelectQuartos(elementos.filtroQuarto, true);

  elementos.filtroMes.addEventListener("change", () => {
    // Re-render quando muda o filtro do mês
    renderizarTabelaReservas(elementos);
  });

  elementos.filtroQuarto.addEventListener("change", () => {
    // Re-render quando muda o filtro do quarto
    renderizarTabelaReservas(elementos);
  });

  elementos.filtroEstado.addEventListener("change", () => {
    // Re-render quando muda o filtro do estado
    renderizarTabelaReservas(elementos);
  });

  elementos.corpoTabela.addEventListener("click", (evento) => {
    // Botão de detalhes abre o modal com informação completa
    const botaoDetalhes = evento.target.closest("button[data-acao='detalhes']");
    if (botaoDetalhes) {
      const idReserva = Number(botaoDetalhes.dataset.id);
      abrirModalDetalhesReserva(idReserva, elementos);
      return;
    }

    // Apagar remove a reserva do array (sem confirmação)
    const botaoApagar = evento.target.closest("button[data-acao='apagar']");
    if (botaoApagar) {
      const idReserva = Number(botaoApagar.dataset.id);
      apagarReserva(idReserva, elementos);
      return;
    }

    // Cancelar pede confirmação via modal antes de alterar o estado
    const botaoCancelar = evento.target.closest("button[data-acao='cancelar']");
    if (!botaoCancelar) {
      return;
    }
    const idReserva = Number(botaoCancelar.dataset.id);
    abrirModalConfirmarCancelamento(idReserva, elementos);
  });

  // Guarda temporariamente a reserva selecionada até o utilizador confirmar
  let reservaParaCancelar = null;
  if (elementos.botaoConfirmar) {
    elementos.botaoConfirmar.addEventListener("click", () => {
      if (!reservaParaCancelar) {
        return;
      }
      cancelarReserva(reservaParaCancelar, elementos);
      reservaParaCancelar = null;
      fecharModalConfirmarCancelamento(elementos);
    });
  }

  function abrirModalConfirmarCancelamento(idReserva, dadosModal) {
    reservaParaCancelar = idReserva;
    if (window.bootstrap && window.bootstrap.Modal && dadosModal.modalConfirmar) {
      // getOrCreateInstance evita criar várias instâncias do mesmo modal
      const instancia = window.bootstrap.Modal.getOrCreateInstance(dadosModal.modalConfirmar);
      instancia.show();
    }
  }

  function fecharModalConfirmarCancelamento(dadosModal) {
    if (window.bootstrap && window.bootstrap.Modal && dadosModal.modalConfirmar) {
      const instancia = window.bootstrap.Modal.getOrCreateInstance(dadosModal.modalConfirmar);
      instancia.hide();
    }
  }

}

// Preenche o select de meses usando a lista NOMES_MESES
function preencherSelectMeses(select) {
  select.innerHTML = '<option value="">Todos os meses</option>';
  NOMES_MESES.forEach((mes, indice) => {
    const opcao = document.createElement("option");
    opcao.value = String(indice + 1);
    opcao.textContent = mes;
    select.appendChild(opcao);
  });
}

// Preenche o select de quartos e desativa quartos inativos quando é para criar reserva
function preencherSelectQuartos(select, incluirTodos) {
  select.innerHTML = incluirTodos ? '<option value="">Todos os quartos</option>' : '<option value="">Selecione</option>';

  quartos.forEach((quarto) => {
    const opcao = document.createElement("option");
    opcao.value = String(quarto.id);
    opcao.textContent = `${quarto.nomeQuarto} - ${quarto.tipo}`;
    if (!incluirTodos && quarto.estado !== "ativo") {
      opcao.disabled = true;
    }
    select.appendChild(opcao);
  });
}

// Aplica filtros (mês, quarto e estado) e devolve a lista resultante
function obterReservasFiltradas(elementos) {
  const mes = Number(elementos.filtroMes.value) || 0;
  const quartoId = Number(elementos.filtroQuarto.value) || 0;
  const estado = elementos.filtroEstado.value;

  return reservas.filter((reserva) => {
    const passaEstado = !estado || reserva.estado === estado;
    const passaQuarto = !quartoId || reserva.quartoId === quartoId;
    const passaMes = !mes || reservaIncluiMes(reserva, mes);
    return passaEstado && passaQuarto && passaMes;
  });
}

// Verifica se uma reserva toca num determinado mês (mesmo que atravesse meses)
function reservaIncluiMes(reserva, mes) {
  const inicioMes = `2025-${String(mes).padStart(2, "0")}-01`;
  const fimMes =
    mes === 12
      ? "2026-01-01"
      : `2025-${String(mes + 1).padStart(2, "0")}-01`;

  return intervalosSobrepoem(reserva.dataEntrada, reserva.dataSaida, inicioMes, fimMes);
}

/* ================================================== */
/* TABELA */
/* ================================================== */
// Renderiza a tabela conforme filtros e limita a lista aos 9 registos do sistema
function renderizarTabelaReservas(elementos) {
  const lista = obterReservasFiltradas(elementos);
  // Lista limitada para manter o sistema alinhado com os 9 quartos
  const listaLimitada = lista.slice(0, LIMITE_RESERVAS_LISTA);
  elementos.corpoTabela.innerHTML = "";

  if (!listaLimitada.length) {
    // Feedback quando não existem reservas para os filtros escolhidos
    elementos.corpoTabela.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted py-4">Sem reservas para os filtros escolhidos.</td></tr>';
    return;
  }

  listaLimitada.forEach((reserva) => {
    const quarto = quartos.find((item) => item.id === reserva.quartoId);
    const linha = document.createElement("tr");
    const estadoClasse = reserva.estado === "ativa" ? "estado-ativa" : "estado-cancelada";
    const estadoTexto = reserva.estado === "ativa" ? "Ativa" : "Cancelada";

    // Monta a linha com botões de ação e badges de estado
    linha.innerHTML = `
      <td>#${reserva.id}</td>
      <td>${reserva.nomeHospede}</td>
      <td>${quarto ? quarto.nomeQuarto : "Quarto removido"}</td>
      <td>${formatarDataCurta(reserva.dataEntrada)}</td>
      <td>${formatarDataCurta(reserva.dataSaida)}</td>
      <td class="text-center"><span class="badge badge-estado ${estadoClasse}">${estadoTexto}</span></td>
      <td>
        <div class="d-flex flex-nowrap justify-content-center gap-2 acoes-reserva">
          <button class="btn btn-sm btn-primario-personalizado" type="button" data-acao="detalhes" data-id="${reserva.id}">
            Ver detalhes
          </button>
          ${
              reserva.estado === "cancelada"
                ? `<button class="btn btn-sm btn-outline-danger botao-acao-secundaria" type="button" data-acao="apagar" data-id="${reserva.id}">Apagar</button>`
                : `<button class="btn btn-sm btn-outline-danger botao-acao-secundaria" type="button" data-acao="cancelar" data-id="${reserva.id}">Cancelar</button>`
            }
        </div>
      </td>
    `;

    elementos.corpoTabela.appendChild(linha);
  });
}

// Converte "AAAA-MM-DD" para "dd/mm/aaaa" para mostrar ao utilizador
function formatarDataCompleta(dataISO) {
  if (!dataISO) {
    return "";
  }
  const partes = dataISO.split("-");
  if (partes.length !== 3) {
    return dataISO;
  }
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Converte "AAAA-MM-DD" para "dd/mm" para a tabela ficar mais limpa
function formatarDataCurta(dataISO) {
  if (!dataISO) {
    return "";
  }
  const partes = dataISO.split("-");
  if (partes.length !== 3) {
    return dataISO;
  }
  return `${partes[2]}/${partes[1]}`;
}

// Abre um modal com todos os detalhes da reserva (inclui noites e preço total)
// Mantém a tabela simples e empurra detalhes para uma janela dedicada
function abrirModalDetalhesReserva(idReserva, elementos) {
  const reserva = reservas.find((item) => item.id === idReserva);
  if (!reserva || !elementos.modalDetalhes || !elementos.corpoDetalhes) {
    return;
  }

  const quarto = quartos.find((item) => item.id === reserva.quartoId);
  const estadoTexto = reserva.estado === "ativa" ? "Ativa" : "Cancelada";
  const estadoClasse = reserva.estado === "ativa" ? "estado-ativa" : "estado-cancelada";
  const contacto = reserva.contactoHospede ? reserva.contactoHospede : "Não indicado";
  const nomeQuarto = quarto ? quarto.nomeQuarto : "Quarto removido";
  const tipoQuarto = quarto ? quarto.tipo : "Não indicado";
  const capacidade = quarto ? `${quarto.capacidade} pessoas` : "Não indicado";
  if (elementos.tituloDetalhes) {
    elementos.tituloDetalhes.textContent = `Reserva #${reserva.id}`;
  }

  elementos.corpoDetalhes.innerHTML = `
    <div class="detalhe-grade">
      <div class="detalhe-linha">
        <span class="texto-secundario">Hóspede</span>
        <span class="detalhe-valor">${reserva.nomeHospede}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Contacto</span>
        <span class="detalhe-valor">${contacto}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Quarto</span>
        <span class="detalhe-valor">${nomeQuarto}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Tipo</span>
        <span class="detalhe-valor">${tipoQuarto}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Capacidade</span>
        <span class="detalhe-valor">${capacidade}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Estado</span>
        <span class="badge badge-estado ${estadoClasse}">${estadoTexto}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Entrada</span>
        <span class="detalhe-valor">${formatarDataCompleta(reserva.dataEntrada)}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Saída</span>
        <span class="detalhe-valor">${formatarDataCompleta(reserva.dataSaida)}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Data de criação</span>
        <span class="detalhe-valor">${formatarDataCompleta(reserva.dataCriacao)}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Noites</span>
        <span class="detalhe-valor">${reserva.noites}</span>
      </div>
      <div class="detalhe-linha">
        <span class="texto-secundario">Preço total</span>
        <span class="detalhe-valor">${formatarMoedaEUR(reserva.precoTotal)}</span>
      </div>
    </div>
  `;

  // Mostrar o modal com Bootstrap Modal
  if (window.bootstrap && window.bootstrap.Modal) {
    const instancia = window.bootstrap.Modal.getOrCreateInstance(elementos.modalDetalhes);
    instancia.show();
  }
}

/* ================================================== */
/* CANCELAMENTO */
/* ================================================== */
// Cancela a reserva mudando o estado para "cancelada" e mantendo o registo visível
function cancelarReserva(idReserva, elementos) {
  const reserva = reservas.find((item) => item.id === idReserva);
  if (!reserva || reserva.estado === "cancelada") {
    return;
  }

  reserva.estado = "cancelada";
  guardarEstado();
  renderizarTabelaReservas(elementos);
  mostrarAlerta("alertas-reservas", "Reserva cancelada com sucesso.", "success");
}

// Apaga a reserva do array (usado depois de já estar cancelada)
function apagarReserva(idReserva, elementos) {
  const indice = reservas.findIndex((item) => item.id === idReserva);
  if (indice === -1) {
    return;
  }
  reservas.splice(indice, 1);
  guardarEstado();
  renderizarTabelaReservas(elementos);
  mostrarAlerta("alertas-reservas", "Reserva apagada com sucesso.", "success");
}
