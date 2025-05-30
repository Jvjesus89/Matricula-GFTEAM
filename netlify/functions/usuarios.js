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
      .select('*')
      .eq('usuario', nomeUsuario)
      .eq('senha', senha)
      .single();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (!data) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Usuário ou senha inválidos.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login realizado com sucesso!',
        usuario: data
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