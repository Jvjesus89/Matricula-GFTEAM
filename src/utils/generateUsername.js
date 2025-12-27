/**
 * Gera sugestões de nome de usuário baseado no nome completo
 * @param {string} nomeCompleto - Nome completo da pessoa
 * @param {Function} verificarDisponibilidade - Função async que verifica se o usuário está disponível
 * @returns {Promise<string>} - Sugestão de nome de usuário disponível
 */
export async function generateUsername(nomeCompleto, verificarDisponibilidade) {
  if (!nomeCompleto || nomeCompleto.trim() === '') {
    return ''
  }

  // Remove espaços extras e divide o nome em partes
  const partes = nomeCompleto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((parte) => parte.length > 0)

  if (partes.length === 0) {
    return ''
  }

  const primeiroNome = partes[0]
  const segundoNome = partes[1] || ''
  const ultimoNome = partes[partes.length - 1]

  // Gera sugestões em ordem de preferência
  const sugestoes = []

  // 1. Primeiro nome + primeira letra do segundo nome em minúscula (ex: joaov)
  // Esta é a regra padrão mais comum
  if (segundoNome) {
    sugestoes.push(primeiroNome + segundoNome[0])
  }

  // 2. Primeiro nome + primeira letra do segundo nome em maiúscula (ex: joaoH)
  // Alternativa caso a minúscula já exista
  if (segundoNome) {
    sugestoes.push(primeiroNome + segundoNome[0].toUpperCase())
  }

  // 3. Primeiro nome + último nome (ex: joaojesus)
  // Usado quando as opções anteriores já existem
  if (ultimoNome && ultimoNome !== primeiroNome && ultimoNome !== segundoNome) {
    sugestoes.push(primeiroNome + ultimoNome)
  }

  // 4. Primeiro nome + primeiras letras de todos os nomes (ex: joaohv)
  if (partes.length > 2) {
    const iniciais = partes.slice(1).map((p) => p[0]).join('')
    sugestoes.push(primeiroNome + iniciais)
  }

  // 5. Apenas primeiro nome (ex: joao)
  sugestoes.push(primeiroNome)

  // 6. Primeiro nome + número (ex: joao1, joao2, etc)
  for (let i = 1; i <= 10; i++) {
    sugestoes.push(primeiroNome + i)
  }

  // Remove acentos e caracteres especiais de todas as sugestões
  const limparTexto = (texto) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
  }

  const sugestoesLimpas = sugestoes.map(limparTexto).filter((s) => s.length > 0)

  // Remove duplicatas mantendo a ordem
  const sugestoesUnicas = [...new Set(sugestoesLimpas)]

  // Se não há função de verificação, retorna a primeira sugestão
  if (!verificarDisponibilidade) {
    return sugestoesUnicas[0] || ''
  }

  // Verifica disponibilidade de cada sugestão
  for (const sugestao of sugestoesUnicas) {
    try {
      const disponivel = await verificarDisponibilidade(sugestao)
      if (disponivel) {
        return sugestao
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error)
      // Em caso de erro, continua para próxima sugestão
    }
  }

  // Se nenhuma sugestão está disponível, retorna a primeira com timestamp
  return sugestoesUnicas[0] + Date.now().toString().slice(-4)
}

/**
 * Gera uma sugestão rápida sem verificar disponibilidade
 * @param {string} nomeCompleto - Nome completo da pessoa
 * @returns {string} - Primeira sugestão de nome de usuário
 */
export function generateUsernameQuick(nomeCompleto) {
  if (!nomeCompleto || nomeCompleto.trim() === '') {
    return ''
  }

  const partes = nomeCompleto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((parte) => parte.length > 0)

  if (partes.length === 0) {
    return ''
  }

  const primeiroNome = partes[0]
  const segundoNome = partes[1] || ''
  const ultimoNome = partes[partes.length - 1]

  // Remove acentos e caracteres especiais
  const limparTexto = (texto) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
  }

  // Prioridade: primeiro nome + primeira letra do segundo nome em minúscula
  if (segundoNome) {
    return limparTexto(primeiroNome + segundoNome[0])
  }

  // Se não tem segundo nome, usa primeiro + último
  if (ultimoNome && ultimoNome !== primeiroNome) {
    return limparTexto(primeiroNome + ultimoNome)
  }

  // Se não tem nada, retorna apenas o primeiro nome
  return limparTexto(primeiroNome)
}

