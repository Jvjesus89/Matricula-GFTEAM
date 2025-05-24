const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'SUA_SUPABASE_KEY_AQUI';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  let aluno;
  try {
    aluno = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'JSON inválido' }),
    };
  }

  // Exemplo de dados esperados: { nome, idade, dtcadastro, telefone, usuario, senha }

  const { data, error } = await supabase
    .from('alunos')
    .insert([aluno])
    .select();

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify(data[0]),
  };
};
