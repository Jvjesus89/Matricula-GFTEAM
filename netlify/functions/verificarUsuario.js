const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

exports.handler = async function (event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' }),
    }
  }

  try {
    const { usuario } = JSON.parse(event.body)

    if (!usuario) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Usuário é obrigatório' }),
      }
    }

    // Verifica em usuarios
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('idusuario')
      .eq('usuario', usuario)
      .maybeSingle()

    if (usuarioError && usuarioError.code !== 'PGRST116') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Erro ao verificar usuário' }),
      }
    }

    // Se encontrou em usuarios, não está disponível
    if (usuarioData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ disponivel: false }),
      }
    }

    // Verifica em responsaveis
    const { data: responsavelData, error: responsavelError } = await supabase
      .from('responsaveis')
      .select('idresponsavel')
      .eq('usuario', usuario)
      .maybeSingle()

    if (responsavelError && responsavelError.code !== 'PGRST116') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Erro ao verificar responsável' }),
      }
    }

    // Se encontrou em responsaveis, não está disponível
    if (responsavelData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ disponivel: false }),
      }
    }

    // Se não encontrou em nenhuma tabela, está disponível
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ disponivel: true }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro no servidor: ' + err.message }),
    }
  }
}

