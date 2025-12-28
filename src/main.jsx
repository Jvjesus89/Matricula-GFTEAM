import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Função para inicializar o React
function init() {
  console.log('Inicializando React...')
  console.log('Document ready state:', document.readyState)
  console.log('Body:', document.body)
  console.log('HTML:', document.documentElement)
  
  let rootElement = document.getElementById('root')
  
  if (!rootElement) {
    console.error('Elemento root não encontrado! Tentando criar...')
    console.log('Body HTML:', document.body?.innerHTML)
    
    // Tenta criar o elemento se não existir
    if (!document.body) {
      console.error('Body não existe!')
      return
    }
    
    const newRoot = document.createElement('div')
    newRoot.id = 'root'
    document.body.appendChild(newRoot)
    rootElement = newRoot
    console.log('Elemento root criado:', rootElement)
  } else {
    console.log('Elemento root encontrado:', rootElement)
  }
  
  try {
    const root = ReactDOM.createRoot(rootElement)
    console.log('React root criado, renderizando...')
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    )
    console.log('React renderizado com sucesso!')
  } catch (error) {
    console.error('Erro ao renderizar React:', error)
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1>Erro ao carregar a aplicação</h1>
          <p>Erro: ${error.message}</p>
          <p>Stack: ${error.stack}</p>
          <p>Verifique o console para mais detalhes.</p>
        </div>
      `
    }
  }
}

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
  console.log('Aguardando DOMContentLoaded...')
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded disparado')
    init()
  })
} else {
  // DOM já está pronto
  console.log('DOM já está pronto, inicializando...')
  init()
}

// Fallback: tenta novamente após um pequeno delay
setTimeout(() => {
  if (!document.getElementById('root')?.hasChildNodes()) {
    console.log('Tentando novamente após timeout...')
    init()
  }
}, 100)

