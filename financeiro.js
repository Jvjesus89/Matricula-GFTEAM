$(document).ready(function() {
  // Define a tabela DataTables e disponibiliza no escopo global
  window.tabelaFinanceiro = $('#tabela-financeiro').DataTable({
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json',
      info: '', 
      infoEmpty: '', 
      infoFiltered: '' 
    },
    pageLength: 25,
    lengthChange: false,
    dom: 'frtip',
    responsive: true,
    order: [[3, 'asc'], [0, 'asc']],
    columns: [
      { data: 'usuario' },
      { data: 'nome' },
      { 
        data: 'valor',
        className: 'coluna-valor',
        render: function(data) {
          return `R$ ${parseFloat(data).toFixed(2)}`;
        }
      },
      { 
        data: 'data_vencimento',
        type: 'date',
        render: function(data) {
          return new Date(data).toLocaleDateString('pt-BR');
        }
      },
      { 
        data: 'data_pagamento',
        type: 'date',
        render: function(data) {
          return data ? new Date(data).toLocaleDateString('pt-BR') : 'Pendente';
        }
      },
      {
        data: null,
        orderable: false,
        className: 'dt-center coluna-acoes',
        render: function(data, type, row) {
          const btnImprimir = row.data_pagamento 
            ? `<button onclick="imprimirComprovante(${row.idfinanceiro})" class="btn btn-success btn-sm" style="margin-right: 5px;" title="Imprimir Comprovante">🖨️</button>` 
            : '';
            
          return `<div class="btn-group">
            ${btnImprimir}
            <button onclick="editarFinanceiro(${row.idfinanceiro})" class="btn btn-primary btn-sm" style="margin-right: 5px;">✏️</button>
            <button onclick="excluirFinanceiro(${row.idfinanceiro})" class="btn btn-danger btn-sm">🗑️</button>
          </div>`;
        }
      }
    ]
  });

  // Move o campo de busca para dentro do topo-tabela
  $('.dataTables_filter').appendTo('.topo-tabela');

  // Função para carregar os dados financeiros
  window.carregarFinanceiro = function() {
    // Verifica se deve filtrar por usuário
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const isAdmin = usuario?.usuario_perfil?.isadministrador === true;
    
    // Constrói a URL com o filtro se necessário
    const url = isAdmin 
      ? '/.netlify/functions/obterFinanceiro'
      : `/.netlify/functions/obterFinanceiro?idusuario=${usuario.idusuario}`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        window.tabelaFinanceiro.clear();
        window.tabelaFinanceiro.rows.add(data);
        
        // Se não for administrador, oculta a coluna de ações
        if (!isAdmin) {
          window.tabelaFinanceiro.column(-1).visible(false);
        }
        
        window.tabelaFinanceiro.draw();
      })
      .catch(error => {
        console.error('Erro ao buscar dados financeiros:', error);
      });
  };

  // Função para carregar os alunos no select
  function carregarAlunos() {
    fetch('/.netlify/functions/obterAluno')
      .then(response => response.json())
      .then(data => {
        const select = document.getElementById('selectAluno');
        select.innerHTML = '<option value="">Selecione um aluno...</option>';
        
        data.forEach(aluno => {
          const option = document.createElement('option');
          option.value = aluno.idusuario;
          option.textContent = aluno.nome;
          select.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Erro ao carregar alunos:', error);
      });
  }

  // Carrega os dados inicialmente
  window.carregarFinanceiro();
  carregarAlunos();

  // Configuração da busca - CORRIGIDO
  const inputBusca = document.getElementById('inputBusca');
  if (inputBusca) {
    inputBusca.addEventListener('keyup', function() {
      window.tabelaFinanceiro.search(this.value).draw();
    });
  }

  // Modal de cadastro
  const modal = document.getElementById("myModal");
  const btnAbrirModal = document.getElementById("btnCadastrarFinanceiro");
  const spanFechar = document.getElementsByClassName("close")[0];

  if (btnAbrirModal) {
    btnAbrirModal.onclick = function() {
      modal.style.display = "block";
    };
  }

  if (spanFechar) {
    spanFechar.onclick = function() {
      modal.style.display = "none";
    };
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  // Formulário de cadastro
  const formFinanceiro = document.getElementById("form-financeiro");
  if (formFinanceiro) {
    formFinanceiro.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Verifica se os campos obrigatórios estão preenchidos
      if (!formFinanceiro.Aluno.value || !formFinanceiro.Valor.value || !formFinanceiro.DataVencimento.value) {
        alert('Por favor, preencha os campos obrigatórios (Aluno, Valor e Data de Vencimento).');
        return;
      }

      const financeiro = {
        idusuario: formFinanceiro.Aluno.value,
        valor: parseFloat(formFinanceiro.Valor.value),
        data_vencimento: formFinanceiro.DataVencimento.value,
        data_pagamento: formFinanceiro.DataPagamento.value || null
      };

      // Se estiver editando, inclui o ID
      const idfinanceiro = formFinanceiro.querySelector('input[name="idfinanceiro"]')?.value;
      if (idfinanceiro) {
        financeiro.idfinanceiro = parseInt(idfinanceiro);
      }

      try {
        const response = await fetch('/.netlify/functions/cadastrarFinanceiro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(financeiro)
        });

        const data = await response.json();

        if (response.ok) {
          alert(idfinanceiro ? 'Pagamento atualizado com sucesso!' : 'Pagamento registrado com sucesso!');
          modal.style.display = "none";
          formFinanceiro.reset();
          // Remove o campo de ID se existir
          formFinanceiro.querySelector('input[name="idfinanceiro"]')?.remove();
          // Reseta o texto do botão
          document.getElementById('submit-button').value = 'Cadastrar';
          carregarFinanceiro(); // Atualiza a tabela
        } else {
          alert(data.error || 'Erro ao processar pagamento.');
        }
      } catch (error) {
        console.error('Erro no cadastro:', error);
        alert('Erro inesperado. Tente novamente.');
      }
    });
  }

  // Função para editar financeiro
  window.editarFinanceiro = function(idfinanceiro) {
    fetch(`/.netlify/functions/obterFinanceiro?idfinanceiro=${idfinanceiro}`)
      .then(response => response.json())
      .then(data => {
        const registro = data.find(f => f.idfinanceiro === idfinanceiro);
        if (registro) {
          document.getElementById('selectAluno').value = registro.idusuario;
          document.querySelector('input[name="Valor"]').value = registro.valor;
          document.querySelector('input[name="DataVencimento"]').value = registro.data_vencimento.split('T')[0];
          if (registro.data_pagamento) {
            document.querySelector('input[name="DataPagamento"]').value = registro.data_pagamento.split('T')[0];
          }
          
          // Adiciona o ID do registro como campo oculto
          let idInput = document.querySelector('input[name="idfinanceiro"]');
          if (!idInput) {
            idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = 'idfinanceiro';
            document.getElementById('form-financeiro').appendChild(idInput);
          }
          idInput.value = idfinanceiro;

          // Altera o texto do botão
          document.getElementById('submit-button').value = 'Atualizar';
          
          // Abre o modal
          document.getElementById('myModal').style.display = 'block';
        }
      })
      .catch(error => {
        console.error('Erro ao carregar dados do registro:', error);
        alert('Erro ao carregar dados do registro');
      });
  };

  // Função para excluir financeiro
  window.excluirFinanceiro = function(idfinanceiro) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      fetch(`/.netlify/functions/excluirFinanceiro?id=${idfinanceiro}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          alert('Registro excluído com sucesso!');
          carregarFinanceiro();
        } else {
          alert(data.error || 'Erro ao excluir registro.');
        }
      })
      .catch(error => {
        console.error('Erro ao excluir:', error);
        alert('Erro inesperado. Tente novamente.');
      });
    }
  };

  // Remove os eventos antigos dos botões
  $('#tabela-financeiro tbody').off('click', '.btn-editar');
  $('#tabela-financeiro tbody').off('click', '.btn-excluir');
}); 