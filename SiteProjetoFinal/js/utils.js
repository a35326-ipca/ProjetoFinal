/* ================================================== */
/* DATAS E FORMATAÇÃO */
/* ================================================== */

    // Nomes dos 12 meses em PT-PT usados em selects e tabelas
    const NOMES_MESES = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro"
    ];

    // Cria um Date local a partir de "AAAA-MM-DD"
    // Usa 12:00 para reduzir erros de fuso horário ao comparar datas
    function criarDataLocal(dataAAAAMMDD) {
      if (!dataAAAAMMDD) {
        return null;
      }
      return new Date(`${dataAAAAMMDD}T12:00:00`);
    }

    // Converte um Date para "AAAA-MM-DD" para ser guardado e comparado de forma consistente
    function formatarDataISO(data) {
      if (!(data instanceof Date)) {
        return "";
      }
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const dia = String(data.getDate()).padStart(2, "0");
      return `${ano}-${mes}-${dia}`;
    }

    // Formata valores para Euro em PT-PT usando Intl.NumberFormat
    function formatarMoedaEUR(valor) {
      const numero = Number(valor) || 0;
      return new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR"
      }).format(numero);
    }

/* ================================================== */
/* VALIDAÇÕES */
/* ================================================== */

    // Calcula o número de noites entre duas datas (dataSaida - dataEntrada)
    function calcularNoites(dataEntrada, dataSaida) {
      const entrada = criarDataLocal(dataEntrada);
      const saida = criarDataLocal(dataSaida);
      if (!entrada || !saida) {
        return 0;
      }
      const msDia = 1000 * 60 * 60 * 24;
      return Math.round((saida - entrada) / msDia);
    }

    // Valida se as datas estão dentro do ano 2025 conforme o enunciado
    function validarIntervalo2025(dataEntrada, dataSaida) {
      const entrada = criarDataLocal(dataEntrada);
      const saida = criarDataLocal(dataSaida);
      const inicio = criarDataLocal("2025-01-01");
      const fim = criarDataLocal("2025-12-31");
      if (!entrada || !saida) {
        return false;
      }
      return entrada >= inicio && saida <= fim;
    }

    // Verifica se dois intervalos de datas se sobrepõem (A e B)
    function intervalosSobrepoem(inicioA, fimA, inicioB, fimB) {
      const aInicio = criarDataLocal(inicioA);
      const aFim = criarDataLocal(fimA);
      const bInicio = criarDataLocal(inicioB);
      const bFim = criarDataLocal(fimB);
      if (!aInicio || !aFim || !bInicio || !bFim) {
        return false;
      }
      return aInicio < bFim && bInicio < aFim;
    }

    // Procura conflitos: reservas ativas do mesmo quarto não podem sobrepor datas
    // reservaIdIgnorarOpcional é usado quando se edita uma reserva existente
    function existeConflitoReserva(
      reservas,
      quartoId,
      dataEntrada,
      dataSaida,
      reservaIdIgnorarOpcional
    ) {
      return reservas.some((reserva) => {
        const mesmaReserva = reserva.id === reservaIdIgnorarOpcional;
        const mesmoQuarto = reserva.quartoId === quartoId;
        const ativa = reserva.estado === "ativa";
        if (mesmaReserva || !mesmoQuarto || !ativa) {
          return false;
        }
        return intervalosSobrepoem(
          reserva.dataEntrada,
          reserva.dataSaida,
          dataEntrada,
          dataSaida
        );
      });
    }

/* ================================================== */
/* PREÇO E TARIFAS */
/* ================================================== */

    // Obtém o multiplicador aplicável à data (mês) para cálculo do preço
    // Se houver várias tarifas no mesmo mês, aplica o multiplicador mais alto
    function obterMultiplicadorParaData(tarifas, dataAAAAMMDD) {
      const partes = (dataAAAAMMDD || "").split("-");
      const mes = Number(partes[1]) || 0;
      let multiplicador = 1;

      tarifas.forEach((tarifa) => {
        if (tarifa.mesesAplicados.includes(mes)) {
          const valor = Number(tarifa.multiplicador) || 1;
          if (valor > multiplicador) {
            multiplicador = valor;
          }
        }
      });

      return multiplicador;
    }

    // Arredonda para duas casas decimais para evitar diferenças no total
    function arredondarDuasCasas(valor) {
      return Math.round(valor * 100) / 100;
    }

    // Calcula o preço total somando noite a noite (útil quando atravessa meses)
    function calcularPrecoReserva(quarto, tarifas, dataEntrada, dataSaida) {
      if (!quarto) {
        return 0;
      }
      const entrada = criarDataLocal(dataEntrada);
      const saida = criarDataLocal(dataSaida);
      if (!entrada || !saida || entrada >= saida) {
        return 0;
      }

      let total = 0;
      const dataAtual = new Date(entrada.getTime());

      while (dataAtual < saida) {
        // Para cada noite, aplica o multiplicador do mês dessa data
        const dataStr = formatarDataISO(dataAtual);
        const multiplicador = obterMultiplicadorParaData(tarifas, dataStr);
        total += quarto.precoBaseNoite * multiplicador;
        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      return arredondarDuasCasas(total);
    }

/* ================================================== */
/* ANALITICA */
/* ================================================== */

    // Conta quantas noites estão reservadas por mês (usado no Painel)
    function calcularDiasReservadosPorMes(reservasAtivas) {
      const diasPorMes = Array(12).fill(0);

      reservasAtivas.forEach((reserva) => {
        let dataAtual = criarDataLocal(reserva.dataEntrada);
        const dataFim = criarDataLocal(reserva.dataSaida);
        if (!dataAtual || !dataFim) {
          return;
        }

        while (dataAtual < dataFim) {
          diasPorMes[dataAtual.getMonth()] += 1;
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      });

      return diasPorMes;
    }

    // Soma faturação por mês, reconstruindo o preço noite a noite
    // Usa os arrays globais quartos e tarifas para manter o cálculo atualizado
    function calcularFaturacaoPorMes(reservasAtivas) {
      const valores = Array(12).fill(0);
      const listaQuartos = typeof quartos !== "undefined" ? quartos : [];
      const listaTarifas = typeof tarifas !== "undefined" ? tarifas : [];

      reservasAtivas.forEach((reserva) => {
        const quarto = listaQuartos.find((item) => item.id === reserva.quartoId);
        if (!quarto) {
          return;
        }

        let dataAtual = criarDataLocal(reserva.dataEntrada);
        const dataFim = criarDataLocal(reserva.dataSaida);
        if (!dataAtual || !dataFim) {
          return;
        }

        while (dataAtual < dataFim) {
          // Atualiza o total do mês correspondente à noite atual
          const dataStr = formatarDataISO(dataAtual);
          const mesIndex = dataAtual.getMonth();
          const multiplicador = obterMultiplicadorParaData(listaTarifas, dataStr);
          valores[mesIndex] += quarto.precoBaseNoite * multiplicador;
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      });

      return valores.map(arredondarDuasCasas);
    }

    // Soma os 12 meses e devolve o total anual
    function calcularTotalAnual(valoresPorMes) {
      const soma = valoresPorMes.reduce((total, valor) => total + (Number(valor) || 0), 0);
      return arredondarDuasCasas(soma);
    }

    // Converte 1..12 para o nome do mês em PT-PT
    function obterNomeMes(numeroMes) {
      return NOMES_MESES[numeroMes - 1] || "";
    }
