// Serviços de API para comunicação com as funções Netlify

export const api = {
  // Usuários
  async obterUsuarios() {
    const response = await fetch('/.netlify/functions/obterUsuarios')
    if (!response.ok) throw new Error('Erro ao carregar usuários')
    return response.json()
  },

  async cadastrarUsuario(data) {
    const response = await fetch('/.netlify/functions/cadastrarUsuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao cadastrar usuário')
    }
    return response.json()
  },

  async atualizarUsuario(data) {
    const response = await fetch('/.netlify/functions/atualizarUsuario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao atualizar usuário')
    }
    return response.json()
  },

  async excluirUsuario(idusuario) {
    const response = await fetch('/.netlify/functions/excluirUsuario', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idusuario }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao excluir usuário')
    }
    return response.json()
  },

  async obterPerfis() {
    const response = await fetch('/.netlify/functions/obterPerfis')
    if (!response.ok) throw new Error('Erro ao carregar perfis')
    return response.json()
  },

  // Financeiro
  async obterFinanceiro() {
    const response = await fetch('/.netlify/functions/obterFinanceiro')
    if (!response.ok) throw new Error('Erro ao carregar dados financeiros')
    return response.json()
  },

  async cadastrarFinanceiro(data) {
    const response = await fetch('/.netlify/functions/cadastrarFinanceiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao cadastrar pagamento')
    }
    return response.json()
  },

  async excluirFinanceiro(idfinanceiro) {
    const response = await fetch('/.netlify/functions/excluirFinanceiro', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idfinanceiro }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao excluir pagamento')
    }
    return response.json()
  },

  async gerarPix(idfinanceiro) {
    const response = await fetch('/.netlify/functions/gerarPix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idfinanceiro }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao gerar PIX')
    }
    return response.json()
  },

  async enviarWhatsApp(idfinanceiro) {
    const response = await fetch('/.netlify/functions/enviarWhatsApp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idfinanceiro }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao enviar WhatsApp')
    }
    return response.json()
  },

  // Responsáveis
  async obterResponsaveis() {
    const response = await fetch('/.netlify/functions/obterResponsaveis')
    if (!response.ok) throw new Error('Erro ao carregar responsáveis')
    return response.json()
  },

  async cadastrarResponsavel(data) {
    const response = await fetch('/.netlify/functions/cadastrarResponsavel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao cadastrar responsável')
    }
    return response.json()
  },

  async obterAlunosPorResponsavel(idresponsavel) {
    const response = await fetch('/.netlify/functions/obterAlunosPorResponsavel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idresponsavel }),
    })
    if (!response.ok) throw new Error('Erro ao carregar alunos do responsável')
    return response.json()
  },

  async atualizarResponsavel(data) {
    const response = await fetch('/.netlify/functions/atualizarResponsavel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao atualizar responsável')
    }
    return response.json()
  },

  async excluirResponsavel(idresponsavel) {
    const response = await fetch('/.netlify/functions/excluirResponsavel', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idresponsavel }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao excluir responsável')
    }
    return response.json()
  },

  async verificarUsuario(usuario) {
    const response = await fetch('/.netlify/functions/verificarUsuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario }),
    })
    if (!response.ok) {
      // Se der erro, assume que não está disponível por segurança
      return false
    }
    const data = await response.json()
    return data.disponivel === true
  },
}

