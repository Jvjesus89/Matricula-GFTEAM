const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuração do Supabase
const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Mercado Pago
const MP_ACCESS_TOKEN = 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

async function verificarPagamento(paymentId) {
  try {
    console.log('🔍 Verificando pagamento:', paymentId);

    const response = await axios({
      method: 'GET',
      url: `https://api.mercadopago.com/v1/payments/${paymentId}`,
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    console.log('📊 Status do pagamento:', response.data.status);

    return response.data;
  } catch (error) {
    console.error('❌ Erro ao verificar pagamento:', error);
    throw error;
  }
}

async function atualizarPagamento(paymentId, status) {
  try {
    console.log('🔄 Atualizando pagamento:', paymentId);

    const { error } = await supabase
      .from('financeiro')
      .update({ 
        data_pagamento: status === 'approved' ? new Date().toISOString() : null,
        status_pagamento: status
      })
      .eq('payment_id', paymentId);

    if (error) {
      console.error('❌ Erro ao atualizar pagamento:', error);
      throw error;
    }

    console.log('✅ Pagamento atualizado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao atualizar pagamento:', error);
    throw error;
  }
}

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
    console.log('📨 Webhook recebido:', data);

    // Verifica se é uma notificação de pagamento
    if (data.action === 'payment.updated' || data.action === 'payment.approved') {
      const paymentId = data.data.id;
      
      // Verifica o status do pagamento
      const paymentData = await verificarPagamento(paymentId);
      
      // Atualiza o pagamento no banco de dados
      await atualizarPagamento(paymentId, paymentData.status);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Webhook processado com sucesso' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Webhook ignorado' })
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