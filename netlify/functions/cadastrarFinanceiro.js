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

  let financeiro;
  try {
    financeiro = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'JSON inválido' }),
    };
  }

  const { idusuario, valor, status, dtpagamento } = financeiro;

  if (!idusuario || !valor || !status || !dtpagamento) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Todos os campos são obrigatórios.' }),
    };
  }

  const { data, error } = await supabase
    .from('financeiro')
    .insert([
      {
        idusuario,
        valor,
        status,
        dtpagamento
      }
    ])
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
      message: 'Pagamento registrado com sucesso!',
      financeiro: data[0]
    }),
  };
}; 