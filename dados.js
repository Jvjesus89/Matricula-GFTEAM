// dados.js

window.verificarLogin = async function() {
  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value.trim();

  if (!usuario || !senha) {
    alert('Por favor, preencha usuário e senha.');
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/aluno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha }),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      // Você pode salvar dados no localStorage, sessionStorage, ou redirecionar
      // Exemplo salvar usuário:
      localStorage.setItem('alunoLogado', JSON.stringify(result.aluno));
      // Redirecionar para dashboard:
      window.location.href = 'dashboard.html';
    } else {
      alert(result.error || 'Erro ao fazer login.');
    }
  } catch (error) {
    console.error('Erro na conexão:', error);
    alert('Erro na conexão. Tente novamente.');
  }
};
