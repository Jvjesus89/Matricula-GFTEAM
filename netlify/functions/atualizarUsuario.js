const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A'

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

  const { idusuario, usuario: nomeUsuario, nome, idade, telefone, senha, perfil } = usuario;

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
