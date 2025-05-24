const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'SUA_SUPABASE_KEY_AQUI';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'PUT') {
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

  const id = aluno.idaluno;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Campo idaluno é obrigatório' }),
    };
  }

  // Remova idaluno do objeto para atualizar só os outros campos
  const { idaluno, ...dadosAtualizados } = aluno;

  const { data, error } = await supabase
    .from('alunos')
    .update(dadosAtualizados)
    .eq('idaluno', id)
    .select();

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data[0]),
  };
};
