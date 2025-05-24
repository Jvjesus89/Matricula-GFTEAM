// dados.js

// Função para verificar o login acionada pelo botão na página
async function verificarLogin() {
  // Recupera os valores dos inputs
  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;

  // Validação simples dos campos
  if (!usuario || !senha) {
    alert("Usuário e senha são obrigatórios!");
    return;
  }

  // Monta o payload da requisição
  const payload = { usuario, senha };

  try {
    // Realiza a requisição para a função Netlify "aluno"
    const response = await fetch('/.netlify/functions/aluno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Converte a resposta para JSON
    const data = await response.json();

    if (response.ok) {
      // Em caso de sucesso, exibe a mensagem e os dados retornados
      alert(data.message);
      console.log("Dados do aluno:", data.aluno);
      // A partir daqui, você pode redirecionar o usuário ou armazenar dados para manter a sessão.
      // Exemplo: window.location.href = "dashboard.html";
    } else {
      // Em caso de erro, exibe a mensagem de erro
      alert(data.error || "Erro no login.");
    }
  } catch (error) {
    console.error("Erro ao conectar com o servidor:", error);
    alert("Erro inesperado. Por favor, tente novamente mais tarde.");
  }
}

// Disponibiliza a função no escopo global para que ela possa ser chamada pelo atributo "onclick" no HTML
window.verificarLogin = verificarLogin;
