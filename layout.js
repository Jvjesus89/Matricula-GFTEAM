// 🔗 Carrega Header e Footer dinamicamente
function loadHTML(id, file, callback) {
  const container = document.getElementById(id);
  if (!container) {
    console.warn(`Elemento com id '${id}' não encontrado.`);
    return;
  }

  fetch(file)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Arquivo '${file}' não encontrado.`);
      }
      return response.text();
    })
    .then(data => {
      container.innerHTML = data;
      if (callback) callback();
    })
    .catch(error => console.error(`Erro ao carregar: ${file}`, error));
}

// 🔥 Marca o menu ativo
function setActiveMenu() {
  // Pega o nome do arquivo atual
  const currentPage = window.location.pathname.split('/').pop() || 'Principal.html';
  
  // Remove active de todos os links e reseta IDs
  $('.nav-tabs li a').attr('id', 'menu-tops');
  
  // Encontra o link correspondente à página atual e marca como ativo
  $('.nav-tabs li a').each(function() {
    if ($(this).attr('href').toLowerCase() === currentPage.toLowerCase()) {
      $(this).attr('id', 'menu-tops-active');
      $(this).parent().addClass('active');
    }
  });
}

// Inicializa quando o documento estiver pronto
$(document).ready(function() {
  // Carrega o header
  loadHTML('header-placeholder', 'header.html', function() {
    // Após carregar o header, configura o menu
    setActiveMenu();
  });
  
  // Carrega o footer
  loadHTML('footer-placeholder', 'footer.html');
});

// 🚀 Modal (popup) de cadastro
const modal = document.getElementById("myModal");
const btnAbrirModal = document.getElementById("btnCadastrarAluno");
const spanFechar = document.getElementsByClassName("close")[0];

if (btnAbrirModal) {
  btnAbrirModal.onclick = function () {
    modal.style.display = "block";
  };
}

if (spanFechar) {
  spanFechar.onclick = function () {
    modal.style.display = "none";
  };
}

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

/*formartar numero de telefone*/
$(document).ready(function() {
  const telefoneInput = $('[name=Telefone]');

  if (telefoneInput.length) {
    telefoneInput.on("input", function(e) {
      let valor = e.target.value.replace(/\D/g, '');

      if (valor.length > 11) valor = valor.slice(0, 11);

      if (valor.length > 0) {
        if (valor.length <= 10) {
          valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
          valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
      }

      e.target.value = valor;
    });
  }
});
