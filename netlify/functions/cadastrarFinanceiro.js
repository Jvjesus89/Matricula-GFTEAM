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

  const { idfinanceiro, idusuario, valor, data_vencimento } = financeiro;

  // Validação dos campos obrigatórios
  if (!idusuario || !valor || !data_vencimento) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Os campos Aluno, Valor e Data de Vencimento são obrigatórios.' }),
    };
  }

  try {
    let result;
    
    if (idfinanceiro) {
      // Atualização de registro existente
      const { data, error } = await supabase
        .from('financeiro')
        .update({
          idusuario,
          valor,
          data_vencimento,
          data_pagamento: financeiro.data_pagamento
        })
        .eq('idfinanceiro', idfinanceiro)
        .select();

      if (error) throw error;
      result = data[0];
    } else {
      // Inserção de novo registro
      const { data, error } = await supabase
        .from('financeiro')
        .insert([{
          idusuario,
          valor,
          data_vencimento,
          data_pagamento: financeiro.data_pagamento
        }])
        .select();

      if (error) throw error;
      result = data[0];
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: idfinanceiro ? 'Pagamento atualizado com sucesso!' : 'Pagamento registrado com sucesso!',
        financeiro: result
      }),
    };
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}; 