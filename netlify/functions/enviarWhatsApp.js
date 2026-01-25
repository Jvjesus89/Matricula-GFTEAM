import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não configuradas!');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Configuração do WhatsApp Business API
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const handler = async (event, context) => {
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
  };
  export default handler;

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
    if (!supabase) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          sucesso: false,
          erro: 'Configuração do banco de dados não encontrada'
        })
      };
    }

    const body = JSON.parse(event.body);
    const { idfinanceiro, telefone, usuario, valor, dataVencimento } = body;

    let telefoneFinal, usuarioFinal, valorFinal, dataVencimentoFinal;

    // Se recebeu idfinanceiro, busca os dados no banco
    if (idfinanceiro) {
      console.log('🔍 Buscando dados do financeiro:', idfinanceiro);
      
      const { data: financeiro, error: financeiroError } = await supabase
        .from('financeiro')
        .select(`
          *,
          usuarios (
            nome,
            telefone
          )
        `)
        .eq('idfinanceiro', idfinanceiro)
        .single();

      if (financeiroError) {
        console.error('❌ Erro ao buscar financeiro:', financeiroError);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            sucesso: false,
            erro: 'Lançamento financeiro não encontrado'
          })
        };
      }

      if (!financeiro) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            sucesso: false,
            erro: 'Lançamento financeiro não encontrado'
          })
        };
      }

      // Extrai os dados do financeiro
      telefoneFinal = financeiro.usuarios?.telefone;
      usuarioFinal = financeiro.usuarios?.nome || financeiro.usuario || 'Cliente';
      valorFinal = `R$ ${parseFloat(financeiro.valor || 0).toFixed(2)}`;
      dataVencimentoFinal = new Date(financeiro.data_vencimento).toLocaleDateString('pt-BR');

      console.log('✅ Dados do financeiro encontrados:', {
        usuario: usuarioFinal,
        valor: valorFinal,
        dataVencimento: dataVencimentoFinal,
        telefone: telefoneFinal ? 'Presente' : 'Ausente'
      });
    } else {
      // Se não recebeu idfinanceiro, usa os dados diretos (compatibilidade com código antigo)
      telefoneFinal = telefone;
      usuarioFinal = usuario;
      valorFinal = valor;
      dataVencimentoFinal = dataVencimento;
    }

    // Validação dos dados
    if (!telefoneFinal || !usuarioFinal || !valorFinal || !dataVencimentoFinal) {
      console.log('❌ Dados incompletos:', { 
        telefone: !!telefoneFinal, 
        usuario: !!usuarioFinal, 
        valor: !!valorFinal, 
        dataVencimento: !!dataVencimentoFinal 
      });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          sucesso: false,
          erro: 'Dados incompletos. Verifique se o lançamento tem telefone cadastrado.'
        })
      };
    }

    // Garante que o número está no formato correto (apenas números)
    let numeroFormatado = telefoneFinal.replace(/\D/g, '');
    
    // Adiciona prefixo 55 se não tiver (código do Brasil)
    if (!numeroFormatado.startsWith('55')) {
      numeroFormatado = '55' + numeroFormatado;
    }
    
    console.log('📱 Número formatado:', numeroFormatado);

    console.log('📤 Enviando mensagem para:', numeroFormatado);
    console.log('📝 Dados da mensagem:', { usuario: usuarioFinal, valor: valorFinal, dataVencimento: dataVencimentoFinal });

    // Valida configurações do WhatsApp
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('❌ Configurações do WhatsApp não encontradas');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          sucesso: false,
          erro: 'Configurações do WhatsApp não encontradas. Verifique as variáveis de ambiente WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID.'
        })
      };
    }

    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: numeroFormatado,
        type: 'template',
        template: {
          name: 'cobrana',
          language: {
            code: 'pt_BR'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: usuarioFinal
                },
                {
                  type: 'text',
                  text: valorFinal
                },
                {
                  type: 'text',
                  text: dataVencimentoFinal
                }
              ]
            }
          ]
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
      status: error.response?.status
    });
    
    // Tratamento específico para erros comuns
    let mensagemErro = 'Erro ao enviar mensagem via WhatsApp';
    
    if (error.response?.data?.error) {
      const errorData = error.response.data.error;
      
      if (errorData.code === 100 && errorData.error_subcode === 33) {
        mensagemErro = 'ID do número de telefone do WhatsApp inválido ou sem permissões. Verifique a variável WHATSAPP_PHONE_NUMBER_ID.';
      } else if (errorData.code === 190) {
        mensagemErro = 'Token de acesso do WhatsApp inválido ou expirado. Verifique a variável WHATSAPP_TOKEN.';
      } else if (errorData.message) {
        mensagemErro = errorData.message;
      }
    } else if (error.message) {
      mensagemErro = error.message;
    }
    
    return {
      statusCode: error.response?.status || 500,
      headers: corsHeaders,
      body: JSON.stringify({
        sucesso: false,
        erro: mensagemErro,
        detalhes: error.response?.data || error.message
      })
    };
  }
};