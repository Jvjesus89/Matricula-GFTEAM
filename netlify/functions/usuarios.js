const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não configuradas!');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'NÃO CONFIGURADA');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Configurada' : 'NÃO CONFIGURADA');
}

// Validação da URL do Supabase
let supabase = null;
if (supabaseUrl && supabaseKey) {
  // Garante que a URL começa com https://
  const url = supabaseUrl.trim();
  if (!url.startsWith('https://')) {
    console.error('ERRO: SUPABASE_URL deve começar com https://. URL atual:', url);
  } else {
    try {
      supabase = createClient(url, supabaseKey);
      console.log('Cliente Supabase inicializado com sucesso. URL:', url.substring(0, 30) + '...');
    } catch (error) {
      console.error('Erro ao criar cliente Supabase:', error);
    }
  }
}

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
    let usuarioData = null;
    let usuarioError = null;
    
    try {
      const result = await supabase
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
      
      usuarioData = result.data;
      usuarioError = result.error;
    } catch (fetchError) {
      console.error('Erro de rede ao buscar em usuarios:', {
        message: fetchError.message,
        details: fetchError.details || fetchError.toString(),
        code: fetchError.code
      });
      usuarioError = {
        message: 'Erro de conexão com o banco de dados',
        details: fetchError.message,
        code: 'FETCH_ERROR'
      };
    }

    if (usuarioError) {
      console.error('Erro ao buscar em usuarios:', usuarioError);
      // Se for erro de rede, não continua tentando responsáveis
      if (usuarioError.code === 'FETCH_ERROR' || usuarioError.message?.includes('fetch failed')) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Erro de conexão com o banco de dados. Verifique as configurações do Supabase.',
            details: usuarioError.details || usuarioError.message
          }),
        };
      }
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
    let responsavelData = null;
    let responsavelError = null;
    
    try {
      const resultWithRel = await supabase
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
        .maybeSingle();
      
      const responsavelDataWithRel = resultWithRel.data;
      const responsavelErrorWithRel = resultWithRel.error;
      
      // Se deu erro relacionado ao relacionamento, tenta sem relacionamento
      if (responsavelErrorWithRel && responsavelErrorWithRel.code !== 'PGRST116') {
        console.log('Tentando buscar responsável sem relacionamento...');
        try {
          const resultSimple = await supabase
            .from('responsaveis')
            .select('*')
            .eq('usuario', nomeUsuario)
            .eq('senha', senha)
            .maybeSingle();
          
          responsavelData = resultSimple.data;
          responsavelError = resultSimple.error;
        } catch (fetchError) {
          console.error('Erro de rede ao buscar responsável sem relacionamento:', {
            message: fetchError.message,
            details: fetchError.details || fetchError.toString(),
            code: fetchError.code
          });
          responsavelError = {
            message: 'Erro de conexão com o banco de dados',
            details: fetchError.message,
            code: 'FETCH_ERROR'
          };
        }
      } else {
        responsavelData = responsavelDataWithRel;
        responsavelError = responsavelErrorWithRel;
      }
    } catch (fetchError) {
      console.error('Erro de rede ao buscar em responsaveis:', {
        message: fetchError.message,
        details: fetchError.details || fetchError.toString(),
        code: fetchError.code
      });
      responsavelError = {
        message: 'Erro de conexão com o banco de dados',
        details: fetchError.message,
        code: 'FETCH_ERROR'
      };
    }

    if (responsavelError && responsavelError.code !== 'PGRST116') {
      console.error('Erro ao buscar em responsaveis:', responsavelError);
      // Se for erro de rede, retorna erro 500
      if (responsavelError.code === 'FETCH_ERROR' || responsavelError.message?.includes('fetch failed')) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Erro de conexão com o banco de dados. Verifique as configurações do Supabase.',
            details: responsavelError.details || responsavelError.message
          }),
        };
      }
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
    console.error('Erro na função usuarios:', {
      message: err.message,
      details: err.details || err.toString(),
      stack: err.stack,
      code: err.code
    });
    
    // Tratamento específico para erros de fetch/rede
    if (err.message?.includes('fetch failed') || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Erro de conexão com o banco de dados. Verifique se as variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY estão configuradas corretamente.',
          details: err.message,
          hint: 'Certifique-se de que SUPABASE_URL começa com https:// e está acessível.'
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro no servidor: ' + err.message }),
    };
  }
}; 