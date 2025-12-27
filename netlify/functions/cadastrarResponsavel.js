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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
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
    const { nome, telefone, email, usuario, senha, idperfilusuario } = JSON.parse(event.body)

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

    // Se usuario e senha foram fornecidos, verifica se já existe
    if (usuario) {
      const { data: responsavelExistente, error: errorBusca } = await supabase
        .from('responsaveis')
        .select('idresponsavel')
        .eq('usuario', usuario)
        .maybeSingle()

      if (errorBusca && errorBusca.code !== 'PGRST116') {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Erro ao verificar usuário existente.' }),
        }
      }

      if (responsavelExistente) {
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

    // Prepara dados para inserção
    const dadosResponsavel = {
      nome,
      telefone: telefone || null,
      email: email || null,
      dtcadastro: new Date().toISOString(),
    }

    // Adiciona campos de login se fornecidos
    if (usuario) {
      dadosResponsavel.usuario = usuario
    }
    if (senha) {
      dadosResponsavel.senha = senha
    }
    if (idperfilusuario) {
      dadosResponsavel.idperfilusuario = parseInt(idperfilusuario, 10)
    }

    const { data, error } = await supabase
      .from('responsaveis')
      .insert([dadosResponsavel])
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
        message: 'Responsável cadastrado com sucesso!',
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
