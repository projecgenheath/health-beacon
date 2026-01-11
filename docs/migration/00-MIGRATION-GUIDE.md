# 📋 Guia de Migração - MeuExame

Este guia contém tudo que você precisa para migrar o projeto para sua própria infraestrutura Supabase.

## 📁 Estrutura dos Arquivos

```
docs/migration/
├── 00-MIGRATION-GUIDE.md      # Este arquivo
├── 01-data-export.sql         # Dados atuais para importação
├── 02-edge-functions/         # Edge Functions adaptadas
│   ├── process-exam/
│   │   └── index.ts
│   ├── send-exam-alerts/
│   │   └── index.ts
│   └── send-digest/
│       └── index.ts
└── 03-schema.sql              # Schema completo do banco
```

---

## 🚀 Passo a Passo

### 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Anote as credenciais:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

### 2. Configurar Banco de Dados

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Execute o conteúdo de `03-schema.sql` (schema completo)
3. Execute o conteúdo de `01-data-export.sql` (dados existentes)

### 3. Configurar Storage

O schema SQL já cria os buckets necessários:
- `exam-files` (privado) - para PDFs de exames
- `avatars` (público) - para fotos de perfil

### 4. Configurar Secrets

No Supabase Dashboard, vá em **Project Settings → Edge Functions → Secrets**:

| Secret | Descrição | Onde Obter |
|--------|-----------|------------|
| `GOOGLE_AI_API_KEY` | API do Google Gemini | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `RESEND_API_KEY` | API do Resend para emails | [Resend Dashboard](https://resend.com/api-keys) |

### 5. Configurar Email (Resend)

1. Crie conta em [resend.com](https://resend.com)
2. Adicione e verifique seu domínio em [resend.com/domains](https://resend.com/domains)
3. Crie uma API key em [resend.com/api-keys](https://resend.com/api-keys)
4. Atualize o `from` nas Edge Functions com seu domínio verificado

### 6. Deploy das Edge Functions

Para cada função em `02-edge-functions/`:

```bash
# No terminal, dentro da pasta do projeto
supabase functions deploy process-exam
supabase functions deploy send-exam-alerts
supabase functions deploy send-digest
```

Ou importe via Dashboard:
1. Vá em **Edge Functions**
2. Clique em **New Function**
3. Cole o código de cada função

### 7. Configurar Cron Jobs (Opcional)

Para o digest automático, configure um cron job:

**Opção A - pg_cron (recomendado)**
```sql
-- Digest semanal (toda segunda às 8h)
SELECT cron.schedule(
  'weekly-digest',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJETO.supabase.co/functions/v1/send-digest',
    body := '{"frequency": "weekly"}'::jsonb,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SUA_SERVICE_KEY"}'::jsonb
  );
  $$
);

-- Digest mensal (dia 1 às 8h)
SELECT cron.schedule(
  'monthly-digest',
  '0 8 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJETO.supabase.co/functions/v1/send-digest',
    body := '{"frequency": "monthly"}'::jsonb,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SUA_SERVICE_KEY"}'::jsonb
  );
  $$
);
```

**Opção B - Serviço externo**
- [cron-job.org](https://cron-job.org) (grátis)
- [EasyCron](https://www.easycron.com)

---

## 🔧 Adaptações no Frontend

### Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
VITE_SUPABASE_PROJECT_ID=seu_project_id
```

### Cliente Supabase

Edite `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## 💰 Custos Estimados

| Serviço | Plano Free | Plano Pago |
|---------|------------|------------|
| Supabase | 500MB DB, 1GB storage | $25/mês (8GB DB) |
| Google AI | 60 req/min grátis | ~$0.001/página |
| Resend | 3.000 emails/mês | $20/mês (50k emails) |
| **Total** | **~$5/mês** | **~$50/mês** |

---

## ⚠️ Notas Importantes

1. **Usuários existentes**: Os IDs de usuário no arquivo de exportação são do projeto atual. Se você criar novos usuários, precisará mapear os IDs.

2. **Arquivos de exames**: Os PDFs precisam ser migrados manualmente do bucket atual para o novo. Use o Supabase CLI ou Dashboard.

3. **Autenticação**: Configure "Confirm Email" como desabilitado em Settings → Auth para testes mais rápidos.

4. **RLS**: Todas as políticas de Row Level Security estão configuradas. Teste cada operação CRUD após a migração.

---

## 📞 Suporte

Se precisar de ajuda adicional:
- Documentação Supabase: [supabase.com/docs](https://supabase.com/docs)
- Documentação Resend: [resend.com/docs](https://resend.com/docs)
- Google AI Studio: [ai.google.dev](https://ai.google.dev)
