const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

exports.handler = async function (event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
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

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' }),
    }
  }

  try {
    let idresponsavel

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      idresponsavel = body.idresponsavel
    } else {
      // GET - pega do query string
      idresponsavel = event.queryStringParameters?.idresponsavel
    }

    if (!idresponsavel) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'idresponsavel é obrigatório' }),
      }
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        idusuario,
        usuario,
        nome,
        idade,
        telefone,
        idresponsavel
      `)
      .eq('idresponsavel', idresponsavel)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar alunos do responsável:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message }),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data || []),
    }
  } catch (err) {
    console.error('Erro no servidor:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro no servidor: ' + err.message }),
    }
  }
}


