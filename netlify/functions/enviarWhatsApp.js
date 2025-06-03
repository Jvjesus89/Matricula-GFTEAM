const axios = require('axios');

// Configuração do WhatsApp Business API
const WHATSAPP_TOKEN = 'EAATjiH8My38BO7M7rAOZCw4ISLbA6ZA2VZBjEyhOCfHcLir8oYm8BdbaZCmdn1Eiq1Gtc9SBqGbbgnNoMW7YKyq2gKZB00Lrovnbe0J5TpFygKJmoZC444Hv4nObFNM3C6fB8xdYhsNV8KyaLEZBkJICxbKzRQQ5xRRcB5O1ZAWBAuKfg5OqHvLWzpyZB1Gvqqo94WgZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '624266544111694';

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event, context) {
  console.log('📥 Iniciando processamento da requisição');
  console.log('📦 Corpo da requisição:', event.body);
  
  // Tratamento para requisições OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔄 Requisição OPTIONS recebida');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Verifica se o método é POST
  if (event.httpMethod !== 'POST') {
    console.log('❌ Método não permitido:', event.httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    const { telefone, nome, valor, dataVencimento } = JSON.parse(event.body);

    if (!telefone || !nome || !valor || !dataVencimento) {
      console.log('❌ Dados incompletos:', { 
        telefone: !!telefone, 
        nome: !!nome, 
        valor: !!valor, 
        dataVencimento: !!dataVencimento 
      });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          sucesso: false,
          erro: 'Todos os campos são obrigatórios'
        })
      };
    }

    // Garante que o número está no formato correto (apenas números)
    const numeroFormatado = telefone.replace(/\D/g, '');
    console.log('📱 Número formatado:', numeroFormatado);

    console.log('📤 Enviando mensagem para:', numeroFormatado);
    console.log('📝 Dados da mensagem:', { nome, valor, dataVencimento });

    // Verifica o status do número do WhatsApp
    try {
      console.log('🔍 Verificando status do número do WhatsApp...');
      const statusResponse = await axios({
        method: 'GET',
        url: `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}`,
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`
        }
      });
      console.log('✅ Status do número:', statusResponse.data);
    } catch (statusError) {
      console.error('❌ Erro ao verificar status:', statusError.response?.data || statusError.message);
    }

    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: numeroFormatado,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          },
          /*components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: nome
                },
                {
                  type: 'text',
                  text: valor
                },
                {
                  type: 'text',
                  text: dataVencimento
                }
              ]
            }
          ]*/
        }
      }
    });

    console.log('✅ Resposta da API do WhatsApp:', JSON.stringify(response.data, null, 2));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        sucesso: true,
        response: response.data
      })
    };

  } catch (error) {
    console.error('❌ Erro detalhado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        sucesso: false,
        erro: error.response?.data || error.message
      })
    };
  }
};