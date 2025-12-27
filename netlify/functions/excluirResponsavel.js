const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

exports.handler = async function (event, context) {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'DELETE') {
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
    const { idresponsavel } = JSON.parse(event.body)

    if (!idresponsavel) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'idresponsavel é obrigatório' }),
      }
    }

    // Verifica se existem alunos vinculados a este responsável
    const { data: alunosVinculados, error: errorAlunos } = await supabase
      .from('usuarios')
      .select('idusuario, nome')
      .eq('idresponsavel', idresponsavel)
      .limit(1)

    if (errorAlunos) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Erro ao verificar alunos vinculados' }),
      }
    }

    if (alunosVinculados && alunosVinculados.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Não é possível excluir este responsável pois existem alunos vinculados a ele. Remova os vínculos primeiro.',
        }),
      }
    }

    // Exclui o responsável
    const { error } = await supabase.from('responsaveis').delete().eq('idresponsavel', idresponsavel)

    if (error) {
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Responsável excluído com sucesso!',
      }),
    }
  } catch (err) {
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


