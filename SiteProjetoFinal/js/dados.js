/* ================================================== */
/* DADOS INICIAIS */
/* ================================================== */

    // Chave única no localStorage para guardar o estado do sistema
    // Mantém os dados entre páginas e entre sessões do browser
    const CHAVE_ARMAZENAMENTO = "gestao_hotel_2025_estado";

    // Arrays principais do sistema (fonte de verdade em memória)
    // São sincronizados com o localStorage pelas funções carregarEstado e guardarEstado
    let quartos = [];
    let tarifas = [];
    let reservas = [];

    // Dados base para o primeiro arranque (quando ainda não existe estado guardado)
    const quartosIniciais = [
      {
        id: 1,
        nomeQuarto: "Quarto 01",
        tipo: "Standard",
        capacidade: 2,
        precoBaseNoite: 95,
        comodidades: ["Wi-Fi", "Ar condicionado", "TV 40", "Cofre"],
        estado: "ativo"
      },
      {
        id: 2,
        nomeQuarto: "Quarto 02",
        tipo: "Standard",
        capacidade: 2,
        precoBaseNoite: 90,
        comodidades: ["Wi-Fi", "TV 32", "Secretária", "Varanda"],
        estado: "ativo"
      },
      {
        id: 3,
        nomeQuarto: "Quarto 03",
        tipo: "Superior",
        capacidade: 2,
        precoBaseNoite: 110,
        comodidades: ["Wi-Fi", "Ar condicionado", "TV 43", "Chuveiro de chuva"],
        estado: "ativo"
      },
      {
        id: 4,
        nomeQuarto: "Quarto 04",
        tipo: "Deluxe",
        capacidade: 3,
        precoBaseNoite: 140,
        comodidades: ["Wi-Fi", "Ar condicionado", "Minibar", "Vista cidade"],
        estado: "ativo"
      },
      {
        id: 5,
        nomeQuarto: "Quarto 05",
        tipo: "Deluxe",
        capacidade: 3,
        precoBaseNoite: 155,
        comodidades: ["Wi-Fi", "Varanda", "Minibar", "Chaleira"],
        estado: "ativo"
      },
      {
        id: 6,
        nomeQuarto: "Quarto 06",
        tipo: "Suíte",
        capacidade: 4,
        precoBaseNoite: 210,
        comodidades: ["Wi-Fi", "Jacuzzi", "Sala estar", "Vista mar"],
        estado: "ativo"
      },
      {
        id: 7,
        nomeQuarto: "Quarto 07",
        tipo: "Suíte",
        capacidade: 4,
        precoBaseNoite: 225,
        comodidades: ["Wi-Fi", "Sala estar", "Varanda ampla", "Cofre"],
        estado: "ativo"
      },
      {
        id: 8,
        nomeQuarto: "Quarto 08",
        tipo: "Familiar",
        capacidade: 5,
        precoBaseNoite: 180,
        comodidades: ["Wi-Fi", "Kitchenette", "2 quartos", "Berço"],
        estado: "ativo"
      },
      {
        id: 9,
        nomeQuarto: "Quarto 09",
        tipo: "Individual",
        capacidade: 1,
        precoBaseNoite: 70,
        comodidades: ["Wi-Fi", "Secretária", "Cofre"],
        estado: "inativo"
      }
    ];

    // Tarifas sazonais usadas no cálculo do preço de cada noite
    const tarifasIniciais = [
      {
        id: 1,
        nomeTarifa: "Inverno Tranquilo",
        mesesAplicados: [1, 2],
        multiplicador: 0.9,
        descricao: "Promoção de início do ano para estadias curtas."
      },
      {
        id: 2,
        nomeTarifa: "Primavera Viva",
        mesesAplicados: [3, 4, 5],
        multiplicador: 1.1,
        descricao: "Período de eventos culturais e turismo urbano."
      },
      {
        id: 3,
        nomeTarifa: "Verão Alto",
        mesesAplicados: [6, 7, 8],
        multiplicador: 1.25,
        descricao: "Alta temporada com procura elevada e serviços extra."
      },
      {
        id: 4,
        nomeTarifa: "Outono Cultural",
        mesesAplicados: [9, 10],
        multiplicador: 1.05,
        descricao: "Meses de congresso e eventos corporativos."
      },
      {
        id: 5,
        nomeTarifa: "Fim de Ano Festivo",
        mesesAplicados: [11, 12],
        multiplicador: 1.2,
        descricao: "Época festiva com experiências especiais."
      }
    ];

    // Constrói reservas de exemplo já com noites e preço total calculados
    // Evita valores inconsistentes quando os dados iniciais são carregados
    function criarReservaExemplo(dadosReserva) {
      const quarto = quartosIniciais.find((item) => item.id === dadosReserva.quartoId);
      const noites = calcularNoites(dadosReserva.dataEntrada, dadosReserva.dataSaida);
      const precoTotal = calcularPrecoReserva(
        quarto,
        tarifasIniciais,
        dadosReserva.dataEntrada,
        dadosReserva.dataSaida
      );

      return {
        ...dadosReserva,
        noites,
        precoTotal
      };
    }

    // Reservas iniciais para demonstração do sistema (podem ser apagadas pelo utilizador)
    const reservasIniciais = [
      criarReservaExemplo({
        id: 1,
        nomeHospede: "João Pereira",
        contactoHospede: "912345678",
        quartoId: 1,
        dataEntrada: "2025-03-05",
        dataSaida: "2025-03-08",
        numeroHospedes: 2,
        estado: "ativa",
        dataCriacao: "2025-02-20"
      }),
      criarReservaExemplo({
        id: 2,
        nomeHospede: "Mariana Lopes",
        contactoHospede: "918234567",
        quartoId: 3,
        dataEntrada: "2025-07-12",
        dataSaida: "2025-07-15",
        numeroHospedes: 3,
        estado: "ativa",
        dataCriacao: "2025-06-25"
      }),
      criarReservaExemplo({
        id: 3,
        nomeHospede: "Rui Fernandes",
        contactoHospede: "",
        quartoId: 2,
        dataEntrada: "2025-10-02",
        dataSaida: "2025-10-04",
        numeroHospedes: 2,
        estado: "cancelada",
        dataCriacao: "2025-09-10"
      })
    ];

