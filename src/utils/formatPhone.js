// Função para formatar número de telefone
export function formatPhone(value) {
  let valor = value.replace(/\D/g, '')

  if (valor.length > 11) valor = valor.slice(0, 11)

  if (valor.length > 0) {
    if (valor.length <= 10) {
      valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    } else {
      valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
    }
  }

  return valor
}

