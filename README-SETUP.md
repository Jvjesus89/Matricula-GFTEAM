# Setup do Projeto React

## Problema Comum: Erro 500 nas Funções Netlify

Se você está recebendo erro 500 ao tentar fazer login, verifique:

### 1. Variáveis de Ambiente

As funções Netlify precisam das variáveis de ambiente do Supabase. Crie um arquivo `.env` na raiz do projeto:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

**IMPORTANTE:**
- A `SUPABASE_URL` **DEVE** começar com `https://`
- Não use `http://` - isso causará erros de "fetch failed"
- Você pode encontrar essas informações no painel do Supabase em Settings > API

**Para desenvolvimento local com Netlify Dev:**
Crie um arquivo `.env` na raiz do projeto ou configure as variáveis usando:
```bash
netlify env:set SUPABASE_URL https://seu-projeto.supabase.co
netlify env:set SUPABASE_ANON_KEY sua_chave_anonima
```

### 2. Netlify Dev

Para desenvolvimento local, você precisa rodar o Netlify Dev:

```bash
npm run netlify:dev
```

Isso iniciará:
- O servidor Vite na porta 3000
- O servidor Netlify Functions na porta 8888
- O proxy configurado no Vite redirecionará as chamadas `/.netlify/functions/*` para o servidor correto

### 3. Ordem de Inicialização

**Opção 1: Netlify Dev (Recomendado)**
```bash
npm run netlify:dev
```

**Opção 2: Separado**
Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
netlify dev
```

### 4. Verificar se as Funções Estão Funcionando

Acesse diretamente:
```
http://localhost:8888/.netlify/functions/usuarios
```

Deve retornar um erro 405 (Método não permitido) se estiver funcionando, ou um erro de método se você fizer POST sem dados.

### 5. Debug

Se ainda houver problemas:

1. Verifique os logs do Netlify Dev no terminal
2. Abra o DevTools do navegador e veja a aba Network
3. Verifique se as variáveis de ambiente estão configuradas:
   ```bash
   netlify env:list
   ```

### 6. Produção

Em produção no Netlify, as variáveis de ambiente devem estar configuradas no painel do Netlify:
- Settings > Environment variables

