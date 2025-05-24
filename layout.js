// Função para carregar HTML em placeholders
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
      if (callback) callback(); // Executa callback após carregar
    })
    .catch(error => console.error('Erro ao carregar:', file, error));
}

// Carrega header e footer ao carregar a página
window.onload = function () {
  loadHTML("header-placeholder", "header.html", setActiveMenu);
  loadHTML("footer-placeholder", "footer.html");
};

// Destaca menu ativo
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

/* Abrir e fechar modal de cadastro e edição */
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("myModal");
  const btnAbrir = document.getElementById("btnAbrirCadastro");
  const spanFechar = document.querySelector(".close");

  if (btnAbrir) {
    btnAbrir.onclick = function () {
      limparFormulario();
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
});

/* Função para limpar o formulário do modal */
function limparFormulario() {
  const form = document.getElementById("form-aluno");
  if (form) {
    form.reset();
    const inputId = form.querySelector('input[name="idaluno"]');
    if (inputId) inputId.value = "";
  }
}

/* Função para abrir modal e preencher com dados para edição */
function abrirModalEdicao(data, id) {
  const modal = document.getElementById("myModal");
  if (!modal) return;

  modal.style.display = "block";

  const form = document.getElementById("form-aluno");
  if (!form) return;

  form.usuario.value = data.usuario || "";
  form.NomeAluno.value = data.nome || "";
  form.Idade.value = data.idade || "";
  form.Telefone.value = data.telefone || "";

  let inputId = form.querySelector('input[name="idaluno"]');
  if (!inputId) {
    inputId = document.createElement('input');
    inputId.type = 'hidden';
    inputId.name = 'idaluno';
    form.appendChild(inputId);
  }
  inputId.value = id;
}

/* Formatar número de telefone */
document.addEventListener("DOMContentLoaded", function () {
  const telefoneInput = document.querySelector('[name=Telefone]');

  if (telefoneInput) {
    telefoneInput.addEventListener("input", function (e) {
      let valor = e.target.value.replace(/\D/g, ''); // Remove não números

      if (valor.length > 11) valor = valor.slice(0, 11); // Máximo 11 dígitos

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

/* Submissão do formulário para criar ou editar aluno */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("form-aluno");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = form.idaluno?.value;
    const url = id
      ? `/.netlify/functions/editarAluno?id=${id}`
      : `/.netlify/functions/criarAluno`;

    const metodo = id ? 'PUT' : 'POST';

    const dados = {
      usuario: form.usuario.value,
      nome: form.NomeAluno.value,
      idade: form.Idade.value,
      telefone: form.Telefone.value,
    };

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (!res.ok) throw new Error('Erro ao salvar aluno');

      alert(id ? "Aluno atualizado com sucesso!" : "Aluno criado com sucesso!");
      form.reset();
      document.getElementById("myModal").style.display = "none";
      location.reload();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar aluno.");
    }
  });
});
