import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Login.css'

function Login() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!usuario || !senha) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    setLoading(true)
    const result = await login(usuario, senha)
    setLoading(false)

    if (result.success) {
      navigate('/principal')
    } else {
      setError(result.error || 'Erro ao fazer login')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <br />
      <br />
      <div style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <img src="/picture/gfteam.png" alt="GF TEAM" style={{ height: '140px' }} />
      </div>
      <br />
      <br />

      <div className="container">
        <main>
          <form id="formCadastro" onSubmit={handleSubmit}>
            <div className="form-grupo">
              <label htmlFor="usuario">Login:</label>
              <input
                type="text"
                id="usuario"
                name="usuario"
                autoComplete="username"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>

            <div className="form-grupo">
              <label htmlFor="senha">Senha:</label>
              <input
                type="password"
                id="senha"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            {error && <div style={{ color: '#dc3545', marginBottom: '10px', fontSize: '14px' }}>{error}</div>}

            <button id="botao" type="submit" disabled={loading}>
              {loading ? 'Acessando...' : 'Acessar'}
            </button>
          </form>
        </main>
      </div>

      <div className="imagem-footer">
        <img src="/picture/Screenshot_2.png" alt="GF TEAM" />
      </div>
    </div>
  )
}

export default Login

