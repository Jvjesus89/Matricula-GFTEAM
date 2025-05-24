const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'SUA_SUPABASE_KEY_AQUI';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  const id = event.queryStringParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Parâmetro id é obrigatório' }),
    };
  }

  const { data, error } = await supabase.from('alunos').select('*').eq('idaluno', id).single();

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
