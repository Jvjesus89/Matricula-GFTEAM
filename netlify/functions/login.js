import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { usuario, senha } = JSON.parse(event.body)

  if (!usuario || !senha) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Usuário e senha são obrigatórios.' })
    }
  }

  try {
    // Consulta na tabela 'usuarios'
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', usuario)
      .eq('senha', senha) // Lembrete: não salve senha em texto puro!

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao consultar o banco.' })
      }
    }

    if (data.length === 1) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Login efetuado com sucesso!' })
      }
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Usuário ou senha inválidos.' })
      }
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro inesperado.' })
    }
  }
}
