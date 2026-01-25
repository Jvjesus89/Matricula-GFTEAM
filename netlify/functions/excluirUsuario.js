import { createClient } from '@supabase/supabase-js';

// Inicialização do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Headers padrão para CORS (Essencial para DELETE)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export default async (request, context) => {
  
  // 1. Tratamento para requisições OPTIONS (Preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Verifica se é uma requisição DELETE
  if (request.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // 3. Obtém o ID do usuário da URL (Padrão V2)
    const url = new URL(request.url);
    const idusuario = url.searchParams.get('idusuario');

    if (!idusuario) {
      return new Response(JSON.stringify({ error: 'ID do usuário não fornecido' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 4. Primeiro verifica se o usuário existe
    const { data: checkUser, error: checkError } = await supabase
      .from('usuarios')
      .select('idusuario')
      .eq('idusuario', idusuario)
      .single();

    if (checkError || !checkUser) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // 5. Exclui o usuário
    const { error: deleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('idusuario', idusuario);

    if (deleteError) throw deleteError;

    // 6. Retorno de Sucesso
    return new Response(JSON.stringify({ message: 'Usuário excluído com sucesso' }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao excluir usuário',
        details: error.message 
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
};