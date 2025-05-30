const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const { data, error } = await supabase
      .from('financeiro')
      .select(`
          idfinanceiro,
          valor,
          data_vencimento,
          data_pagamento,
          dtcadastro,
          idusuario,
          usuarios (
            nome,
            usuario
          )
        `)
        .order('data_vencimento', { ascending: true });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Formata os dados para incluir o nome do usuário diretamente no objeto principal
    const formattedData = data.map(item => ({
      ...item,
      nome: item.usuarios?.nome || 'Usuário não encontrado',
      usuario: item.usuarios?.usuario || 'N/A'
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(formattedData),
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