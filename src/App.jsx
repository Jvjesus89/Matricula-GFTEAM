import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Principal from './pages/Principal'
import Alunos from './pages/Alunos'
import Financeiro from './pages/Financeiro'
import Configuracoes from './pages/Configuracoes'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#f5f5f5' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Carregando...</div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #000', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite', 
            margin: '0 auto' 
          }}></div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Principal />} />
        <Route path="principal" element={<Principal />} />
        <Route
          path="alunos"
          element={
            <ProtectedRoute requireAdmin>
              <Alunos />
            </ProtectedRoute>
          }
        />
        <Route
          path="cadastros"
          element={
            <ProtectedRoute requireAdmin>
              <Alunos />
            </ProtectedRoute>
          }
        />
        <Route
          path="configuracoes"
          element={
            <ProtectedRoute requireAdmin>
              <Configuracoes />
            </ProtectedRoute>
          }
        />
        <Route path="financeiro" element={<Financeiro />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/principal" : "/login"} replace />} />
    </Routes>
  )
}

function App() {
  try {
    return (
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    )
  } catch (error) {
    console.error('Erro no App:', error)
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Erro ao carregar aplicação</h1>
        <p>{error.message}</p>
        <p>Verifique o console para mais detalhes.</p>
      </div>
    )
  }
}

export default App

