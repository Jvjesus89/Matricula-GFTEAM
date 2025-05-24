document.addEventListener("DOMContentLoaded", async function () {
  const tabela = document.querySelector("#tabela-alunos tbody");

  try {
    // Busca todos os alunos do backend serverless
    const response = await fetch('/.netlify/functions/alunos');
    if (!response.ok) throw new Error('Erro ao buscar alunos');
    const alunos = await response.json();

    alunos.forEach(aluno => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${aluno.idaluno}</td>
        <td>${aluno.nome || ""}</td>
        <td>${aluno.idade || ""}</td>
        <td>${aluno.dtcadastro || ""}</td>
        <td>
          <button class="editar-btn" data-id="${aluno.idaluno}">✏️</button>
          <button class="excluir-btn" data-id="${aluno.idaluno}">🗑️</button>
        </td>
      `;
      tabela.appendChild(tr);
    });

    $('#tabela-alunos').DataTable();

    // Evento excluir
    document.querySelectorAll(".excluir-btn").forEach(botao => {
      botao.addEventListener("click", async function () {
        const id = this.getAttribute("data-id");
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

    // Evento editar - busca dados e abre modal (sua função abrirModalEdicao deve estar definida)
    document.querySelectorAll(".editar-btn").forEach(botao => {
      botao.addEventListener("click", async function () {
        const id = this.getAttribute("data-id");
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
    console.error('Erro geral:', error);
  }
});
