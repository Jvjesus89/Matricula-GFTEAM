const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwoicbguwvvyhgsjbaoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2ljYmd1d3Z2eWhnc2piYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTkwNzEsImV4cCI6MjA2MTUzNTA3MX0.nUGfOLsdVbHpYGqs0uX3I8IVI6ZLxZoDatPrkWwpL9A'

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  let usuario;
  try {
    usuario = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'JSON inválido' }),
    };
  }

  const { usuario: nomeUsuario, nome, idade, telefone, senha, perfil } = usuario;

  if (!nomeUsuario || !nome || !idade || !telefone || !senha || !perfil) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Todos os campos são obrigatórios.' }),
    };
  }

  try {
    // Verifica se já existe um usuário com o mesmo nome de usuário
    const { data: usuariosExistentes, error: errorBusca } = await supabase
      .from('usuarios')
      .select('usuario')
      .eq('usuario', nomeUsuario)
      .single();

    if (errorBusca && errorBusca.code !== 'PGRST116') {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao verificar usuário existente.' }),
      };
    }

    if (usuariosExistentes) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Este nome de usuário já está sendo usado.' }),
      };
    }

    // Cadastra o novo usuário
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          usuario: nomeUsuario,
          nome,
          idade,
          telefone,
          senha,
          idperfilusuario: perfil
        }
      ])
      .select();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Usuário cadastrado com sucesso!',
        usuario: data[0]
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro no servidor: ' + err.message }),
    };
  }
};