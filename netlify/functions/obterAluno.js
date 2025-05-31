const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Permitir apenas método GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido. Use GET.' }),
    };
  }

  try {
    let query = supabase
      .from('usuarios')
      .select('*')
      .eq('idperfilusuario', 2); // Assumindo que 2 é o ID do perfil de aluno

    // Se um ID foi fornecido, busca apenas esse usuário
    const id = event.queryStringParameters?.id;
    if (id) {
      query = query.eq('idusuario', id);
    }

    const { data, error } = await query;

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
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
