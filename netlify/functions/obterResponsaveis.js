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
    // Tenta buscar da tabela responsaveis primeiro (se existir)
    // Se não existir, busca valores únicos do campo responsavel na tabela usuarios
    let data = []
    let error = null

    // Tenta buscar da tabela responsaveis
    const { data: responsaveisData, error: responsaveisError } = await supabase
      .from('responsaveis')
      .select(`
        idresponsavel, 
        nome, 
        telefone, 
        email,
        usuario,
        idperfilusuario,
        usuario_perfil (
          idperfilusuario,
          perfil,
          isadministrador
        )
      `)
      .order('nome', { ascending: true })

    if (!responsaveisError && responsaveisData) {
      // Se a tabela responsaveis existe, usa ela
      data = responsaveisData.map((r) => ({
        idresponsavel: r.idresponsavel,
        nome: r.nome,
        telefone: r.telefone || null,
        email: r.email || null,
        usuario: r.usuario || null,
        idperfilusuario: r.idperfilusuario || null,
        usuario_perfil: r.usuario_perfil || null,
      }))
    } else {
      // Se não existe, busca valores únicos do campo responsavel na tabela usuarios
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('responsavel, telefone')
        .not('responsavel', 'is', null)
        .neq('responsavel', '')

      if (usuariosError) {
        error = usuariosError
      } else {
        // Agrupa por responsavel único
        const responsaveisUnicos = {}
        usuariosData.forEach((item) => {
          if (item.responsavel && !responsaveisUnicos[item.responsavel]) {
            responsaveisUnicos[item.responsavel] = {
              nome: item.responsavel,
              telefone: item.telefone || null,
              email: null,
            }
          }
        })
        data = Object.values(responsaveisUnicos)
      }
    }

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

    const responsaveis = data

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responsaveis),
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
