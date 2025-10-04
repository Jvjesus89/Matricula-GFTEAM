const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  const idusuario = event.queryStringParameters.idusuario;

  if (!idusuario) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ID do usuário é obrigatório' }),
    };
  }

  const { data, error } = await supabase
    .from('usuarios')
    .delete()
    .eq('idusuario', idusuario);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Usuário excluído com sucesso!' }),
  };
};
