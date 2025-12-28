const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não configuradas!');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Importa a função de processamento da função principal
// Como não podemos importar diretamente, vamos duplicar a lógica ou criar um módulo compartilhado
// Por enquanto, vamos criar uma versão simplificada que chama a mesma lógica

async function processarLancamentosMensais(forcarProcessamento = false) {
  console.log('🔄 Iniciando processamento de lançamentos mensais (manual)...');

  try {
    if (!supabase) {
      throw new Error('Configuração do banco de dados não encontrada');
    }

    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // Busca as configurações
    const { data: config, error: configError } = await supabase
      .from('configuracoes')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configError && configError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar configurações: ${configError.message}`);
    }

    if (!config) {
      throw new Error('Configurações não encontradas. Configure os valores primeiro.');
    }

    const valorAteVencimento = parseFloat(config.valor_ate_vencimento) || 0;
    const valorAposVencimento = parseFloat(config.valor_apos_vencimento) || 0;

    if (valorAteVencimento === 0 && valorAposVencimento === 0) {
      throw new Error('Valores de pagamento não configurados.');
    }

    console.log('📊 Configurações encontradas:', {
      valor_ate_vencimento: valorAteVencimento,
      valor_apos_vencimento: valorAposVencimento
    });

    // Calcula a data de vencimento (dia 10 do mês atual)
    const dataVencimento = new Date(anoAtual, mesAtual - 1, 10);
    const dataVencimentoISO = dataVencimento.toISOString().split('T')[0];

    // Busca todos os alunos ativos
    const { data: alunos, error: alunosError } = await supabase
      .from('usuarios')
      .select('idusuario, nome, usuario')
      .eq('idperfilusuario', 2); // Assumindo que 2 é o ID do perfil de aluno

    if (alunosError) {
      throw new Error(`Erro ao buscar alunos: ${alunosError.message}`);
    }

    if (!alunos || alunos.length === 0) {
      console.log('ℹ️ Nenhum aluno encontrado.');
      return {
        message: 'Nenhum aluno encontrado para processar',
        total_processados: 0
      };
    }

    console.log(`📋 ${alunos.length} alunos encontrados.`);

    const resultados = [];
    let totalCriados = 0;
    let totalAtualizados = 0;
    let totalErros = 0;

    for (const aluno of alunos) {
      try {
        // Verifica se já existe um lançamento para este mês/ano e aluno
        // Calcula o próximo mês corretamente (tratando dezembro -> janeiro do ano seguinte)
        const proximoMes = mesAtual === 12 ? 1 : mesAtual + 1;
        const anoProximoMes = mesAtual === 12 ? anoAtual + 1 : anoAtual;
        
        const { data: lancamentoExistente, error: buscaError } = await supabase
          .from('financeiro')
          .select('idfinanceiro, valor, data_vencimento, data_pagamento')
          .eq('idusuario', aluno.idusuario)
          .gte('data_vencimento', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`)
          .lt('data_vencimento', `${anoProximoMes}-${String(proximoMes).padStart(2, '0')}-01`)
          .maybeSingle();

        if (buscaError && buscaError.code !== 'PGRST116') {
          throw new Error(`Erro ao buscar lançamento: ${buscaError.message}`);
        }

        // Determina o valor baseado na data de vencimento
        const hojeParaComparacao = new Date(anoAtual, mesAtual - 1, diaAtual);
        hojeParaComparacao.setHours(0, 0, 0, 0);
        
        let valor;
        if (hojeParaComparacao > dataVencimento) {
          // Já passou do vencimento, usa valor após vencimento
          valor = valorAposVencimento;
          console.log(`💰 Aluno ${aluno.nome}: Usando valor após vencimento (R$ ${valor.toFixed(2)})`);
        } else {
          // Ainda não passou do vencimento, usa valor até vencimento
          valor = valorAteVencimento;
          console.log(`💰 Aluno ${aluno.nome}: Usando valor até vencimento (R$ ${valor.toFixed(2)})`);
        }

        if (lancamentoExistente) {
          // Atualiza o lançamento existente se o valor mudou ou se passou do vencimento
          const valorMudou = parseFloat(lancamentoExistente.valor) !== valor;
          const passouVencimento = hojeParaComparacao > dataVencimento && 
                                   parseFloat(lancamentoExistente.valor) === valorAteVencimento;

          if (valorMudou || passouVencimento) {
            const { error: updateError } = await supabase
              .from('financeiro')
              .update({
                valor: valor,
                data_vencimento: dataVencimentoISO
              })
              .eq('idfinanceiro', lancamentoExistente.idfinanceiro);

            if (updateError) {
              throw new Error(`Erro ao atualizar: ${updateError.message}`);
            }

            totalAtualizados++;
            resultados.push({
              aluno: aluno.nome,
              acao: 'Atualizado',
              valor: valor,
              motivo: passouVencimento ? 'Vencimento passou' : 'Valor alterado'
            });
            console.log(`✅ Lançamento atualizado para ${aluno.nome}`);
          } else {
            console.log(`⏭️ Lançamento de ${aluno.nome} já está correto. Pulando...`);
            resultados.push({
              aluno: aluno.nome,
              acao: 'Ignorado',
              motivo: 'Já está correto'
            });
          }
        } else {
          // Cria novo lançamento
          const { error: insertError } = await supabase
            .from('financeiro')
            .insert([{
              idusuario: aluno.idusuario,
              valor: valor,
              data_vencimento: dataVencimentoISO,
              data_pagamento: null
            }]);

          if (insertError) {
            throw new Error(`Erro ao criar: ${insertError.message}`);
          }

          totalCriados++;
          resultados.push({
            aluno: aluno.nome,
            acao: 'Criado',
            valor: valor
          });
          console.log(`✅ Novo lançamento criado para ${aluno.nome}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar aluno ${aluno.nome}:`, error);
        console.error(`❌ Stack trace:`, error.stack);
        totalErros++;
        resultados.push({
          aluno: aluno.nome || aluno.usuario || `ID: ${aluno.idusuario}`,
          acao: 'Erro',
          erro: error.message || 'Erro desconhecido',
          detalhes: error.code || error.details || undefined,
          idusuario: aluno.idusuario
        });
      }
    }

    const response = {
      message: 'Processamento de lançamentos mensais concluído',
      data_processamento: hoje.toISOString().split('T')[0],
      mes_processado: `${mesAtual}/${anoAtual}`,
      total_alunos: alunos.length,
      total_criados: totalCriados,
      total_atualizados: totalAtualizados,
      total_erros: totalErros,
      total_ignorados: alunos.length - totalCriados - totalAtualizados - totalErros,
      resultados
    };

    console.log('📊 Resumo do processamento:', response);
    return response;

  } catch (error) {
    console.error('❌ Erro geral no processamento:', error);
    return {
      error: 'Erro ao processar lançamentos mensais',
      detalhe: error.message
    };
  }
}

exports.handler = async function(event, context) {
  try {
    // Verifica variáveis de ambiente no início
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Variáveis de ambiente não configuradas!');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Configuração do servidor incompleta',
          detalhe: 'As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não estão configuradas. Configure-as no painel do Netlify ou no arquivo .env local.'
        })
      };
    }

    // Tratamento para requisições OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // Permite GET e POST para chamadas manuais
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    // Sempre força o processamento (esta é a versão manual)
    console.log('🌐 Executando processamento manual de lançamentos');
    const resultado = await processarLancamentosMensais(true);
    console.log('✅ Processamento manual concluído:', resultado);

    return {
      statusCode: resultado.error ? 500 : 200,
      headers: corsHeaders,
      body: JSON.stringify(resultado)
    };
  } catch (error) {
    console.error('❌ Erro não tratado no handler:', error);
    console.error('❌ Stack trace:', error.stack);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Erro ao processar lançamentos mensais',
        detalhe: error.message || 'Erro desconhecido',
        tipo: error.name || 'Error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

