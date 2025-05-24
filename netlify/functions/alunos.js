const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'SUA_SUPABASE_KEY_AQUI'; // Use a chave segura aqui

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  const { data, error } = await supabase.from('alunos').select('*').order('idaluno', { ascending: true });

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
