/* ================================================== */
/* Barra de navegação */
/* ================================================== */

    // Devolve o ficheiro atual (ex.: "reservas.html") a partir do URL
    function obterNomePaginaAtual() {
      // `window.location.pathname` contém apenas o caminho (sem domínio nem query)
      const caminho = window.location.pathname;
      // Separar por "/" para obter o nome do ficheiro no último elemento
      const partes = caminho.split("/");
      const ficheiro = partes[partes.length - 1];
      // Se estiver na raiz ("/"), assume "index.html"
      return ficheiro || "index.html";
    }

    // Percorre os links do menu e destaca o que corresponde à página atual
    function marcarLinkAtivo() {
      const paginaAtual = obterNomePaginaAtual();
      // Todos os links do menu têm a classe `.link-navegacao`
      const links = document.querySelectorAll(".link-navegacao");

      links.forEach((link) => {
        const destino = link.getAttribute("href");
        // Marca visualmente o link ativo e melhora a acessibilidade com `aria-current`
        if (destino === paginaAtual) {
          link.classList.add("active");
          link.setAttribute("aria-current", "page");
        } else {
          link.classList.remove("active");
          link.removeAttribute("aria-current");
        }
      });
    }

/* ================================================== */
/* ALERTAS */
/* ================================================== */

    // Mostra um alerta temporário (sucesso ou erro) num contentor da página
    // Usa classes do Bootstrap e faz fade in/out com CSS + setTimeout
    function mostrarAlerta(idDestino, mensagem, tipo = "info") {
      const destino = document.getElementById(idDestino);
      if (!destino) {
        return;
      }

      // Criar o elemento de alerta no DOM
      const alerta = document.createElement("div");
      alerta.className = `alert alert-${tipo} alerta-temporario`;
      alerta.setAttribute("role", "alert");
      alerta.textContent = mensagem;

      // Substituir qualquer alerta anterior para manter a UI limpa
      destino.innerHTML = "";
      destino.appendChild(alerta);

      // Forçar o browser a aplicar o estado inicial e depois ativar a classe visível
      window.requestAnimationFrame(() => {
        alerta.classList.add("alerta-visivel");
      });

      // Remover após 5 segundos para não poluir o ecrã
      window.setTimeout(() => {
        alerta.classList.remove("alerta-visivel");
        alerta.classList.add("alerta-saida");
        window.setTimeout(() => {
          alerta.remove();
        }, 300);
      }, 5000);
    }

/* ================================================== */
/* INICIALIZAÇÃO POR PAGINA */
/* ================================================== */

    // Executa apenas o JS da página atual com base no id do <body>
    // Evita correr código numa página onde os elementos não existem
    function inicializarPaginaEspecifica() {
      const idPagina = document.body.id;
      // Mapa simples: id do body -> função global de arranque
      const mapaPaginas = {
        "pagina-reservas": window.iniciarPaginaReservas,
        "pagina-painel": window.iniciarPaginaPainel,
        "pagina-quartos": window.iniciarPaginaQuartos,
        "pagina-tarifas": window.iniciarPaginaTarifas
      };

      const iniciar = mapaPaginas[idPagina];
      // Garantir que a função existe antes de chamar
      if (typeof iniciar === "function") {
        iniciar();
      }
    }

/* ================================================== */
/* EVENTOS BASE */
/* ================================================== */

    // Arranque depois do HTML carregar para garantir acesso ao DOM
    document.addEventListener("DOMContentLoaded", () => {
      marcarLinkAtivo();
      inicializarPaginaEspecifica();
    });
