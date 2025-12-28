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
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'PUT') {
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
    const { idresponsavel, nome, telefone, email, usuario, senha, idperfilusuario } = JSON.parse(event.body)

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

    if (!nome) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Nome do responsável é obrigatório' }),
      }
    }

    // Verifica se o responsável existe
    const { data: responsavelExistente, error: errorBusca } = await supabase
      .from('responsaveis')
      .select('idresponsavel, usuario')
      .eq('idresponsavel', idresponsavel)
      .single()

    if (errorBusca || !responsavelExistente) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Responsável não encontrado' }),
      }
    }

    // Se usuario foi alterado, verifica se já existe outro responsável com esse usuário
    if (usuario && usuario !== responsavelExistente.usuario) {
      const { data: usuarioExistente, error: errorUsuario } = await supabase
        .from('responsaveis')
        .select('idresponsavel')
        .eq('usuario', usuario)
        .neq('idresponsavel', idresponsavel)
        .maybeSingle()

      if (errorUsuario && errorUsuario.code !== 'PGRST116') {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Erro ao verificar usuário existente.' }),
        }
      }

      if (usuarioExistente) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Este nome de usuário já está sendo usado.' }),
        }
      }
    }

    // Prepara dados para atualização
    const dadosAtualizacao = {
      nome,
      telefone: telefone || null,
      email: email || null,
    }

    // Atualiza campos de login se fornecidos
    if (usuario !== undefined) {
      dadosAtualizacao.usuario = usuario || null
    }
    if (senha !== undefined && senha !== '') {
      dadosAtualizacao.senha = senha
    }
    if (idperfilusuario !== undefined) {
      dadosAtualizacao.idperfilusuario = idperfilusuario ? parseInt(idperfilusuario, 10) : null
    }

    const { data, error } = await supabase
      .from('responsaveis')
      .update(dadosAtualizacao)
      .eq('idresponsavel', idresponsavel)
      .select()

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
        message: 'Responsável atualizado com sucesso!',
        responsavel: data[0],
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


