const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuração do Supabase
const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Mercado Pago
const MP_ACCESS_TOKEN = 'APP_USR-2355140035774994-060516-86fdf8b10b4b5369005b6283a478fac9-527576692';
const MP_PUBLIC_KEY = 'APP_USR-6bbd29ce-18de-4778-9d1b-8abbb76e5f30';

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

async function gerarPix(pagamentoId, valor, descricao) {
  try {
    console.log('🔄 Iniciando geração do PIX para pagamento:', pagamentoId);
    console.log('Valor recebido:', valor);
    console.log('Descrição:', descricao);

    // Converte o valor para número e garante que seja um valor válido
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      throw new Error('Valor inválido para o pagamento');
    }

    console.log('Valor convertido:', valorNumerico);

    // Gera o QR Code no Mercado Pago
    const response = await axios({
      method: 'POST',
      url: 'https://api.mercadopago.com/v1/payments',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${pagamentoId}-${Date.now()}`
      },
      data: {
        transaction_amount: Number(valorNumerico.toFixed(2)),
        description: descricao,
        payment_method_id: 'pix',
        external_reference: pagamentoId.toString(),
        notification_url: 'https://gf-team.netlify.app/.netlify/functions/webhookPix',
        payer: {
          email: 'cliente@exemplo.com',
          first_name: 'Cliente',
          last_name: 'Exemplo'
        }
      }
    });

    console.log('✅ QR Code gerado com sucesso:', response.data);

    if (!response.data.point_of_interaction?.transaction_data?.qr_code) {
      throw new Error('QR Code não encontrado na resposta do Mercado Pago');
    }

    // Atualiza o pagamento no Supabase com o ID do pagamento do Mercado Pago
    const { error: updateError } = await supabase
      .from('financeiro')
      .update({ 
        payment_id: response.data.id,
        qr_code: response.data.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: response.data.point_of_interaction.transaction_data.qr_code_base64
      })
      .eq('idfinanceiro', pagamentoId);

    if (updateError) {
      console.error('❌ Erro ao atualizar pagamento:', updateError);
      throw updateError;
    }

    return {
      qr_code: response.data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: response.data.point_of_interaction.transaction_data.qr_code_base64,
      payment_id: response.data.id
    };

  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Detalhes do erro:', error.response.data);
      throw new Error(`Erro do Mercado Pago: ${error.response.data.error} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(error.response?.data?.message || error.message || 'Erro ao gerar QR Code');
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
    const { pagamentoId } = JSON.parse(event.body);

    if (!pagamentoId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'ID do pagamento é obrigatório' })
      };
    }

    console.log('Buscando pagamento:', pagamentoId);

    // Busca os dados do pagamento
    const { data: pagamento, error: fetchError } = await supabase
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
      console.error('Erro ao buscar pagamento:', fetchError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Erro ao buscar pagamento', detalhe: fetchError.message })
      };
    }

    if (!pagamento) {
      console.error('Pagamento não encontrado:', pagamentoId);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Pagamento não encontrado' })
      };
    }

    console.log('Pagamento encontrado:', pagamento);

    // Gera o QR Code
    const pixData = await gerarPix(
      pagamento.idfinanceiro,
      pagamento.valor,
      `Pagamento de ${pagamento.usuarios.nome} - ${pagamento.descricao || 'Mensalidade'}`
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(pixData)
    };

  } catch (error) {
    console.error('❌ Erro na função:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Erro ao gerar QR Code',
        detalhe: error.message 
      })
    };
  }
}; 