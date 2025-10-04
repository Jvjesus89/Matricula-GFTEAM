const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  let usuario;
  try {
    usuario = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'JSON inválido' }),
    };
  }

  const { idusuario, usuario: nomeUsuario, Responsavel, nome, idade, telefone, senha, perfil } = usuario;

  if (!idusuario) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ID do usuário é obrigatório' }),
    };
  }

  try {
    // Verifica se o usuário existe
    const { data: usuarioExistente, error: errorBusca } = await supabase
      .from('usuarios')
      .select('idusuario')
      .eq('idusuario', idusuario)
      .single();

    if (errorBusca || !usuarioExistente) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Usuário não encontrado' }),
      };
    }

    // Prepara os dados para atualização
    const dadosAtualizacao = {
      usuario: nomeUsuario,
      // aceita tanto 'Responsavel' vindo do formulário quanto 'responsavel'
      responsavel: Responsavel,
      nome,
      idade,
      telefone,
      idperfilusuario: perfil
    };

    // Só inclui a senha se ela foi fornecida
    if (senha) {
      dadosAtualizacao.senha = senha;
    }

    // Atualiza o usuário
    const { data, error } = await supabase
      .from('usuarios')
      .update(dadosAtualizacao)
      .eq('idusuario', idusuario)
      .select();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Usuário atualizado com sucesso!',
        usuario: data[0]
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro no servidor: ' + err.message }),
    };
  }
};
