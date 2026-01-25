import { createClient } from '@supabase/supabase-js';

// Inicialização do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Headers padrão para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Função auxiliar de processamento (Lógica de Negócio)
async function processarLancamentosMensais(forcarProcessamento = false) {
  console.log('🔄 Iniciando processamento de lançamentos mensais...');

  try {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // Verificação de segurança para não duplicar mensalidades
    if (!forcarProcessamento && diaAtual > 5) {
      const primeiroDiaMes = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
      const ultimoDiaMes = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-31`;
      
      const { data: lancamentosExistentes } = await supabase
        .from('financeiro')
        .select('idusuario')
        .gte('data_vencimento', primeiroDiaMes)
        .lte('data_vencimento', ultimoDiaMes)
        .limit(1);

      if (lancamentosExistentes && lancamentosExistentes.length > 0) {
        return {
          message: 'Lançamentos já existem para este mês',
          ignorado: true
        };
      }
    }

    // Busca configurações de valores
    const { data: config } = await supabase.from('configuracoes').select('*').maybeSingle();
    if (!config) throw new Error('Configurações financeiras não encontradas.');

    const valorAteVencimento = parseFloat(config.valor_ate_vencimento);
    const valorAposVencimento = parseFloat(config.valor_apos_vencimento);

    // Data de vencimento padrão: Dia 10 do mês atual
    const dataVencimentoISO = new Date(anoAtual, mesAtual - 1, 10).toISOString().split('T')[0];

    // Busca alunos ativos (perfil 2)
    const { data: alunos, error: alunosError } = await supabase
      .from('usuarios')
      .select('idusuario, nome')
      .eq('idperfilusuario', 2);

    if (alunosError) throw alunosError;

    let criados = 0;
    let atualizados = 0;

    for (const aluno of alunos) {
      // Verifica se o aluno já tem boleto este mês
      const { data: existe } = await supabase
        .from('financeiro')
        .select('idfinanceiro, valor')
        .eq('idusuario', aluno.idusuario)
        .gte('data_vencimento', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`)
        .maybeSingle();

      const valorFinal = (hoje.getDate() > 10) ? valorAposVencimento : valorAteVencimento;

      if (existe) {
        if (parseFloat(existe.valor) !== valorFinal) {
          await supabase.from('financeiro').update({ valor: valorFinal }).eq('idfinanceiro', existe.idfinanceiro);
          atualizados++;
        }
      } else {
        await supabase.from('financeiro').insert([{
          idusuario: aluno.idusuario,
          valor: valorFinal,
          data_vencimento: dataVencimentoISO
        }]);
        criados++;
      }
    }

    return { total_alunos: alunos.length, criados, atualizados };

  } catch (error) {
    throw error;
  }
}

// Handler Principal (Padrão V2 ESM)
export default async (request, context) => {
  
  // 1. Tratamento de CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 2. Identifica a origem da chamada
    // Se não houver um User-Agent comum, provavelmente é o Cron do Supabase
    const isCron = request.headers.get('user-agent')?.includes('PostgREST') || !request.headers.get('user-agent');
    
    console.log(isCron ? '⏰ Gatilho: Agendamento (Cron)' : '🌐 Gatilho: Chamada Manual (HTTP)');

    // 3. Executa a lógica
    // Se for manual (GET/POST), forçamos o processamento. Se for Cron, respeita a trava de segurança.
    const forcar = request.method === 'POST' || request.method === 'GET';
    const resultado = await processarLancamentosMensais(forcar);

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Erro no processamento:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
};