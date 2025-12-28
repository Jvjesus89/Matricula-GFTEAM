import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica se há usuário no localStorage ao carregar
    const storedUser = localStorage.getItem('usuario')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Erro ao parsear usuário:', error)
        localStorage.removeItem('usuario')
      }
    }
    setLoading(false)
  }, [])

  const login = async (usuario, senha) => {
    try {
      const response = await fetch('/.netlify/functions/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, senha }),
      })

      // Verifica se a resposta tem conteúdo antes de tentar parsear JSON
      const contentType = response.headers.get('content-type')
      let data

      if (contentType && contentType.includes('application/json')) {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            console.error('Erro ao parsear JSON:', parseError, 'Resposta:', text)
            return {
              success: false,
              error: 'Erro no servidor. Resposta inválida.',
            }
          }
        } else {
          return {
            success: false,
            error: 'Erro no servidor. Resposta vazia.',
          }
        }
      } else {
        const text = await response.text()
        console.error('Resposta não é JSON:', text)
        return {
          success: false,
          error: `Erro no servidor (${response.status}). Certifique-se de rodar "npm run netlify:dev" ao invés de "npm run dev".`,
        }
      }

      if (response.ok) {
        // Verifica se tem idusuario (aluno) ou idresponsavel (responsável)
        if (!data.usuario || (!data.usuario.idusuario && !data.usuario.idresponsavel)) {
          throw new Error('Dados do usuário incompletos')
        }

        const dadosUsuario = {
          ...data.usuario,
          usuario_perfil: data.usuario.usuario_perfil || null,
          tipo: data.tipo || 'aluno', // 'aluno' ou 'responsavel'
          alunos: data.alunos || [], // Lista de alunos (se for responsável)
        }

        // Se for responsável e não tiver idusuario, usa idresponsavel para compatibilidade
        if (dadosUsuario.tipo === 'responsavel' && !dadosUsuario.idusuario) {
          dadosUsuario.idusuario = dadosUsuario.idresponsavel
        }

        localStorage.setItem('usuario', JSON.stringify(dadosUsuario))
        setUser(dadosUsuario)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Erro ao fazer login' }
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor:', error)
      return {
        success: false,
        error: error.message || 'Erro ao conectar com o servidor. Por favor, tente novamente.',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('usuario')
    setUser(null)
  }

  const isAdmin = () => {
    return user?.usuario_perfil?.isadministrador === true
  }

  const isResponsavel = () => {
    return user?.tipo === 'responsavel'
  }

  const isAluno = () => {
    return user?.tipo === 'aluno' || (!user?.tipo && user?.idusuario) // Fallback para compatibilidade
  }

  const getAlunos = () => {
    return user?.alunos || []
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isResponsavel,
    isAluno,
    getAlunos,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

