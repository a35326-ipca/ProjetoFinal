/* ================================================== */
/* INICIALIZAÇÃO */
/* ================================================== */
// Arranque do Painel
// Recalcula e renderiza sempre que o estado mudar no localStorage (ex.: noutra aba)
function iniciarPaginaPainel() {
  renderizarPainel();

  window.addEventListener("storage", (evento) => {
    // O evento "storage" dispara quando outra aba altera o localStorage
    if (evento.key === CHAVE_ARMAZENAMENTO) {
      carregarEstado();
      renderizarPainel();
    }
  });
}

/* ================================================== */
/* RENDER DO PAINEL */
/* ================================================== */
// Calcula os indicadores e atualiza os componentes do Painel
function renderizarPainel() {
  // Separar reservas por estado para KPI e cálculos
  const reservasAtivas = reservas.filter((reserva) => reserva.estado === "ativa");
  const reservasCanceladas = reservas.filter((reserva) => reserva.estado === "cancelada");
  // Funções utilitárias fazem os cálculos por mês e total anual
  const diasPorMes = calcularDiasReservadosPorMes(reservasAtivas);
  const faturacaoPorMes = calcularFaturacaoPorMes(reservasAtivas);
  const totalAnual = calcularTotalAnual(faturacaoPorMes);
  const totalDias = diasPorMes.reduce((soma, valor) => soma + valor, 0);

  atualizarIndicadores({
    totalDias,
    totalAnual,
    reservasAtivas: reservasAtivas.length,
    reservasCanceladas: reservasCanceladas.length
  });

  renderizarTabelaFaturacao(diasPorMes, faturacaoPorMes, totalAnual);
}

// Atualiza os cartões KPI alterando texto no DOM
function atualizarIndicadores(valores) {
  document.getElementById("indicador-dias-reservados").textContent = valores.totalDias;
  document.getElementById("indicador-faturacao-anual").textContent = formatarMoedaEUR(
    valores.totalAnual
  );
  document.getElementById("indicador-reservas-ativas").textContent = valores.reservasAtivas;
  document.getElementById("indicador-reservas-canceladas").textContent =
    valores.reservasCanceladas;
}

/* ================================================== */
/* TABELA MENSAL */
/* ================================================== */
// Renderiza a tabela mensal com dias reservados, faturação e progresso de ocupação
function renderizarTabelaFaturacao(diasPorMes, faturacaoPorMes, totalAnual) {
  const corpo = document.getElementById("tabela-faturacao-corpo");
  corpo.innerHTML = "";

  // Considera apenas quartos ativos para estimar noites disponíveis no mês
  // Math.max evita divisão por zero quando não há quartos ativos
  const totalQuartosAtivos = Math.max(
    quartos.filter((quarto) => quarto.estado === "ativo").length,
    1
  );

  for (let i = 0; i < 12; i += 1) {
    const diasReservados = diasPorMes[i];
    // Dias no mês * nº de quartos ativos = noites disponíveis
    const diasNoMes = obterDiasNoMes(2025, i + 1);
    const noitesDisponiveis = diasNoMes * totalQuartosAtivos;
    const percentagem = noitesDisponiveis
      ? Math.round((diasReservados / noitesDisponiveis) * 100)
      : 0;

    const classificacao = obterClassificacaoOcupacao(percentagem);
    const linha = document.createElement("tr");

    // Barra de progresso com classes CSS e atributos ARIA para acessibilidade
    const barra = document.createElement("div");
    barra.className = `progress-bar ${classificacao.classeBarra}`;
    barra.setAttribute("role", "progressbar");
    barra.setAttribute("aria-valuenow", percentagem);
    barra.setAttribute("aria-valuemin", "0");
    barra.setAttribute("aria-valuemax", "100");
    barra.style.width = `${percentagem}%`;

    const progresso = document.createElement("div");
    progresso.className = "progress";
    progresso.appendChild(barra);

    const valorProgresso = document.createElement("span");
    valorProgresso.className = "progresso-valor";
    valorProgresso.textContent = `${percentagem}%`;

    const progressoLinha = document.createElement("div");
    progressoLinha.className = "progresso-linha";
    progressoLinha.appendChild(valorProgresso);
    progressoLinha.appendChild(progresso);

    const celulaProgresso = document.createElement("td");
    celulaProgresso.className = "celula-progresso";
    celulaProgresso.appendChild(progressoLinha);

    linha.innerHTML = `
      <td>${obterNomeMes(i + 1)}</td>
      <td>${diasReservados} noites</td>
      <td>${formatarMoedaEUR(faturacaoPorMes[i])}</td>
      <td><span class="badge badge-ocupacao ${classificacao.classeBadge}">${classificacao.texto}</span></td>
    `;

    linha.appendChild(celulaProgresso);
    corpo.appendChild(linha);
  }

  // Total anual mostrado no fim da tabela
  document.getElementById("total-anual").textContent = formatarMoedaEUR(totalAnual);
}

// Devolve quantos dias tem um mês (truque com Date: dia 0 do mês seguinte)
function obterDiasNoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

// Classifica ocupação por percentagem para mostrar badge e cor da barra
function obterClassificacaoOcupacao(percentagem) {
  if (percentagem < 40) {
    return {
      texto: "Baixa",
      classeBadge: "ocupacao-baixa",
      classeBarra: "barra-baixa"
    };
  }
  if (percentagem < 70) {
    return {
      texto: "Média",
      classeBadge: "ocupacao-media",
      classeBarra: "barra-media"
    };
  }
  return {
    texto: "Alta",
    classeBadge: "ocupacao-alta",
    classeBarra: "barra-alta"
  };
}
