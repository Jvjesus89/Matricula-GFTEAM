const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

// Configuração do Supabase
const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

async function gerarPixDemo(pagamentoId, valor, descricao) {
  try {
    console.log('🔄 Gerando QR Code de demonstração para pagamento:', pagamentoId);

    // Gera um código PIX fictício
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540599.905802BR5915NOME DA EMPRESA6008BRASILIA62070503***6304E2CA`;

    // Gera o QR Code em base64
    const qrCodeBase64 = await QRCode.toDataURL(pixCode, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300
    });

    // Remove o prefixo "data:image/png;base64," do QR Code
    const qrCodeBase64Clean = qrCodeBase64.split(',')[1];

    // Atualiza o pagamento no Supabase com o QR Code fictício
    const { error: updateError } = await supabase
      .from('financeiro')
      .update({ 
        qr_code: pixCode,
        qr_code_base64: qrCodeBase64Clean
      })
      .eq('idfinanceiro', pagamentoId);

    if (updateError) {
      console.error('❌ Erro ao atualizar pagamento:', updateError);
      throw updateError;
    }

    return {
      qr_code: pixCode,
      qr_code_base64: qrCodeBase64Clean,
      payment_id: `DEMO-${pagamentoId}`
    };

  } catch (error) {
    console.error('❌ Erro ao gerar QR Code de demonstração:', error);
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

    // Gera o QR Code de demonstração
    const pixData = await gerarPixDemo(
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