const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

  // Verifica se o método é POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    console.log('📥 Webhook recebido:', JSON.stringify(data, null, 2));

    // Verifica se é uma notificação de pagamento
    if (data.action === 'payment.updated' || data.action === 'payment.approved') {
      const paymentId = data.data.id;
      const status = data.data.status;
      const paymentStatus = data.data.status_detail;

      console.log(`🔄 Verificando pagamento ${paymentId}`);
      console.log(`📊 Status: ${status}`);
      console.log(`📋 Detalhes: ${paymentStatus}`);

      // Verifica se o pagamento foi realmente aprovado
      if (status !== 'approved' || paymentStatus !== 'accredited') {
        console.log('❌ Pagamento não aprovado:', { status, paymentStatus });
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Pagamento não aprovado' })
        };
      }

      // Busca o pagamento pelo ID do Mercado Pago
      const { data: pagamento, error: fetchError } = await supabase
        .from('financeiro')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar pagamento:', fetchError);
        throw fetchError;
      }

      if (!pagamento) {
        console.error('❌ Pagamento não encontrado:', paymentId);
        throw new Error('Pagamento não encontrado');
      }

      console.log('📦 Pagamento encontrado:', pagamento);

      // Atualiza apenas se o pagamento não tiver sido processado antes
      if (!pagamento.data_pagamento) {
        const { data: updateData, error: updateError } = await supabase
          .from('financeiro')
          .update({ 
            payment_id: paymentId,
            status: 'pago'
          })
          .eq('idfinanceiro', pagamento.idfinanceiro)
          .select();

        if (updateError) {
          console.error('❌ Erro ao atualizar pagamento:', updateError);
          throw updateError;
        }

        console.log('✅ Pagamento atualizado com sucesso:', updateData);
      } else {
        console.log('ℹ️ Pagamento já processado anteriormente');
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Webhook processado com sucesso' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Webhook recebido' })
    };

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Erro ao processar webhook',
        detalhe: error.message 
      })
    };
  }
}; 