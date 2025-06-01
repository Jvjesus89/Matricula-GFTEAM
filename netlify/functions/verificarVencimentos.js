const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do WhatsApp Business API
const WHATSAPP_TOKEN = 'EAATjiH8My38BO0rQO8riHGZCm9SUbaIgyGL18DIfEKP9DdGoxsVsKSDXbErqVH2oSQE1d5jl5qxT5RnDwgCu5XPSteQuxeoBBZAhlxCaQebt0L3mCO6MZCeFPnsTpjaZBhOnjOZCV7fktIDVDy0kYZCMnpe1XQbLotsm2Lh2AjXdK8CdRPv4na1tijPo9smFoyYQZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '1377180803601917';

async function enviarMensagemWhatsApp(telefone, mensagem) {
  try {
    console.log('Tentando enviar mensagem para:', telefone);
    
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: telefone,
        type: 'text',
        text: { body: mensagem }
      }
    });

    console.log('Mensagem enviada com sucesso:', response.data);
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    return false;
  }
}

exports.handler = async function(event, context) {
  try {
    // Busca pagamentos que vencem em 5 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 5); // 5 dias à frente
    
    const { data: pagamentos, error } = await supabase
      .from('financeiro')
      .select(`
        *,
        usuarios (
          nome,
          telefone
        )
      `)
      .is('data_pagamento', null) // Apenas pagamentos não realizados
      .lte('data_vencimento', dataLimite.toISOString()) // Vence em até 5 dias
      .gte('data_vencimento', new Date().toISOString()); // Ainda não venceu

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      throw error;
    }

    console.log('Pagamentos encontrados:', pagamentos?.length || 0);
    const resultados = [];

    // Processa cada pagamento
    for (const pagamento of pagamentos) {
      if (!pagamento.usuarios?.telefone) {
        console.log('Usuário sem telefone:', pagamento.usuarios?.nome);
        continue;
      }

      // Formata o telefone (remove caracteres especiais e adiciona código do país)
      const telefone = '55' + pagamento.usuarios.telefone.replace(/\D/g, '');
      console.log('Telefone formatado:', telefone);
      
      // Formata a data de vencimento
      const dataVencimento = new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR');
      
      // Monta a mensagem
      const mensagem = `Olá ${pagamento.usuarios.nome}! 👋\n\n` +
        `Lembramos que você tem um pagamento no valor de R$ ${pagamento.valor.toFixed(2)} ` +
        `com vencimento em ${dataVencimento}.\n\n` +
        `Para sua comodidade, você pode realizar o pagamento diretamente na academia.\n\n` +
        `GFTEAM - Sua parceria no Jiu-Jitsu! 🥋`;

      console.log('Tentando enviar mensagem para:', pagamento.usuarios.nome);
      // Envia a mensagem
      const enviado = await enviarMensagemWhatsApp(telefone, mensagem);
      
      resultados.push({
        aluno: pagamento.usuarios.nome,
        telefone: telefone,
        valor: pagamento.valor,
        vencimento: dataVencimento,
        mensagem_enviada: enviado
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Verificação de vencimentos concluída',
        resultados: resultados
      })
    };

  } catch (error) {
    console.error('Erro na verificação:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao processar verificação de vencimentos' })
    };
  }
}; 