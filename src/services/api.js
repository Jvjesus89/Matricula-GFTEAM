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
      body: JSON.stringify({ pagamentoId: idfinanceiro }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.detalhe || 'Erro ao gerar PIX')
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

  // Configurações
  async obterConfiguracoes() {
    const response = await fetch('/.netlify/functions/obterConfiguracoes')
    if (!response.ok) throw new Error('Erro ao carregar configurações')
    return response.json()
  },

  async salvarConfiguracoes(data) {
    const response = await fetch('/.netlify/functions/salvarConfiguracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao salvar configurações')
    }
    return response.json()
  },

  async processarLancamentosMensais() {
    try {
      // Sempre usa a função manual que não tem restrições de função agendada
      // A função manual funciona tanto em desenvolvimento quanto em produção
      const functionName = 'processarLancamentosMensaisManual'
      
      const response = await fetch(`/.netlify/functions/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      // Lê o texto da resposta primeiro
      const responseText = await response.text()
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`
        try {
          if (isJson && responseText) {
            const error = JSON.parse(responseText)
            errorMessage = error.error || error.detalhe || error.message || errorMessage
          } else if (responseText) {
            // Se não for JSON, tenta extrair informações úteis
            errorMessage = responseText.substring(0, 300).replace(/<[^>]*>/g, '') || errorMessage
          }
        } catch (e) {
          console.error('Erro ao processar resposta de erro:', e)
          if (responseText) {
            errorMessage = responseText.substring(0, 300).replace(/<[^>]*>/g, '') || errorMessage
          }
        }
        throw new Error(errorMessage)
      }
      
      // Se a resposta é ok, verifica se é JSON
      if (!isJson) {
        throw new Error(`Resposta inválida do servidor (não é JSON): ${responseText.substring(0, 200)}`)
      }
      
      try {
        return JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Erro ao processar resposta JSON: ${e.message}`)
      }
    } catch (error) {
      // Se for um erro de rede ou timeout
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet ou tente novamente mais tarde.')
      }
      throw error
    }
  },
}

