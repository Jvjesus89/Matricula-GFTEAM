const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não configuradas!');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  let usuario;
  try {
    usuario = JSON.parse(event.body);
  } catch (parseError) {
    console.error('Erro ao parsear body:', parseError, 'Body:', event.body);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'JSON inválido' }),
    };
  }

  const { usuario: nomeUsuario, senha } = usuario;

  if (!nomeUsuario || !senha) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Usuário e senha são obrigatórios.' }),
    };
  }

  if (!supabase) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Configuração do banco de dados não encontrada. Verifique as variáveis de ambiente.' }),
    };
  }

  try {
    // 1. Primeiro tenta buscar em usuarios (alunos)
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select(`
        *,
        usuario_perfil (
          perfil,
          isadministrador
        )
      `)
      .eq('usuario', nomeUsuario)
      .eq('senha', senha)
      .maybeSingle();

    if (usuarioError) {
      console.error('Erro ao buscar em usuarios:', usuarioError);
    }

    // Se encontrou em usuarios, retorna como aluno
    if (usuarioData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Login realizado com sucesso!',
          usuario: usuarioData,
          tipo: 'aluno'
        }),
      };
    }

    // 2. Se não encontrou em usuarios, tenta buscar em responsaveis
    // Primeiro tenta com relacionamento usuario_perfil
    let responsavelData = null
    let responsavelError = null
    
    const { data: responsavelDataWithRel, error: responsavelErrorWithRel } = await supabase
      .from('responsaveis')
      .select(`
        *,
        usuario_perfil (
          perfil,
          isadministrador
        )
      `)
      .eq('usuario', nomeUsuario)
      .eq('senha', senha)
      .maybeSingle()
    
    // Se deu erro relacionado ao relacionamento, tenta sem relacionamento
    if (responsavelErrorWithRel && responsavelErrorWithRel.code !== 'PGRST116') {
      console.log('Tentando buscar responsável sem relacionamento...')
      const { data: responsavelDataSimple, error: responsavelErrorSimple } = await supabase
        .from('responsaveis')
        .select('*')
        .eq('usuario', nomeUsuario)
        .eq('senha', senha)
        .maybeSingle()
      
      responsavelData = responsavelDataSimple
      responsavelError = responsavelErrorSimple
    } else {
      responsavelData = responsavelDataWithRel
      responsavelError = responsavelErrorWithRel
    }

    if (responsavelError && responsavelError.code !== 'PGRST116') {
      console.error('Erro ao buscar em responsaveis:', responsavelError);
    }

    // Se encontrou em responsaveis, busca os alunos vinculados
    if (responsavelData) {
      // Busca todos os alunos deste responsável
      const { data: alunosData, error: alunosError } = await supabase
        .from('usuarios')
        .select(`
          idusuario,
          usuario,
          nome,
          idade,
          telefone
        `)
        .eq('idresponsavel', responsavelData.idresponsavel);

      if (alunosError) {
        console.error('Erro ao buscar alunos do responsável:', alunosError);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Login realizado com sucesso!',
          usuario: {
            ...responsavelData,
            // Adiciona idusuario para compatibilidade (usa idresponsavel)
            idusuario: responsavelData.idresponsavel
          },
          tipo: 'responsavel',
          alunos: alunosData || []
        }),
      };
    }

    // 3. Não encontrou em nenhuma tabela
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Usuário ou senha inválidos.' }),
    };
  } catch (err) {
    console.error('Erro na função usuarios:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro no servidor: ' + err.message }),
    };
  }
}; 