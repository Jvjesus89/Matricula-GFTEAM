const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A'

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Request body inválido.' }),
    };
  }

  const { usuario, senha } = body;

  if (!usuario || !senha) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Usuário e senha são obrigatórios.' }),
    };
  }

  try {
    const { data, error } = await supabase
      .from('alunos')
      .select('idaluno, nome, usuario')
      .eq('usuario', usuario)
      .eq('senha', senha) // Atenção: para produção, criptografe a senha!
      .limit(1);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao consultar o banco.' }),
      };
    }

    if (data.length === 1) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Login efetuado com sucesso!',
          aluno: data[0],
        }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Usuário ou senha inválidos.' }),
      };
    }
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro inesperado.' }),
    };
  }
};
