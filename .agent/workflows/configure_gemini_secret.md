---
description: Configurar chave da API Gemini no Supabase e fazer deploy da função Edge
---

# Passos

1. **Login na conta Supabase** (necessário interação no navegador)
   Se você ainda não estiver logado, execute:
   ```bash
   npx supabase login
   ```
   _Siga as instruções na janela do navegador que será aberta._

2. **Definir o segredo da API Gemini**
   ```bash
   npx supabase secrets set GOOGLE_AI_API_KEY=AIzaSyAvogvmHAcdf05NMwtU6NcSqmd1pwB6Ego --project-ref nufifxcjujpjipoocvaz
   ```

3. **Deploy da função `process-exam`**
   ```bash
   npx supabase functions deploy process-exam --project-ref nufifxcjujpjipoocvaz
   ```

---
**Observação:** Certifique-se de ter feito login antes de executar os passos 2 e 3.
