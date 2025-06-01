const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event) {
  // Verifica se é uma requisição DELETE
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  // Obtém o ID do usuário da query string
  const { idusuario } = event.queryStringParameters;

  if (!idusuario) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ID do usuário não fornecido' })
    };
  }

  try {
    // Primeiro verifica se o usuário existe
    const { data: checkUser, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('idusuario', idusuario)
      .single();

    if (checkError || !checkUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Usuário não encontrado' })
      };
    }

    // Exclui o usuário
    const { error: deleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('idusuario', idusuario);

    if (deleteError) {
      throw deleteError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuário excluído com sucesso' })
    };
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao excluir usuário',
        details: error.message 
      })
    };
  }
}; 