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
  const currentPage = window.location.pathname.split("/").pop();
  const menuLinks = document.querySelectorAll("ul.nav-tabs li a");

  menuLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.parentElement.classList.add("active");
    } else {
      link.parentElement.classList.remove("active");
    }
  });
}

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

// 🔗 Ao carregar a página, executa:
window.onload = function () {
  loadHTML("header-placeholder", "header.html", setActiveMenu);
  loadHTML("footer-placeholder", "footer.html");
};

/*formartar numero de telefone*/
document.addEventListener("DOMContentLoaded", function () {
const telefoneInput = document.querySelector('[name=Telefone]');

if (telefoneInput) {
  telefoneInput.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número

    if (valor.length > 11) valor = valor.slice(0, 11); // Limita a 11 dígitos

    if (valor.length > 0) {
      if (valor.length <= 10) {
        // Fixo ou celular antigo (sem nono dígito)
        valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else {
        // Celular com nono dígito
        valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      }
    }

    e.target.value = valor;
  });
}
});
