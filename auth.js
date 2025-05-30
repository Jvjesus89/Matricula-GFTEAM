// Função para verificar se o usuário está autenticado
function verificarAutenticacao() {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
        // Se não houver usuário no localStorage, redireciona para o login
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

// Executa a verificação quando o arquivo é carregado
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();

    // Adiciona o botão de logout no header se ele existir
    const headerElement = document.getElementById('header-placeholder');
    if (headerElement) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    // Procura pela ul do menu
                    const menuUl = document.querySelector('.nav-tabs');
                    if (menuUl && !document.getElementById('logout-li')) {
                        // Adiciona o item de logout no menu
                        const logoutLi = document.createElement('li');
                        logoutLi.id = 'logout-li';
                        logoutLi.role = 'presentation';
                        logoutLi.innerHTML = '<a href="#" class="menu-txt" onclick="logout()">Sair</a>';
                        menuUl.appendChild(logoutLi);
                    }
                }
            });
        });

        observer.observe(headerElement, { childList: true, subtree: true });
    }
}); 