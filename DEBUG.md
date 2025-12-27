# Debug - Página em Branco

## Passos para diagnosticar:

1. **Abra o Console do Navegador (F12)**
   - Vá na aba "Console"
   - Veja se há erros em vermelho

2. **Verifique se o React está carregando:**
   - Abra o DevTools (F12)
   - Vá na aba "Network"
   - Recarregue a página
   - Procure por `main.jsx` ou `App.jsx`
   - Veja se há erros 404 ou 500

3. **Verifique o elemento root:**
   - No Console, digite: `document.getElementById('root')`
   - Deve retornar o elemento, não `null`

4. **Teste manual:**
   - No Console, digite:
   ```javascript
   console.log('React está carregado?', typeof React !== 'undefined')
   ```

5. **Verifique se as dependências estão instaladas:**
   ```bash
   npm install
   ```

6. **Limpe o cache do Vite:**
   ```bash
   rm -rf node_modules/.vite
   # ou no Windows:
   rmdir /s /q node_modules\.vite
   ```

7. **Reinicie o servidor:**
   - Pare o servidor (Ctrl+C)
   - Rode novamente: `npm run dev` ou `npm run netlify:dev`

## Erros Comuns:

### "Cannot find module"
- Execute: `npm install`

### "Elemento root não encontrado"
- Verifique se o `index.html` está na raiz do projeto
- Verifique se tem `<div id="root"></div>` no HTML

### "React is not defined"
- Verifique se `react` e `react-dom` estão instalados
- Execute: `npm install react react-dom`

### Página completamente branca sem erros
- Pode ser um erro silencioso no React
- Verifique o ErrorBoundary
- Veja se há erros no console do navegador

