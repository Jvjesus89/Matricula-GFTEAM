import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import QRCode from 'qrcode';

// Configuração do Supabase (fora do handler para reuso)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Mercado Pago
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export default async (request, context) => {
  // 1. Tratamento de OPTIONS (Preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Verifica se o método é POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // 3. Valida e extrai o corpo da requisição (Novo padrão request.json())
    const body = await request.json();
    console.log('📦 Corpo da requisição:', body);

    if (!body.pagamentoId) {
      throw new Error('ID do pagamento não fornecido');
    }

    const { pagamentoId } = body;

    // 4. Busca os dados do pagamento no Supabase
    const { data: pagamento, error: fetchError } = await supabase
      .from('financeiro')
      .select(`
        *,
        usuarios ( nome )
      `)
      .eq('idfinanceiro', pagamentoId)
      .single();

    if (fetchError || !pagamento) {
      throw new Error(`Pagamento não encontrado: ${fetchError?.message}`);
    }

    if (pagamento.data_pagamento) {
      throw new Error('Este pagamento já foi aprovado anteriormente');
    }

    // 5. Valida o valor
    const valor = parseFloat(pagamento.valor);
    if (isNaN(valor) || valor <= 0) {
      throw new Error(`Valor inválido: ${pagamento.valor}`);
    }

    // 6. Gera o pagamento no Mercado Pago
    const mpPayload = {
      transaction_amount: valor,
      description: `Pagamento GFTEAM - ${pagamento.usuarios.nome}`,
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@email.com',
        first_name: pagamento.usuarios.nome.split(' ')[0],
        last_name: pagamento.usuarios.nome.split(' ').slice(1).join(' ') || 'Sobrenome'
      },
      external_reference: pagamentoId.toString()
    };

    const mpResponse = await axios.post(
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

    const paymentData = mpResponse.data;
    const qrCodePix = paymentData.point_of_interaction?.transaction_data?.qr_code;

    if (!qrCodePix) {
      throw new Error('QR Code não gerado pelo Mercado Pago');
    }

    // 7. Gera o QR Code em imagem (base64)
    const qrCodeBase64Raw = await QRCode.toDataURL(qrCodePix);
    const qrCodeBase64 = qrCodeBase64Raw.split(',')[1];

    // 8. Atualiza o registro no Supabase com o ID do Mercado Pago
    const { error: updateError } = await supabase
      .from('financeiro')
      .update({ payment_id: paymentData.id })
      .eq('idfinanceiro', pagamentoId);

    if (updateError) {
      throw new Error(`Erro ao salvar payment_id: ${updateError.message}`);
    }

    // 9. Retorno de Sucesso
    return new Response(
      JSON.stringify({
        qr_code: qrCodePix,
        qr_code_base64: qrCodeBase64,
        payment_id: paymentData.id
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao gerar QR Code',
        detalhe: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};