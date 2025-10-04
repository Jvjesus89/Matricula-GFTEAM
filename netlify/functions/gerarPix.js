const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const QRCode = require('qrcode');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Mercado Pago
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY;

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
    // Valida o corpo da requisição
    if (!event.body) {
      throw new Error('Corpo da requisição não fornecido');
    }

    let body;
    try {
      body = JSON.parse(event.body);
      console.log('📦 Corpo da requisição:', body);
    } catch (e) {
      throw new Error(`Erro ao parsear JSON: ${e.message}`);
    }

    if (!body.pagamentoId) {
      throw new Error('ID do pagamento não fornecido');
    }

    const { pagamentoId } = body;
    console.log('📥 Gerando QR Code para pagamento:', pagamentoId);

    // Busca os dados do pagamento
    let pagamento;
    try {
      console.log('🔍 Buscando dados do pagamento no Supabase...');
      const { data, error: fetchError } = await supabase
        .from('financeiro')
        .select(`
          *,
          usuarios (
            nome
          )
        `)
        .eq('idfinanceiro', pagamentoId)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar pagamento: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('Pagamento não encontrado');
      }

      // Validações adicionais do pagamento
      if (!data.valor || data.valor <= 0) {
        throw new Error('Valor do pagamento inválido ou não informado');
      }

      if (!data.usuarios?.nome) {
        throw new Error('Nome do usuário não encontrado');
      }

      if (data.data_pagamento) {
        throw new Error('Este pagamento já foi aprovado anteriormente');
      }

      if (data.payment_id) {
        throw new Error('Este pagamento já possui um QR Code gerado');
      }

      pagamento = data;
      console.log('✅ Pagamento encontrado e validado:', pagamento);
    } catch (e) {
      console.error('❌ Erro ao buscar/validar pagamento:', e);
      throw new Error(`Erro ao buscar/validar pagamento: ${e.message}`);
    }

    // Valida o valor do pagamento
    const valor = parseFloat(pagamento.valor);
    if (isNaN(valor) || valor <= 0) {
      throw new Error(`Valor inválido: ${pagamento.valor}`);
    }

    console.log('💰 Valor do pagamento:', valor);

    // Gera o QR Code usando o Mercado Pago
    let paymentData;
    try {
      console.log('🔄 Gerando pagamento no Mercado Pago...');
      const mpPayload = {
        transaction_amount: valor,
        description: `Pagamento GFTEAM - ${pagamento.usuarios.nome}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@email.com',
          first_name: pagamento.usuarios.nome.split(' ')[0],
          last_name: pagamento.usuarios.nome.split(' ').slice(1).join(' ')
        },
        external_reference: pagamentoId.toString()
      };

      console.log('📤 Payload para Mercado Pago:', mpPayload);

      const response = await axios.post(
        'https://api.mercadopago.com/v1/payments',
        mpPayload,
        {
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `${pagamentoId}-${Date.now()}`
          }
        }
      );

      paymentData = response.data;
      console.log('📦 Resposta do Mercado Pago:', paymentData);

      if (!paymentData.point_of_interaction?.transaction_data?.qr_code) {
        throw new Error('QR Code não encontrado na resposta do Mercado Pago');
      }
    } catch (e) {
      console.error('❌ Erro ao gerar pagamento no Mercado Pago:', e.response?.data || e.message);
      throw new Error(`Erro ao gerar pagamento no Mercado Pago: ${e.response?.data?.message || e.message}`);
    }

    // Gera o QR Code em base64
    let qrCodeBase64;
    try {
      console.log('🔄 Gerando QR Code em base64...');
      // Usa o código PIX direto do Mercado Pago
      qrCodeBase64 = await QRCode.toDataURL(paymentData.point_of_interaction.transaction_data.qr_code);
      console.log('✅ QR Code gerado com sucesso');
    } catch (e) {
      console.error('❌ Erro ao gerar QR Code em base64:', e);
      throw new Error(`Erro ao gerar QR Code em base64: ${e.message}`);
    }

    // Atualiza o registro com o ID do pagamento
    try {
      console.log('🔄 Atualizando registro no Supabase...');
      const { error: updateError } = await supabase
        .from('financeiro')
        .update({ 
          payment_id: paymentData.id
        })
        .eq('idfinanceiro', pagamentoId);

      if (updateError) {
        throw new Error(`Erro ao atualizar pagamento: ${updateError.message}`);
      }

      console.log('✅ Registro atualizado com sucesso');
    } catch (e) {
      console.error('❌ Erro ao atualizar registro:', e);
      throw new Error(`Erro ao atualizar registro: ${e.message}`);
    }

    // Retorna os dados do QR Code
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        qr_code: paymentData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: qrCodeBase64.split(',')[1],
        payment_id: paymentData.id
      })
    };

  } catch (error) {
    console.error('❌ Erro detalhado:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Erro ao gerar QR Code',
        detalhe: error.message || 'Erro desconhecido',
        stack: error.stack
      })
    };
  }
}; 