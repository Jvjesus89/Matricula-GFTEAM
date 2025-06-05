const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuração do Supabase
const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Configuração do WhatsApp Business API
const WHATSAPP_TOKEN = 'EAATjiH8My38BO7M7rAOZCw4ISLbA6ZA2VZBjEyhOCfHcLir8oYm8BdbaZCmdn1Eiq1Gtc9SBqGbbgnNoMW7YKy2gKZB00Lrovnbe0J5TpFygKJmoZC444Hv4nObFNM3C6fB8xdYhsNV8KyaLEZBkJICxbKzRQQ5xRRcB5O1ZAWBAuKfg5OqHvLWzpyZB1Gvqqo94WgZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '624266544111694';

async function enviarMensagemWhatsApp(telefone, dados) {
    console.log('📱 Iniciando envio de mensagem para:', telefone);
    console.log('📝 Dados da mensagem:', dados);

    try {
      const response = await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          to: telefone,
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
                    text: dados.usuario
                  },
                  {
                    type: 'text',
                    text: dados.valor
                  },
                  {
                    type: 'text',
                    text: dados.dataVencimento
                  }
                ]
              }
            ]
          }
        }
      });
  
      console.log('✅ Mensagem enviada com sucesso para:', telefone);
      console.log('📨 Resposta do WhatsApp:', response.data);
      return { sucesso: true, response: response.data };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem para:', telefone);
      console.error('🔍 Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return { sucesso: false, erro: error.response?.data || error.message };
    }
}

async function verificarVencimentos() {
    console.log('🕒 Iniciando verificação de vencimentos...');
    
    try {
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + 5);
  
      console.log('📅 Período de verificação:', {
        hoje: hoje.toISOString(),
        dataLimite: dataLimite.toISOString()
      });
  
      // Busca pagamentos que vencem em 5 dias e ainda não foram pagos
      console.log('🔍 Buscando pagamentos no Supabase...');
      const { data: pagamentos, error } = await supabase
        .from('financeiro')
        .select(`
          *,
          usuarios (
            nome,
            telefone
          )
        `)
        .is('data_pagamento', null)
        .lte('data_vencimento', dataLimite.toISOString())
        .gte('data_vencimento', hoje.toISOString());
  
      if (error) {
        console.error('❌ Erro ao buscar pagamentos:', error);
        return { error: 'Erro ao buscar pagamentos', detalhe: error.message };
      }
  
      if (!pagamentos || pagamentos.length === 0) {
        console.log('ℹ️ Nenhum pagamento encontrado para notificar.');
        return { message: 'Nenhum pagamento encontrado para notificar.' };
      }
  
      console.log(`🔎 ${pagamentos.length} pagamentos encontrados.`);
  
      const resultados = [];
  
      for (const pagamento of pagamentos) {
        const aluno = pagamento.usuarios?.nome || 'Desconhecido';
        const telefoneUsuario = pagamento.usuarios?.telefone;
  
        if (!telefoneUsuario) {
          console.log(`⚠️ Usuário ${aluno} sem telefone cadastrado.`);
          resultados.push({
            aluno,
            telefone: null,
            status: 'Telefone não cadastrado'
          });
          continue;
        }
  
        const telefone = '55' + telefoneUsuario.replace(/\D/g, '');
        const dataVencimento = new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR');
        const valor = `R$ ${parseFloat(pagamento.valor).toFixed(2)}`;
  
        console.log(`📨 Processando pagamento para ${aluno}:`, {
          telefone,
          valor,
          dataVencimento
        });
  
        const envio = await enviarMensagemWhatsApp(telefone, {
          usuario: aluno,
          valor: valor,
          dataVencimento: dataVencimento
        });
  
        resultados.push({
          aluno,
          telefone,
          valor: pagamento.valor,
          vencimento: dataVencimento,
          status: envio.sucesso ? 'Enviado' : 'Falhou',
          detalhe: envio.sucesso ? envio.response : envio.erro
        });
      }
  
      const totalEnviados = resultados.filter(r => r.status === 'Enviado').length;
      const totalFalhas = resultados.filter(r => r.status === 'Falhou').length;
  
      const response = {
        message: 'Verificação de vencimentos concluída',
        total_pagamentos: pagamentos.length,
        total_enviados: totalEnviados,
        total_falhas: totalFalhas,
        resultados
      };

      console.log('📊 Resumo da execução:', response);
      
      return response;
  
    } catch (error) {
      console.error('❌ Erro geral na função:', error);
      console.error('🔍 Stack trace:', error.stack);
      return { 
        error: 'Erro ao processar verificação de vencimentos', 
        detalhe: error.message,
        stack: error.stack
      };
    }
}
  
exports.handler = async function(event, context) {
    console.log('🚀 Função iniciada');
    console.log('📦 Event:', JSON.stringify(event, null, 2));
    
    // Se for uma chamada agendada (sem event.httpMethod)
    if (!event.httpMethod) {
      console.log('⏰ Executando como função agendada');
      const resultado = await verificarVencimentos();
      console.log('✅ Função agendada concluída:', resultado);
      return;
    }

    // Tratamento para requisições OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
      console.log('🔄 Requisição OPTIONS recebida');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // Verifica se o método é GET
    if (event.httpMethod !== 'GET') {
      console.log('❌ Método não permitido:', event.httpMethod);
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    // Se for uma chamada HTTP normal
    console.log('🌐 Executando como função HTTP');
    const resultado = await verificarVencimentos();
    console.log('✅ Função HTTP concluída:', resultado);
    
    return {
      statusCode: resultado.error ? 500 : 200,
      headers: corsHeaders,
      body: JSON.stringify(resultado)
    };
};