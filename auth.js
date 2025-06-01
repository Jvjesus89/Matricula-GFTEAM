// Verifica se o usuário está autenticado
function verificarAutenticacao() {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
        // Se não houver usuário no localStorage, redireciona para o login
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Verifica se o usuário é administrador
function isAdmin() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        console.log('Verificando permissões:', usuario);
        
        // Verifica se o usuário tem o perfil e se é administrador
        const isAdminByProfile = usuario?.usuario_perfil?.isadministrador === true;
        const isAdminById = usuario?.idperfilusuario === 1;
        
        console.log('Admin por perfil:', isAdminByProfile);
        console.log('Admin por ID:', isAdminById);
        console.log('Dados do perfil:', usuario?.usuario_perfil);
        
        return isAdminByProfile || isAdminById;
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        return false;
    }
}

// Verifica se o usuário tem acesso a uma funcionalidade específica
function verificarAcesso() {
    if (!verificarAutenticacao()) return;

    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const isAdministrador = isAdmin(); // Usa a função robusta
        
        // Obtém o caminho atual e normaliza para lowercase
        const path = window.location.pathname.toLowerCase();
        const paginaAtual = path.split('/').pop();
        console.log('Página atual:', paginaAtual);
        console.log('Caminho completo:', path);

        // Lista de páginas restritas a administradores (incluindo variações)
        const paginasAdmin = ['alunos.html', 'alunos', '/alunos.html', '/alunos'];

        // Se não for administrador e tentar acessar uma página restrita, redireciona
        if (!isAdministrador && paginasAdmin.some(pagina => path.includes(pagina.toLowerCase()))) {
            console.log('Acesso negado: usuário não é administrador');
            window.location.href = 'principal.html';
            return;
        }

        // Configura a visibilidade dos elementos baseado no perfil
        configurarInterface(isAdministrador);
    } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        window.location.href = 'index.html';
    }
}

// Configura a interface baseada no perfil do usuário
function configurarInterface(isAdministrador) {
    // Oculta/mostra itens do menu principal
    const menuItens = document.querySelectorAll('a[href*="alunos" i]'); // Case insensitive
    menuItens.forEach(item => {
        const menuItem = item.parentElement;
        if (menuItem) {
            menuItem.style.display = isAdministrador ? '' : 'none';
        }
    });

    // Se estiver na página de alunos, configura os elementos
    if (window.location.pathname.toLowerCase().includes('alunos')) {
        // Oculta a aba de cadastro para não administradores
        const abaCadastro = document.querySelector('.nav-tabs li a[href="#cadastro"]')?.parentElement;
        if (abaCadastro && !isAdministrador) {
            abaCadastro.style.display = 'none';
            // Força a exibição da primeira aba disponível
            const primeiraAba = document.querySelector('.nav-tabs li:not([style*="display: none"]) a');
            if (primeiraAba) {
                primeiraAba.click();
            }
        }

        // Oculta o botão de cadastrar para não administradores
        const btnCadastrar = document.getElementById('btnCadastrarAluno');
        if (btnCadastrar) {
            btnCadastrar.style.display = isAdministrador ? '' : 'none';
        }
    }

    // Se estiver na página de financeiro, configura os elementos
    if (window.location.pathname.toLowerCase().includes('financeiro')) {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        
        // Configura visibilidade das abas e botões para não administradores
        if (!isAdministrador) {
            // Oculta a aba de gráficos
            const abaGraficos = document.querySelector('.nav-tabs li a[href="#graficos"]')?.parentElement;
            if (abaGraficos) {
                abaGraficos.style.display = 'none';
                // Força a exibição da aba de cadastro
                document.querySelector('.nav-tabs li a[href="#cadastro"]')?.parentElement?.classList.add('active');
                document.getElementById('cadastro')?.classList.add('active');
                document.getElementById('graficos')?.classList.remove('active');
            }

            // Oculta o botão de cadastrar
            const btnCadastrar = document.getElementById('btnCadastrarFinanceiro');
            if (btnCadastrar) {
                btnCadastrar.style.display = 'none';
            }

            // Oculta os botões de ação na tabela se ela já estiver inicializada
            if (window.tabelaFinanceiro) {
                window.tabelaFinanceiro.column(-1).visible(false);
            }

            // Filtra apenas os registros do usuário atual
            window.filtrarFinanceiroPorUsuario = usuario.idusuario;
        }
    }
}

// Função de logout
function logout() {
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

// Inicializa o controle de acesso quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    verificarAcesso();

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

                        // Reconfigura a interface após adicionar o menu
                        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
                        const isAdministrador = usuario?.usuario_perfil?.isadministrador === true;
                        configurarInterface(isAdministrador);
                    }
                }
            });
        });

        observer.observe(headerElement, { childList: true, subtree: true });
    }
}); 