import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (request, context) => {
  if (request.method && request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
  try {
    let data = [];
    let error = null;
    const { data: responsaveisData, error: responsaveisError } = await supabase
      .from('responsaveis')
      .select(`
        idresponsavel, 
        nome, 
        telefone, 
        email,
        usuario,
        idperfilusuario,
        usuario_perfil (
          idperfilusuario,
          perfil,
          isadministrador
        )
      `)
      .order('nome', { ascending: true });
    if (!responsaveisError && responsaveisData) {
      data = responsaveisData.map((r) => ({
        idresponsavel: r.idresponsavel,
        nome: r.nome,
        telefone: r.telefone || null,
        email: r.email || null,
        usuario: r.usuario || null,
        idperfilusuario: r.idperfilusuario || null,
        usuario_perfil: r.usuario_perfil || null,
      }));
    } else {
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('responsavel, telefone')
        .not('responsavel', 'is', null)
        .neq('responsavel', '');
      if (usuariosError) {
        error = usuariosError;
      } else {
        const responsaveisUnicos = {};
        usuariosData.forEach((item) => {
          if (item.responsavel && !responsaveisUnicos[item.responsavel]) {
            responsaveisUnicos[item.responsavel] = {
              nome: item.responsavel,
              telefone: item.telefone || null,
              email: null,
            };
          }
        });
        data = Object.values(responsaveisUnicos);
      }
    }
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
    const responsaveis = data;
    return new Response(JSON.stringify(responsaveis), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro no servidor: ' + err.message }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};
