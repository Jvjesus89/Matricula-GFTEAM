const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Configuração do WhatsApp Business API
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'EAATjiH8My38BO7M7rAOZCw4ISLbA6ZA2VZBjEyhOCfHcLir8oYm8BdbaZCmdn1Eiq1Gtc9SBqGbbgnNoMW7YKy2gKZB00Lrovnbe0J5TpFygKJmoZC444Hv4nObFNM3C6fB8xdYhsNV8KyaLEZBkJICxbKzRQQ5xRRcB5O1ZAWBAuKfg5OqHvLWzpyZB1Gvqqo94WgZDZD';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '624266544111694';

async function enviarMensagemWhatsApp(telefone, dados, tipoAviso = 'padrao') {
    console.log('📱 Iniciando envio de mensagem para:', telefone);
    console.log('📝 Dados da mensagem:', dados);
    console.log('🏷️ Tipo de aviso:', tipoAviso);

    try {
      // Monta a mensagem baseada no tipo de aviso
      let mensagemAdicional = '';
      if (tipoAviso === '10_dias_antes') {
        mensagemAdicional = ' (Vence em 10 dias)';
      } else if (tipoAviso === 'vencimento') {
        mensagemAdicional = ' (Vence hoje!)';
      } else if (tipoAviso.startsWith('atraso_')) {
        const diasAtraso = tipoAviso.replace('atraso_', '').replace('_dias', '');
        mensagemAdicional = ` (Atrasado há ${diasAtraso} dias)`;
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
                    text: dados.usuario + mensagemAdicional
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
      hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas datas
  
      console.log('📅 Data de verificação:', hoje.toISOString());
  
      // Busca TODOS os pagamentos não pagos (sem data_pagamento)
      console.log('🔍 Buscando pagamentos não pagos no Supabase...');
      const { data: pagamentos, error } = await supabase
        .from('financeiro')
        .select(`
          *,
          usuarios (
            nome,
            telefone
          )
        `)
        .is('data_pagamento', null);
  
      if (error) {
        console.error('❌ Erro ao buscar pagamentos:', error);
        return { error: 'Erro ao buscar pagamentos', detalhe: error.message };
      }
  
      console.log('📊 Total de pagamentos não pagos:', pagamentos?.length || 0);

      if (!pagamentos || pagamentos.length === 0) {
        console.log('ℹ️ Nenhum pagamento encontrado para notificar.');
        return { message: 'Nenhum pagamento encontrado para notificar.' };
      }
  
      const resultados = [];
      let totalEnviados = 0;
      let totalFalhas = 0;
      let totalIgnorados = 0;
  
      for (const pagamento of pagamentos) {
        const aluno = pagamento.usuarios?.nome || 'Desconhecido';
        const telefoneUsuario = pagamento.usuarios?.telefone;
  
        if (!telefoneUsuario) {
          console.log(`⚠️ Usuário ${aluno} sem telefone cadastrado.`);
          resultados.push({
            aluno,
            telefone: null,
            status: 'Telefone não cadastrado',
            tipo: 'sem_telefone'
          });
          totalIgnorados++;
          continue;
        }
  
        const dataVencimento = new Date(pagamento.data_vencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        
        // Calcula a diferença em dias
        const diferencaMs = dataVencimento - hoje;
        const diasDiferenca = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
        
        let tipoAviso = null;
        let deveEnviar = false;
        
        // CENÁRIO 1: 10 dias ANTES do vencimento
        if (diasDiferenca === 10) {
          tipoAviso = '10_dias_antes';
          // Verifica se já enviou este tipo de aviso hoje ou se nunca enviou
          const ultimoAviso = pagamento.ultimo_aviso_enviado ? new Date(pagamento.ultimo_aviso_enviado) : null;
          const tipoUltimoAviso = pagamento.tipo_ultimo_aviso;
          
          if (!ultimoAviso || ultimoAviso.getTime() !== hoje.getTime() || tipoUltimoAviso !== tipoAviso) {
            deveEnviar = true;
          }
        }
        // CENÁRIO 2: NO DIA do vencimento
        else if (diasDiferenca === 0) {
          tipoAviso = 'vencimento';
          const ultimoAviso = pagamento.ultimo_aviso_enviado ? new Date(pagamento.ultimo_aviso_enviado) : null;
          const tipoUltimoAviso = pagamento.tipo_ultimo_aviso;
          
          if (!ultimoAviso || ultimoAviso.getTime() !== hoje.getTime() || tipoUltimoAviso !== tipoAviso) {
            deveEnviar = true;
          }
        }
        // CENÁRIO 3: ATRASADO - a cada 10 dias de atraso
        else if (diasDiferenca < 0) {
          const diasAtraso = Math.abs(diasDiferenca);
          
          // Verifica se está em um múltiplo de 10 dias de atraso
          if (diasAtraso % 10 === 0) {
            tipoAviso = `atraso_${diasAtraso}_dias`;
            const ultimoAviso = pagamento.ultimo_aviso_enviado ? new Date(pagamento.ultimo_aviso_enviado) : null;
            const tipoUltimoAviso = pagamento.tipo_ultimo_aviso;
            
            // Só envia se não enviou hoje ou se o tipo de aviso mudou
            if (!ultimoAviso || ultimoAviso.getTime() !== hoje.getTime() || tipoUltimoAviso !== tipoAviso) {
              deveEnviar = true;
            }
          }
        }
        
        // Se não deve enviar, pula para o próximo
        if (!deveEnviar || !tipoAviso) {
          if (tipoAviso) {
            console.log(`⏭️ Aviso ${tipoAviso} já enviado hoje para ${aluno}. Pulando...`);
            totalIgnorados++;
          }
          continue;
        }
  
        const telefone = '55' + telefoneUsuario.replace(/\D/g, '');
        const dataVencimentoFormatada = dataVencimento.toLocaleDateString('pt-BR');
        const valor = `R$ ${parseFloat(pagamento.valor).toFixed(2)}`;
  
        console.log(`📨 Processando aviso ${tipoAviso} para ${aluno}:`, {
          telefone,
          valor,
          dataVencimento: dataVencimentoFormatada,
          diasDiferenca
        });
  
        const envio = await enviarMensagemWhatsApp(telefone, {
          usuario: aluno,
          valor: valor,
          dataVencimento: dataVencimentoFormatada
        }, tipoAviso);
  
        if (envio.sucesso) {
          // Atualiza o registro com a data e tipo do último aviso enviado
          const { error: updateError } = await supabase
            .from('financeiro')
            .update({
              ultimo_aviso_enviado: hoje.toISOString().split('T')[0], // Apenas a data (YYYY-MM-DD)
              tipo_ultimo_aviso: tipoAviso
            })
            .eq('idfinanceiro', pagamento.idfinanceiro);
  
          if (updateError) {
            console.error(`⚠️ Erro ao atualizar registro do pagamento ${pagamento.idfinanceiro}:`, updateError);
          } else {
            console.log(`✅ Registro atualizado com sucesso para ${aluno}`);
          }
          
          totalEnviados++;
        } else {
          totalFalhas++;
        }
  
        resultados.push({
          aluno,
          telefone,
          valor: pagamento.valor,
          vencimento: dataVencimentoFormatada,
          diasDiferenca,
          tipoAviso,
          status: envio.sucesso ? 'Enviado' : 'Falhou',
          detalhe: envio.sucesso ? envio.response : envio.erro
        });
      }
  
      const response = {
        message: 'Verificação de vencimentos concluída',
        total_pagamentos: pagamentos.length,
        total_enviados,
        total_falhas,
        total_ignorados: totalIgnorados,
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