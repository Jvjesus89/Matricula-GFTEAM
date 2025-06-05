$(document).ready(function() {
  // Define a tabela DataTables e disponibiliza no escopo global
  window.tabelaFinanceiro = $('#tabela-financeiro').DataTable({
    language: {
      "sEmptyTable": "Nenhum registro encontrado",
      "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
      "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
      "sInfoFiltered": "(Filtrados de _MAX_ registros)",
      "sInfoPostFix": "",
      "sInfoThousands": ".",
      "sLengthMenu": "_MENU_ resultados por página",
      "sLoadingRecords": "Carregando...",
      "sProcessing": "Processando...",
      "sZeroRecords": "Nenhum registro encontrado",
      "sSearch": "Pesquisar",
      "oPaginate": {
        "sNext": "Próximo",
        "sPrevious": "Anterior",
        "sFirst": "Primeiro",
        "sLast": "Último"
      },
      "oAria": {
        "sSortAscending": ": Ordenar colunas de forma ascendente",
        "sSortDescending": ": Ordenar colunas de forma descendente"
      },
      "select": {
        "rows": {
          "_": "Selecionado %d linhas",
          "0": "Nenhuma linha selecionada",
          "1": "Selecionado 1 linha"
        }
      }
    },
    pageLength: 25,
    lengthChange: false,
    dom: 'frtip',
    responsive: true,
    autoWidth: false,
    scrollX: true,
    scrollCollapse: true,
    fixedHeader: true,
    order: [[3, 'asc'], [0, 'asc']],
    columns: [
      { 
        data: 'usuario',
        responsivePriority: 2,
        width: '15%'
      },
      { 
        data: 'nome',
        responsivePriority: 1,
        width: '25%'
      },
      { 
        data: 'valor',
        className: 'coluna-valor',
        responsivePriority: 3,
        width: '15%',
        render: function(data) {
          return `R$ ${parseFloat(data).toFixed(2)}`;
        }
      },    

      { 
        data: 'data_vencimento',
        type: 'date',
        responsivePriority: 4,
        width: '15%',
        render: function(data) {
          return new Date(data).toLocaleDateString('pt-BR');
        }
      },
      { 
        data: 'data_pagamento',
        type: 'date',
        responsivePriority: 5,
        width: '15%',
        render: function(data) {
          return data ? new Date(data).toLocaleDateString('pt-BR') : 'Pendente';
        }
      },
      {
        data: null,
        orderable: false,
        className: 'dt-center coluna-acoes',
        responsivePriority: 6,
        width: '15%',
        render: function(data, type, row) {
          // Verifica se o usuário é administrador
          const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
          const isAdmin = usuario?.usuario_perfil?.isadministrador === true;

          let botoes = '';
          
          // Mostra o botão de impressão se tiver data de pagamento
          if (row.data_pagamento) {
            botoes += `<button onclick="imprimirComprovante(${row.idfinanceiro})" class="btn btn-success btn-sm" style="margin-right: 5px;" title="Imprimir Comprovante">🖨️</button>`;
          } else {
            // Mostra os botões de WhatsApp (apenas para admin) e PIX se não tiver data de pagamento
            if (isAdmin) {
              botoes += `<button onclick="enviarWhatsApp(${row.idfinanceiro})" class="btn btn-success btn-sm" style="margin-right: 5px;" title="Enviar WhatsApp">📱</button>`;
            }
            botoes += `<button onclick="gerarPix(${row.idfinanceiro})" class="btn btn-info btn-sm" style="margin-right: 5px;" title="Gerar PIX">💸</button>`;
          }

          // Adiciona os botões de editar e excluir apenas se for administrador
          if (isAdmin) {
            botoes += `
              <button onclick="editarFinanceiro(${row.idfinanceiro})" class="btn btn-primary btn-sm" style="margin-right: 5px;">✏️</button>
              <button onclick="excluirFinanceiro(${row.idfinanceiro})" class="btn btn-danger btn-sm">🗑️</button>
            `;
          }
          
          return `<div class="btn-group">${botoes}</div>`;
        }
      }
    ],
    initComplete: function() {
      // Ajusta a largura da tabela após a inicialização
      $(window).trigger('resize');
    }
  });

  // Ajusta a tabela quando a janela é redimensionada
  $(window).on('resize', function() {
    if (window.tabelaFinanceiro) {
      window.tabelaFinanceiro.columns.adjust();
    }
  });

  // Move o campo de busca para dentro do campo-busca
  $('.dataTables_filter').appendTo('#campo-busca');

  // Função para definir as datas padrão
  function setDefaultDates() {
    const hoje = new Date();
    
    // Data inicial: 1 mês atrás
    const dataInicial = new Date();
    dataInicial.setMonth(dataInicial.getMonth() - 1);
    
    // Data final: 10 dias à frente
    const dataFinal = new Date();
    dataFinal.setDate(dataFinal.getDate() + 10);
    
    // Formata as datas para o formato YYYY-MM-DD
    document.getElementById('dataInicial').value = dataInicial.toISOString().split('T')[0];
    document.getElementById('dataFinal').value = dataFinal.toISOString().split('T')[0];
    
    return { dataInicial, dataFinal };
  }

  // Função para filtrar os dados por data
  function filtrarPorData() {
    const dataInicial = new Date(document.getElementById('dataInicial').value);
    const dataFinal = new Date(document.getElementById('dataFinal').value);
    
    // Ajusta as datas para considerar o dia inteiro
    dataInicial.setHours(0, 0, 0, 0);
    dataFinal.setHours(23, 59, 59, 999);

    // Adiciona o filtro personalizado
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
      const dataVencimento = new Date(data[3].split('/').reverse().join('-'));
      dataVencimento.setHours(0, 0, 0, 0);
      
      return dataVencimento >= dataInicial && dataVencimento <= dataFinal;
    });

    // Aplica o filtro
    window.tabelaFinanceiro.draw();

    // Remove o filtro personalizado
    $.fn.dataTable.ext.search.pop();
  }

  // Inicializa as datas padrão
  setDefaultDates();

  // Adiciona o evento de click no botão de filtrar
  $('#btnFiltrar').on('click', filtrarPorData);

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
        window.tabelaFinanceiro.draw();
        
        // Aplica o filtro de data após carregar os dados
        filtrarPorData();
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

  // Função para enviar mensagem pelo WhatsApp
  window.enviarWhatsApp = async function(idfinanceiro) {
    try {
      const response = await fetch(`/.netlify/functions/obterFinanceiro?idfinanceiro=${idfinanceiro}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do registro');
      }
      const data = await response.json();
      const registro = data.find(f => f.idfinanceiro === idfinanceiro);
      if (!registro) {
        throw new Error('Registro não encontrado');
      }

      if (!registro.telefone) {
        throw new Error('Aluno não possui número de telefone cadastrado');
      }

      // Formata a data para o padrão brasileiro
      const dataVencimento = new Date(registro.data_vencimento).toLocaleDateString('pt-BR');

      // Formata o telefone (remove caracteres não numéricos e adiciona o código do país)
      const telefoneFormatado = '55' + registro.telefone.replace(/\D/g, '');

      // Gera o QR Code primeiro
      const responsePix = await fetch('/.netlify/functions/gerarPix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pagamentoId: idfinanceiro })
      });

      if (!responsePix.ok) {
        throw new Error('Erro ao gerar QR Code');
      }

      const pixData = await responsePix.json();

      // Cria a URL do QR Code
      const qrCodeUrl = `https://gf-team.netlify.app/.netlify/functions/gerarPix?id=${idfinanceiro}`;

      console.log('Enviando dados:', {
        telefone: telefoneFormatado,
        usuario: registro.usuario,
        valor: `R$ ${parseFloat(registro.valor).toFixed(2)}`,
        dataVencimento: dataVencimento,
        qrCodeUrl: qrCodeUrl
      });

      const responseWhatsApp = await fetch('/.netlify/functions/enviarWhatsApp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefone: telefoneFormatado,
          usuario: registro.usuario,
          valor: `R$ ${parseFloat(registro.valor).toFixed(2)}`,
          dataVencimento: dataVencimento,
          qrCodeUrl: qrCodeUrl
        })
      });

      const dataWhatsApp = await responseWhatsApp.json();
      
      if (!dataWhatsApp.sucesso) {
        throw new Error(JSON.stringify(dataWhatsApp.erro) || 'Erro ao enviar mensagem');
      }

      alert('Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro detalhado:', error);
      alert('Erro ao enviar mensagem: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // Adiciona a função para gerar o QR Code PIX
  window.gerarPix = async function(idfinanceiro) {
    try {
      // Mostra um modal de carregamento
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'block';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
          <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
          <h3>Gerando QR Code PIX</h3>
          <div id="qrCodeContainer" style="text-align: center; margin: 20px 0;">
            <div class="spinner-border" role="status">
              <span class="sr-only">Carregando...</span>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Faz a requisição para gerar o QR Code
      const response = await fetch('/.netlify/functions/gerarPix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pagamentoId: idfinanceiro })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar QR Code');
      }

      const data = await response.json();

      // Atualiza o modal com o QR Code
      const qrCodeContainer = document.getElementById('qrCodeContainer');
      qrCodeContainer.innerHTML = `
        <img src="data:image/png;base64,${data.qr_code_base64}" alt="QR Code PIX" style="max-width: 200px;">
        <p style="margin-top: 10px; word-break: break-all;">${data.qr_code}</p>
        <p style="margin-top: 10px; color: #666;">Escaneie o QR Code ou copie o código PIX acima</p>
        <button onclick="navigator.clipboard.writeText('${data.qr_code}')" class="btn btn-primary btn-sm" style="margin-top: 10px;">
          Copiar código PIX
        </button>
      `;

    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      alert('Erro ao gerar QR Code: ' + error.message);
      modal.remove();
    }
  };

  // Remove os eventos antigos dos botões
  $('#tabela-financeiro tbody').off('click', '.btn-editar');
  $('#tabela-financeiro tbody').off('click', '.btn-excluir');
}); 