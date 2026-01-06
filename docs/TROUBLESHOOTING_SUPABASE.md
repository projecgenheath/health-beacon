# 🔧 Troubleshooting - Dados não aparecem no Supabase

## Problema
Não consigo ver os dados no banco de dados do Supabase

## Possíveis Causas e Soluções

### 1. ✅ Verificar se as migrations foram aplicadas

**Problema**: As tabelas podem não ter sido criadas no banco de dados do Supabase.

**Solução**:
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `cwhoepbevbbxxmylvxnl`
3. Vá em **Table Editor** no menu lateral
4. Verifique se as seguintes tabelas existem:
   - `profiles`
   - `exams`
   - `exam_results`
   - `health_goals`

**Se as tabelas NÃO existirem**, você precisa executar as migrations:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Entrar no diretório do projeto
cd "c:\Users\Alisson\projeto antigravity\health-beacon"

# Fazer login no Supabase
supabase login

# Linkar com seu projeto
supabase link --project-ref cwhoepbevbbxxmylvxnl

# Aplicar as migrations
supabase db push
```

### 2. 🔐 Verificar autenticação do usuário

**Problema**: Se você não estiver autenticado, as políticas RLS (Row Level Security) impedirão que você veja os dados.

**Solução**:
1. Abra o console do navegador (F12)
2. Execute no console:
```javascript
import { supabase } from "@/integrations/supabase/client";
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

Se `session` for `null`, você precisa fazer login primeiro.

### 3. 🛡️ Verificar políticas RLS

**Problema**: As políticas de segurança podem estar muito restritivas.

**Verificação no Supabase Dashboard**:
1. Vá em **Authentication** → **Policies** (ou **Table Editor** → selecione uma tabela → **RLS policies**)
2. Verifique se as políticas estão ativas:
   - `Users can view own exams`
   - `Users can view own results`
   - `Users can view own profile`
   - `Users can view own goals`

**Teste temporário** (apenas para debug):
No Supabase Dashboard → SQL Editor, execute:
```sql
-- ATENÇÃO: Isso desabilita a segurança temporariamente para teste
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_goals DISABLE ROW LEVEL SECURITY;
```

**IMPORTANTE**: Após testar, REABILITE a segurança:
```sql
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
```

### 4. 📊 Verificar se há dados na tabela

**Problema**: Talvez não existam dados inseridos ainda.

**Solução**:
1. No Supabase Dashboard → **SQL Editor**
2. Execute:
```sql
-- Verificar total de registros
SELECT COUNT(*) FROM exams;
SELECT COUNT(*) FROM exam_results;
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM health_goals;

-- Ver todos os dados (sem filtro de usuário)
SELECT * FROM exams;
SELECT * FROM exam_results;
```

### 5. 🔑 Verificar configuração das variáveis de ambiente

**Problema**: As credenciais do Supabase podem estar incorretas.

**Solução**:
1. Verifique se o arquivo `.env` tem as variáveis corretas:
```bash
VITE_SUPABASE_URL=https://cwhoepbevbbxxmylvxnl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. No Supabase Dashboard → **Settings** → **API**
   - Compare o **Project URL** com `VITE_SUPABASE_URL`
   - Compare o **anon/public key** com `VITE_SUPABASE_PUBLISHABLE_KEY`

3. Se precisar atualizar, reinicie o servidor de desenvolvimento:
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 6. 🐛 Verificar erros no console

**Solução**:
1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Procure por erros relacionados a:
   - Supabase
   - Fetch/Network
   - Authentication

Erros comuns:
- `Invalid API key` → Verificar `.env`
- `Row Level Security` → Verificar autenticação
- `relation "table_name" does not exist` → Executar migrations

### 7. 🌐 Teste direto no Supabase

**Solução**:
1. Vá no Supabase Dashboard → **Table Editor**
2. Clique em uma tabela (ex: `exams`)
3. Clique em **Insert row** (botão verde +)
4. Preencha os campos manualmente
5. Tente visualizar a linha inserida

Se conseguir ver os dados inseridos manualmente no dashboard mas não na aplicação, o problema está na autenticação/código da aplicação.

## 🚀 Teste Rápido de Conectividade

Execute este script no console do navegador (F12):

```javascript
// Teste de conexão com Supabase
import { supabase } from "@/integrations/supabase/client";

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  // 1. Verificar sessão
  const { data: { session } } = await supabase.auth.getSession();
  console.log('✅ Sessão:', session ? 'Autenticado' : '❌ Não autenticado');
  
  if (!session) {
    console.log('⚠️ Você precisa fazer login primeiro');
    return;
  }
  
  // 2. Testar query
  const { data, error } = await supabase
    .from('exams')
    .select('*');
  
  if (error) {
    console.error('❌ Erro ao buscar dados:', error);
  } else {
    console.log('✅ Dados encontrados:', data.length, 'registros');
    console.log('📊 Dados:', data);
  }
}

testConnection();
```

## 📝 Próximos Passos

1. ✅ Verificar se está autenticado
2. ✅ Aplicar migrations no Supabase
3. ✅ Verificar políticas RLS
4. ✅ Inserir dados de teste
5. ✅ Verificar no console por erros

Se nenhuma dessas soluções funcionar, compartilhe:
- Mensagens de erro do console
- Screenshots do Supabase Dashboard (Table Editor)
- Output das queries SQL
