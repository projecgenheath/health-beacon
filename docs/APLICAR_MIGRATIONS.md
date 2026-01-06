# 🚀 Como Aplicar as Migrations no Supabase

## ⚠️ IMPORTANTE
Você precisa aplicar as migrations manualmente porque npm não está disponível no PATH.

## Opção 1: Aplicar via SQL Editor no Dashboard (RECOMENDADO) ✅

Esta é a forma mais rápida sem precisar instalar o Supabase CLI.

### Passos:

1. **Abrir o SQL Editor**
   - Vá para: https://supabase.com/dashboard/project/nufifxcjujpjipoocvaz/sql
   - Ou no dashboard: Sidebar → **SQL Editor**

2. **Executar cada migration na ordem** (IMPORTANTE: executar na ordem!)

   **Migration 1** - Criar tabelas principais:
   - Copie TODO o conteúdo do arquivo: `supabase/migrations/20251217174645_c817d23b-a734-4b37-8f5d-a93bfd7d877b.sql`
   - Cole no SQL Editor
   - Clique em "Run" (ou Ctrl+Enter)

   **Migration 2**:
   - Copie o conteúdo: `supabase/migrations/20251218172418_1ecb0349-e8c0-49ad-a2ac-b67e1e310523.sql`
   - Cole e execute

   **Migration 3**:
   - Copie o conteúdo: `supabase/migrations/20251219032127_6f7eb3c5-b926-4fb5-bb2a-f874fe45322a.sql`
   - Cole e execute

   **Migration 4**:
   - Copie o conteúdo: `supabase/migrations/20251223035709_4d285e69-6f95-4061-9e9c-5fea8801b9e7.sql`
   - Cole e execute

   **Migration 5**:
   - Copie o conteúdo: `supabase/migrations/20251223040850_655902dc-3e71-4eb4-a80a-dc86f6305dbf.sql`
   - Cole e execute

   **Migration 6** - Criar tabela health_goals:
   - Copie o conteúdo: `supabase/migrations/20260106131131_d3bd8eea-e301-4d8b-b82f-bc64fc93b67d.sql`
   - Cole e execute

3. **Verificar se funcionou**
   - Vá em **Table Editor** (sidebar)
   - Você deve ver 4 tabelas:
     - `profiles`
     - `exams`
     - `exam_results`
     - `health_goals`

## Opção 2: Usar Supabase CLI (Requer instalação do Node/npm)

Se você tiver Node.js instalado mas o npm não está no PATH:

### Instalar Node.js
1. Baixe de: https://nodejs.org/
2. Instale a versão LTS
3. Reinicie o terminal/PowerShell
4. Verifique: `node --version` e `npm --version`

### Aplicar migrations via CLI
```powershell
# Instalar Supabase CLI globalmente
npm install -g supabase

# Fazer login
supabase login

# Linkar com o projeto
supabase link --project-ref nufifxcjujpjipoocvaz

# Aplicar todas as migrations
supabase db push
```

## 📊 Como Verificar se Funcionou

### No Supabase Dashboard:
1. **Table Editor**: Deve mostrar 4 tabelas
2. **Database** → **Roles**: Deve ter as políticas RLS configuradas

### Na Aplicação:
1. Inicie o servidor de desenvolvimento
2. Faça login
3. Tente fazer upload de um exame
4. Os dados devem aparecer

## 🔧 Troubleshooting

### Erro: "relation already exists"
- Significa que a tabela já foi criada
- Continue para a próxima migration

### Erro: "function does not exist"
- Execute as migrations na ordem correta
- A migration 1 cria funções usadas pelas outras

### Erro: "permission denied"
- Verifique se você é admin do projeto no Supabase
- Tente fazer login novamente no dashboard

## ✅ Checklist Após Aplicar Migrations

- [ ] 4 tabelas criadas no banco
- [ ] Políticas RLS ativas em todas as tabelas
- [ ] Triggers de updated_at funcionando
- [ ] Buckets de storage criados (se necessário):
  - `exam-files`
  - `avatars`

## 📝 Próximos Passos

1. ✅ Aplicar todas as migrations
2. ✅ Verificar tabelas no Table Editor
3. ✅ Testar a aplicação localmente
4. ✅ Fazer login e testar upload de exame
5. ✅ Verificar se os dados aparecem

---

**Dúvidas?** Consulte o arquivo `docs/TROUBLESHOOTING_SUPABASE.md`
