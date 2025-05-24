document.addEventListener("DOMContentLoaded", async function () {
  const tabela = document.querySelector("#tabela-alunos tbody");

  if (!tabela) {
    console.warn("Tabela de alunos não encontrada.");
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/alunos');
    if (!response.ok) throw new Error('Erro ao buscar alunos');
    const alunos = await response.json();

    if (Array.isArray(alunos) && alunos.length > 0) {
      alunos.forEach(aluno => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${aluno.idaluno ?? ""}</td>
          <td>${aluno.nome ?? ""}</td>
          <td>${aluno.idade ?? ""}</td>
          <td>${aluno.dtcadastro ?? ""}</td>
          <td>
            <button class="editar-btn" data-id="${aluno.idaluno}">✏️</button>
            <button class="excluir-btn" data-id="${aluno.idaluno}">🗑️</button>
          </td>
        `;
        tabela.appendChild(tr);
      });
    } else {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5">Nenhum aluno encontrado.</td>`;
      tabela.appendChild(tr);
    }

    // Inicializa o DataTable, se jQuery estiver disponível
    if (window.$) {
      $('#tabela-alunos').DataTable({
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/pt-BR.json'
        }
      });
    } else {
      console.warn('jQuery não carregado. DataTables não será aplicado.');
    }

    // Eventos de excluir
    document.querySelectorAll(".excluir-btn").forEach(botao => {
      botao.addEventListener("click", async function () {
        const id = this.dataset.id;
        if (confirm("Tem certeza que deseja excluir este aluno?")) {
          try {
            const res = await fetch(`/.netlify/functions/excluirAluno?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erro ao excluir');
            alert("Aluno excluído com sucesso!");
            location.reload();
          } catch (error) {
            console.error(error);
            alert("Erro ao excluir.");
          }
        }
      });
    });

    // Eventos de editar
    document.querySelectorAll(".editar-btn").forEach(botao => {
      botao.addEventListener("click", async function () {
        const id = this.dataset.id;
        try {
          const res = await fetch(`/.netlify/functions/obterAluno?id=${id}`);
          if (!res.ok) throw new Error('Erro ao buscar aluno para edição');
          const data = await res.json();
          abrirModalEdicao(data, id);
        } catch (error) {
          console.error(error);
          alert("Erro ao carregar dados para edição.");
        }
      });
    });

  } catch (error) {
    console.error('Erro geral ao carregar alunos:', error);
    alert("Erro ao carregar alunos.");
  }
});
//BUSCA ALUNO POR NOME
$('#inputBusca').on('keyup', function() {
  $('#tabela-alunos').DataTable().search(this.value).draw();
});


