// dados.js

// Função para limpar o formulário e resetar o modal
function resetarFormulario() {
  const form = document.getElementById('form-aluno');
  if (form) {
    form.reset();
    form.querySelector('#submit-button').value = 'Cadastrar';
    // Remove o campo oculto de ID se existir
    const idInput = form.querySelector('input[name="idusuario"]');
    if (idInput) {
      idInput.remove();
    }
  }
}

// Função para verificar o login
async function verificarLogin() {
  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;

  if (!usuario || !senha) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usuario, senha })
    });

    const data = await response.json();

    if (response.ok) {
      // Armazena os dados do usuário no localStorage
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      // Redireciona para a página principal
      window.location.href = 'principal.html';
    } else {
      alert(data.error || 'Erro ao fazer login');
    }
  } catch (error) {
    console.error('Erro ao conectar com o servidor:', error);
    alert('Erro ao conectar com o servidor. Por favor, tente novamente.');
  }
}

// Função para cadastrar/atualizar usuário
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const form = document.getElementById('form-aluno');
  const formData = {
    usuario: form.querySelector('input[name="usuario"]').value,
    nome: form.querySelector('input[name="NomeAluno"]').value,
    idade: parseInt(form.querySelector('input[name="Idade"]').value),
    telefone: form.querySelector('input[name="Telefone"]').value,
    senha: form.querySelector('input[name="Senha"]').value,
    perfil: form.querySelector('select[name="perfil"]').value
  };

  const idusuario = form.querySelector('input[name="idusuario"]')?.value;
  const isEdicao = !!idusuario;

  if (isEdicao) {
    formData.idusuario = idusuario;
  }

  try {
    const response = await fetch(`/.netlify/functions/${isEdicao ? 'atualizarUsuario' : 'cadastrarUsuario'}`, {
      method: isEdicao ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert(isEdicao ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
      document.getElementById('myModal').style.display = 'none';
      resetarFormulario();
      carregarUsuarios();
    } else {
      alert(data.error || `Erro ao ${isEdicao ? 'atualizar' : 'cadastrar'} usuário`);
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao processar a requisição. Por favor, tente novamente.');
  }
}

// Função para carregar dados dos usuários
async function carregarUsuarios() {
  try {
    // Carrega os perfis primeiro
    const perfilResponse = await fetch('/.netlify/functions/obterPerfis');
    if (!perfilResponse.ok) throw new Error('Erro ao carregar perfis');
    const perfis = await perfilResponse.json();
    
    // Cria um mapa de ID -> Nome do perfil
    const perfilMap = {};
    perfis.forEach(p => perfilMap[p.idperfilusuario] = p.perfil);

    // Carrega os usuários
    const response = await fetch('/.netlify/functions/obterUsuarios');
    if (!response.ok) throw new Error('Erro ao carregar usuários');
    
    const usuarios = await response.json();
    const tabela = $('#tabelaUsuarios').DataTable();
    tabela.clear();
    
    usuarios.forEach(usuario => {
      const acoes = `<div class="btn-group">
        <button onclick="editarUsuario(${usuario.idusuario})" class="btn btn-primary btn-sm" style="margin-right: 5px;">✏️</button>
        <button onclick="excluirUsuario(${usuario.idusuario})" class="btn btn-danger btn-sm">🗑️</button>
      </div>`;
      
      tabela.row.add([
        usuario.idusuario,
        usuario.usuario,
        usuario.nome,
        usuario.idade,
        usuario.telefone,
        perfilMap[usuario.idperfilusuario] || 'Não definido',
        acoes
      ]);
    });
    
    tabela.column(0).visible(false); // Oculta a coluna ID
    tabela.draw();
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    alert('Erro ao carregar lista de usuários');
  }
}

// Função para editar usuário
async function editarUsuario(idusuario) {
  try {
    const response = await fetch(`/.netlify/functions/obterUsuarios?idusuario=${idusuario}`);
    if (!response.ok) throw new Error('Erro ao carregar dados do usuário');
    
    const usuarios = await response.json();
    const usuario = usuarios.find(u => u.idusuario === idusuario);
    
    if (!usuario) {
      alert('Usuário não encontrado');
      return;
    }

    // Preenche o formulário com os dados do usuário
    const form = document.getElementById('form-aluno');
    form.querySelector('input[name="usuario"]').value = usuario.usuario;
    form.querySelector('input[name="NomeAluno"]').value = usuario.nome;
    form.querySelector('input[name="Idade"]').value = usuario.idade;
    form.querySelector('input[name="Telefone"]').value = usuario.telefone;
    form.querySelector('input[name="Senha"]').value = ''; // Por segurança, não preenchemos a senha

    // Adiciona o ID do usuário como um campo oculto
    let idInput = form.querySelector('input[name="idusuario"]');
    if (!idInput) {
      idInput = document.createElement('input');
      idInput.type = 'hidden';
      idInput.name = 'idusuario';
      form.appendChild(idInput);
    }
    idInput.value = idusuario;

    // Altera o texto do botão para "Atualizar"
    form.querySelector('#submit-button').value = 'Atualizar';

    // Carrega os perfis
    await carregarPerfis();
    
    // Seleciona o perfil do usuário
    form.querySelector('select[name="perfil"]').value = usuario.idperfilusuario || '';

    // Abre o modal
    document.getElementById('myModal').style.display = 'block';
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    alert('Erro ao carregar dados do usuário');
  }
}

// Função para excluir usuário
async function excluirUsuario(idusuario) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

  try {
    const response = await fetch(`/.netlify/functions/excluirUsuario?idusuario=${idusuario}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      alert('Usuário excluído com sucesso!');
      await carregarUsuarios();
    } else {
      console.error('Erro ao excluir usuário:', data);
      alert(data.error || 'Erro ao excluir usuário');
    }
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    alert('Erro ao excluir usuário. Por favor, tente novamente.');
  }
}

// Verifica autenticação ao carregar a página
function verificarAutenticacao() {
  const usuario = localStorage.getItem('usuario');
  if (!usuario) {
    window.location.href = 'index.html';
  }
}

// Função de logout
function logout() {
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

// Função para carregar os perfis de usuário
async function carregarPerfis() {
  try {
    const response = await fetch('/.netlify/functions/obterPerfis');
    if (!response.ok) throw new Error('Erro ao carregar perfis');
    
    const perfis = await response.json();
    const selectPerfil = document.querySelector('select[name="perfil"]');
    
    // Limpa as opções existentes
    selectPerfil.innerHTML = '<option value="">Selecione um perfil</option>';
    
    // Adiciona os perfis do banco
    perfis.forEach(perfil => {
      const option = document.createElement('option');
      option.value = perfil.idperfilusuario;
      option.textContent = perfil.perfil;
      selectPerfil.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar perfis:', error);
    alert('Erro ao carregar lista de perfis');
  }
}

// Inicialização do DataTables e eventos
$(document).ready(function() {
  // Inicializa DataTables se estiver na página de usuários
  if (document.getElementById('tabelaUsuarios')) {
    const table = $('#tabelaUsuarios').DataTable({
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json',
        info: '', 
        infoEmpty: '', 
        infoFiltered: '' 
      },
      pageLength: 25,
      lengthChange: false,
      dom: 'frtip'
    });

    // Move o campo de busca para dentro do topo-tabela
    $('.dataTables_filter').appendTo('.topo-tabela');
    carregarUsuarios();
  }

  // Adiciona handler para o formulário
  const formAluno = document.getElementById('form-aluno');
  if (formAluno) {
    formAluno.addEventListener('submit', handleFormSubmit);
  }

  // Adiciona handler para fechar o modal
  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = function() {
      document.getElementById('myModal').style.display = 'none';
      resetarFormulario();
    }
  }

  // Fecha o modal se clicar fora dele
  window.onclick = function(event) {
    const modal = document.getElementById('myModal');
    if (event.target == modal) {
      modal.style.display = 'none';
      resetarFormulario();
    }
  }

  // Handler para o botão de cadastrar
  const btnCadastrar = document.getElementById('btnCadastrarAluno');
  if (btnCadastrar) {
    btnCadastrar.onclick = function() {
      resetarFormulario();
      carregarPerfis(); // Carrega os perfis quando abrir o modal
      document.getElementById('myModal').style.display = 'block';
    }
  }
});
