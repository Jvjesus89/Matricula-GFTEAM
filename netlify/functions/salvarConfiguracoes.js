const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não configuradas!');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event, context) {
  // Tratamento para requisições OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  if (!supabase) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Configuração do banco de dados não encontrada' })
    };
  }

  let configuracoes;
  try {
    configuracoes = JSON.parse(event.body);
  } catch (parseError) {
    console.error('Erro ao parsear body:', parseError);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'JSON inválido' })
    };
  }

  const { horario_funcionamento, valor_ate_vencimento, valor_apos_vencimento } = configuracoes;

  // Validação
  if (valor_ate_vencimento === undefined || valor_apos_vencimento === undefined) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Os valores são obrigatórios' })
    };
  }

  try {
    // Verifica se já existe uma configuração
    const { data: existingConfig } = await supabase
      .from('configuracoes')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;
    if (existingConfig) {
      // Atualiza a configuração existente
      const { data, error } = await supabase
        .from('configuracoes')
        .update({
          horario_funcionamento: horario_funcionamento || '',
          valor_ate_vencimento: parseFloat(valor_ate_vencimento),
          valor_apos_vencimento: parseFloat(valor_apos_vencimento),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select();

      if (error) throw error;
      result = data[0];
    } else {
      // Cria nova configuração
      const { data, error } = await supabase
        .from('configuracoes')
        .insert([{
          horario_funcionamento: horario_funcionamento || '',
          valor_ate_vencimento: parseFloat(valor_ate_vencimento),
          valor_apos_vencimento: parseFloat(valor_apos_vencimento),
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      result = data[0];
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Configurações salvas com sucesso!',
        configuracoes: result
      })
    };
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro ao salvar configurações: ' + error.message })
    };
  }
};

