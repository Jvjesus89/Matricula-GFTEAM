const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do WhatsApp Business API
const WHATSAPP_TOKEN = 'EAATjiH8My38BO7M7rAOZCw4ISLbA6ZA2VZBjEyhOCfHcLir8oYm8BdbaZCmdn1Eiq1Gtc9SBqGbbgnNoMW7YKy2gKZB00Lrovnbe0J5TpFygKJmoZC444Hv4nObFNM3C6fB8xdYhsNV8KyaLEZBkJICxbKzRQQ5xRRcB5O1ZAWBAuKfg5OqHvLWzpyZB1Gvqqo94WgZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '624266544111694';

async function enviarMensagemWhatsApp(telefone, dados) {
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
      return { sucesso: true, response: response.data };
    } catch (error) {
      const erroDetalhe = error.response?.data || error.message;
      console.error('❌ Erro ao enviar mensagem para:', telefone, erroDetalhe);
      return { sucesso: false, erro: erroDetalhe };
    }
}
  
exports.handler = async function(event, context) {
    try {
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + 5);
  
      // Busca pagamentos que vencem em 5 dias e ainda não foram pagos
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
        console.error('Erro ao buscar pagamentos:', error);
        return;
      }
  
      if (!pagamentos || pagamentos.length === 0) {
        console.log('Nenhum pagamento encontrado para notificar.');
        return;
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
  
      console.log('📊 Resumo da execução:', {
        total_pagamentos: pagamentos.length,
        total_enviados: totalEnviados,
        total_falhas: totalFalhas,
        resultados
      });
  
    } catch (error) {
      console.error('❌ Erro geral na função:', error);
    }
};