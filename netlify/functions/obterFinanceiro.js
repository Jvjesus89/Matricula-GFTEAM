import { createClient } from '@supabase/supabase-js';

// Inicialização do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// No padrão v2, exportamos uma função padrão (default)
export default async (request, context) => {
  
  // 1. Verificação de Método (Headers de CORS incluídos para evitar bloqueios)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers
    });
  }

  try {
    // 2. Leitura de Parâmetros da URL (Novo padrão ESM)
    const url = new URL(request.url);
    const idusuario = url.searchParams.get('idusuario');

    // 3. Construção da Query
    let query = supabase
      .from('financeiro')
      .select(`
        idfinanceiro,
        valor,
        data_vencimento,
        data_pagamento,
        dtcadastro,
        idusuario,
        usuarios (
          nome,
          usuario,
          telefone
        )
      `)
      .order('data_vencimento', { ascending: true });

    if (idusuario) {
      query = query.eq('idusuario', idusuario);
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers
      });
    }

    // 4. Formatação dos dados
    const formattedData = data.map(item => ({
      ...item,
      nome: item.usuarios?.nome || 'Usuário não encontrado',
      usuario: item.usuarios?.usuario || 'N/A',
      telefone: item.usuarios?.telefone || null
    }));

    // 5. Retorno usando o objeto Response (Padrão v2)
    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro no servidor: ' + err.message }), {
      status: 500,
      headers
    });
  }
};