/* ================================================== */
/* FUNCOES DE ESTADO */
/* ================================================== */

    // Lê o estado do localStorage e preenche os arrays do sistema
    // Se não existir estado guardado, repõe os dados iniciais
    function carregarEstado() {
      const guardado = localStorage.getItem(CHAVE_ARMAZENAMENTO);
      if (guardado) {
        // JSON.parse transforma o texto guardado em objetos JavaScript
        const estado = JSON.parse(guardado);
        // Fallback para arrays vazios caso falte alguma chave
        quartos = estado.quartos || [];
        tarifas = estado.tarifas || [];
        reservas = estado.reservas || [];
        return;
      }

      reporDadosIniciais();
    }

    // Guarda o estado atual dos arrays no localStorage
    // JSON.stringify converte objetos em texto para poder gravar no browser
    function guardarEstado() {
      const estado = {
        quartos,
        tarifas,
        reservas
      };
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
    }

    // Recria os arrays a partir dos dados base e grava no localStorage
    // Usa cópia profunda para não alterar os arrays iniciais por referência
    function reporDadosIniciais() {
      quartos = JSON.parse(JSON.stringify(quartosIniciais));
      tarifas = JSON.parse(JSON.stringify(tarifasIniciais));
      reservas = JSON.parse(JSON.stringify(reservasIniciais));
      guardarEstado();
    }

/* ================================================== */
/* INICIALIZAÇÃO */
/* ================================================== */
// Carrega o estado assim que o ficheiro é lido pelo browser
carregarEstado();
