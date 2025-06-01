const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A'

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
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

  const { usuario: nomeUsuario, senha } = usuario;

  if (!nomeUsuario || !senha) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Usuário e senha são obrigatórios.' }),
    };
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        usuario_perfil (
          perfil,
          isadministrador
        )
      `)
      .eq('usuario', nomeUsuario)
      .eq('senha', senha);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Se não encontrou nenhum usuário
    if (!data || data.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Usuário ou senha inválidos.' }),
      };
    }

    // Se encontrou mais de um usuário (não deveria acontecer)
    if (data.length > 1) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro no sistema. Por favor, contate o administrador.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login realizado com sucesso!',
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