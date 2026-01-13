# Health Beacon - Troubleshooting Guide

## Página em Branco no Vercel

### Problema
Após o deploy no Vercel, a aplicação mostra uma página em branco.

### Causas Comuns

1. **Roteamento SPA não configurado** ✅ CORRIGIDO
   - SPAs precisam redirecionar todas as rotas para index.html
   - Solução: Criado `vercel.json` com rewrites

2. **Erro de build CSS** ✅ CORRIGIDO
   - `@import` de arquivos locais pode causar problemas
   - Solução: Movidas animações inline para `index.css`

3. **Variáveis de ambiente não configuradas**
   - Verifique se as variáveis no Vercel Dashboard estão corretas
   - Necessárias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

### Passos para Deploy

1. **Configurar Variáveis de Ambiente no Vercel**
   ```
   Dashboard > Settings > Environment Variables
   
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
   VITE_SUPABASE_ANON_KEY=sua-chave-publishable (mesma)
   ```

2. **Fazer Push das Correções**
   ```bash
   git add vercel.json src/index.css
   git commit -m "fix: corrige página em branco no Vercel"
   git push
   ```

3. **Redeploy Automático**
   - Vercel fará redeploy automaticamente
   - Aguarde ~2-3 minutos

4. **Verificar Logs**
   - Se ainda houver problemas, veja logs em:
   - Vercel Dashboard > Deployments > [seu deploy] > Build Logs

### Debugging

Se a página ainda estiver em branco:

1. **Abra DevTools no navegador** (F12)
2. **Vá para Console** - procure erros
3. **Vá para Network** - veja se os assets carregam
4. **Veja erros comuns:**
   - `Uncaught SyntaxError`: problema de build
   - `Failed to fetch`: variáveis de ambiente
   - `404`: problema de roteamento

### Arquivos Corrigidos

- ✅ `vercel.json` - Configuração de rotas SPA
- ✅ `src/index.css` - Animações movidas inline

### Próximos Passos

1. Configure as variáveis de ambiente no Vercel
2. Faça commit e push das correções
3. Aguarde o redeploy
4. Teste a aplicação

Se continuar com problemas, compartilhe:
- URL do deploy no Vercel
- Erros do console (F12)
- Logs de build do Vercel
