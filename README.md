# GF TEAM - Sistema de Matrícula (React)

Sistema de gerenciamento de matrículas e financeiro para a GF TEAM, desenvolvido com React.

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para interfaces
- **React Router DOM** - Roteamento
- **Vite** - Build tool e dev server
- **React Data Table Component** - Tabelas de dados
- **Plotly.js** - Gráficos (via react-plotly.js)
- **Netlify Functions** - Funções serverless
- **Supabase** - Banco de dados

## 📁 Estrutura do Projeto

```
Matricula-GFTEAM/
├── src/                    # Código fonte React
│   ├── components/         # Componentes reutilizáveis
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Layout.jsx
│   │   ├── Modal.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/          # Contextos React
│   │   └── AuthContext.jsx
│   ├── pages/             # Páginas da aplicação
│   │   ├── Login.jsx
│   │   ├── Principal.jsx
│   │   ├── Alunos.jsx
│   │   └── Financeiro.jsx
│   ├── services/          # Serviços de API
│   │   └── api.js
│   ├── styles/            # Estilos CSS
│   ├── utils/             # Funções utilitárias
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Ponto de entrada
├── netlify/
│   └── functions/         # Funções serverless Netlify
├── css/                   # Estilos globais
├── picture/               # Imagens e assets
├── public/                 # Arquivos públicos
└── index.html             # HTML base do React
```

## 🛠️ Instalação

```bash
# Instalar dependências
npm install
```

## 🚦 Desenvolvimento

### Opção 1: Netlify Dev (Recomendado)
Inicia o Vite e as funções Netlify simultaneamente:

```bash
npm run netlify:dev
```

Acesse: `http://localhost:3000`

### Opção 2: Apenas Vite
Apenas o frontend (funções Netlify não estarão disponíveis):

```bash
npm run dev
```

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
```

Ou configure no Netlify:
```bash
netlify env:set SUPABASE_URL "sua_url"
netlify env:set SUPABASE_ANON_KEY "sua_chave"
```

## 📍 Rotas

- `/login` - Página de login
- `/` ou `/principal` - Página principal
- `/alunos` - Gerenciamento de alunos (apenas administradores)
- `/financeiro` - Gerenciamento financeiro

## ✨ Funcionalidades

- ✅ Autenticação de usuários
- ✅ Controle de acesso baseado em perfis
- ✅ Gerenciamento de alunos (CRUD)
- ✅ Gerenciamento financeiro
- ✅ Gráficos e relatórios (administradores)
- ✅ Filtros e buscas
- ✅ Interface responsiva

## 🚀 Deploy

O projeto está configurado para deploy no Netlify:

1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente no painel do Netlify
3. O build será executado automaticamente

## 📝 Notas

- As funções serverless estão em `netlify/functions/`
- Os estilos CSS originais foram mantidos em `css/`
- As imagens estão em `picture/`

## 🐛 Troubleshooting

### Erro 500 nas funções Netlify
- Certifique-se de rodar `npm run netlify:dev`
- Verifique se as variáveis de ambiente estão configuradas

### Source map warnings
- São apenas avisos e não afetam o funcionamento
- Já foram desabilitados no `vite.config.js`

## 📄 Licença

Copyright © 2025 - Software-One
