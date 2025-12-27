const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido' }),
    }
  }

  try {
    // Busca usuários com relacionamento responsaveis e usuario_perfil
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        idusuario,
        usuario,
        nome,
        idade,
        telefone,
        idperfilusuario,
        idresponsavel,
        usuario_perfil (
          idperfilusuario,
          perfil,
          isadministrador
        ),
        responsaveis (
          idresponsavel,
          nome,
          telefone,
          email
        )
      `)
      .order('idusuario', { ascending: true })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: error.message }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    }
  } catch (err) {
    console.error('Erro no servidor:', err)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Erro no servidor: ' + err.message }),
    }
  }
}
