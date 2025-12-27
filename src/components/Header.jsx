import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Header.css'

function Header() {
  const location = useLocation()
  const { user, logout, isAdmin } = useAuth()

  const isActive = (path) => {
    if (path === '/principal' || path === '/') {
      return location.pathname === '/' || location.pathname === '/principal'
    }
    // Verifica se é a rota de cadastros ou alunos
    if (path === '/cadastros') {
      return location.pathname === '/cadastros' || location.pathname === '/alunos'
    }
    return location.pathname === path
  }

  return (
    <header>
      <img src="/picture/gfteam.png" alt="GF TEAM" style={{ height: '80px', display: 'block', margin: '0 auto' }} />
      <div>
        <ul className="nav nav-tabs nav-justified">
          <li role="presentation" className={isActive('/principal') ? 'active' : ''}>
            <Link to="/principal" className="animated-button thar-four menu-txt">
              Principal
            </Link>
          </li>
          <li role="presentation" className={isActive('/financeiro') ? 'active' : ''}>
            <Link to="/financeiro" className="animated-button thar-four menu-txt">
              Financeiro
            </Link>
          </li>
          {isAdmin() && (
            <li role="presentation" className={isActive('/cadastros') ? 'active' : ''}>
              <Link to="/cadastros" className="animated-button thar-four menu-txt">
                Cadastros
              </Link>
            </li>
          )}
          <li role="presentation">
            <a href="#" className="menu-txt" onClick={(e) => { e.preventDefault(); logout(); }}>
              Sair
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}

export default Header

