# MeuExame - Código Frontend Completo

Este documento contém todo o código necessário para recriar o projeto MeuExame em um novo projeto Lovable sem Cloud.

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/ (componentes shadcn - copiar da CLI)
│   ├── skeletons/
│   └── [componentes principais]
├── hooks/
├── pages/
├── types/
├── lib/
└── integrations/supabase/
```

---

## 1. Configuração Inicial

### `.env` (criar na raiz)
```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...SUA_CHAVE_AQUI
```

### `src/integrations/supabase/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### `src/integrations/supabase/types.ts`
```typescript
// Copie o arquivo types.ts gerado pelo Supabase CLI ou use:
// npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/integrations/supabase/types.ts
```

---

## 2. Tipos (`src/types/exam.ts`)

```typescript
export type ExamStatus = 'healthy' | 'warning' | 'danger';

export interface ExamResult {
  id: string;
  examId: string;
  name: string;
  value: number;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  status: ExamStatus;
  date: string;
  category: string;
  fileUrl: string | null;
  fileName: string | null;
}

export interface ExamHistory {
  examName: string;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  history: {
    date: string;
    value: number;
    status: ExamStatus;
  }[];
}

export interface HealthSummary {
  totalExams: number;
  healthy: number;
  warning: number;
  danger: number;
  lastUpdate: string;
}
```

---

## 3. Hooks Principais

### `src/hooks/useAuth.tsx`
```typescript
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### `src/hooks/useExamData.tsx`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ExamResult, ExamHistory, HealthSummary, ExamStatus } from '@/types/exam';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExamResultRow {
  id: string;
  exam_id: string;
  name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  status: string;
  exam_date: string;
  category: string | null;
}

export const useExamData = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [histories, setHistories] = useState<ExamHistory[]>([]);
  const [summary, setSummary] = useState<HealthSummary>({
    totalExams: 0,
    healthy: 0,
    warning: 0,
    danger: 0,
    lastUpdate: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchExamData = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`*, exams:exam_id (file_url, file_name)`)
        .eq('user_id', user.id)
        .order('exam_date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setExams([]);
        setHistories([]);
        setSummary({
          totalExams: 0,
          healthy: 0,
          warning: 0,
          danger: 0,
          lastUpdate: 'Nenhum exame',
        });
        setLoading(false);
        return;
      }

      const latestExamsMap = new Map<string, ExamResultRow & { exams?: { file_url: string | null; file_name: string } | null }>();
      const examsByName = new Map<string, ExamResultRow[]>();

      (data as (ExamResultRow & { exams?: { file_url: string | null; file_name: string } | null })[]).forEach((row) => {
        if (!examsByName.has(row.name)) {
          examsByName.set(row.name, []);
        }
        examsByName.get(row.name)!.push(row);
        if (!latestExamsMap.has(row.name)) {
          latestExamsMap.set(row.name, row);
        }
      });

      const latestExams: ExamResult[] = Array.from(latestExamsMap.values()).map((row) => ({
        id: row.id,
        examId: row.exam_id,
        name: row.name,
        value: Number(row.value),
        unit: row.unit,
        referenceMin: row.reference_min ?? 0,
        referenceMax: row.reference_max ?? 100,
        status: row.status as ExamStatus,
        date: row.exam_date,
        category: row.category ?? 'Geral',
        fileUrl: row.exams?.file_url ?? null,
        fileName: row.exams?.file_name ?? null,
      }));

      const examHistories: ExamHistory[] = [];
      examsByName.forEach((rows, examName) => {
        if (rows.length >= 1) {
          const sortedRows = [...rows].sort(
            (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
          );
          const firstRow = sortedRows[0];
          examHistories.push({
            examName,
            unit: firstRow.unit,
            referenceMin: firstRow.reference_min ?? 0,
            referenceMax: firstRow.reference_max ?? 100,
            history: sortedRows.map((r) => ({
              date: r.exam_date,
              value: Number(r.value),
              status: r.status as ExamStatus,
            })),
          });
        }
      });

      const healthy = latestExams.filter((e) => e.status === 'healthy').length;
      const warning = latestExams.filter((e) => e.status === 'warning').length;
      const danger = latestExams.filter((e) => e.status === 'danger').length;

      const mostRecentDate = data[0]?.exam_date
        ? format(new Date(data[0].exam_date), "d 'de' MMMM, yyyy", { locale: ptBR })
        : '';

      setExams(latestExams);
      setHistories(examHistories);
      setSummary({
        totalExams: latestExams.length,
        healthy,
        warning,
        danger,
        lastUpdate: mostRecentDate,
      });
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExamData();
    }
  }, [user, fetchExamData]);

  return { exams, histories, summary, loading, refetch: fetchExamData };
};
```

---

## 4. Componentes Principais

Os componentes estão no projeto atual. Para copiar todos:

1. **Copie toda a pasta `src/components/`** do projeto atual
2. **Copie toda a pasta `src/pages/`** do projeto atual
3. **Copie toda a pasta `src/hooks/`** do projeto atual

### Lista de Componentes Principais:
- `MainLayout.tsx` - Layout principal com sidebar
- `Sidebar.tsx` - Navegação lateral
- `Header.tsx` - Cabeçalho
- `ProtectedRoute.tsx` - Proteção de rotas
- `HealthSummaryCard.tsx` - Resumo de saúde
- `ExamsList.tsx` - Lista de exames
- `ExamCard.tsx` - Card individual de exame
- `UploadSection.tsx` - Upload de arquivos
- `UploadHistory.tsx` - Histórico de uploads
- `AlertsSection.tsx` - Alertas de exames
- `HealthGoals.tsx` - Metas de saúde
- `AIInsightsWidget.tsx` - Widget de insights (precisa adaptar para não usar Lovable AI)
- `FilterPanel.tsx` - Painel de filtros
- `SearchBar.tsx` - Barra de busca
- E todos os skeletons em `src/components/skeletons/`

---

## 5. Páginas

### Lista de Páginas:
- `Index.tsx` - Dashboard principal
- `Auth.tsx` - Login/Cadastro
- `Profile.tsx` - Perfil do usuário
- `Analytics.tsx` - Análises e gráficos
- `CompareExams.tsx` - Comparar exames
- `ExamReport.tsx` - Relatório de exame
- `NotFound.tsx` - Página 404

---

## 6. Arquivos de Configuração

### `tailwind.config.ts`
Copie do projeto atual - contém as cores e configurações de tema.

### `src/index.css`
Copie do projeto atual - contém as variáveis CSS e estilos globais.

### `vite.config.ts`
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

## 7. Dependências Necessárias

Instale via npm/yarn:

```bash
npm install @supabase/supabase-js @tanstack/react-query react-router-dom
npm install @radix-ui/react-* # todos os componentes Radix necessários
npm install recharts date-fns lucide-react
npm install class-variance-authority clsx tailwind-merge
npm install zod react-hook-form @hookform/resolvers
npm install jspdf html2canvas sonner
npm install tailwindcss-animate
```

Ou simplesmente copie o `package.json` do projeto atual e rode `npm install`.

---

## 8. Adaptações Necessárias

### AIInsightsWidget
O componente `AIInsightsWidget.tsx` usa Lovable AI. Para o projeto externo, você precisará:
1. Remover o componente completamente, OU
2. Adaptar para usar a API do Google Gemini diretamente via Edge Function

### Edge Functions
Use os arquivos em `docs/migration/02-edge-functions/` para criar suas Edge Functions no Supabase externo.

---

## Próximos Passos

1. Crie o novo projeto Lovable
2. Configure o Supabase externo com o schema em `03-schema.sql`
3. Importe os dados com `01-data-export.sql`
4. Copie todos os arquivos de código
5. Configure as Edge Functions
6. Teste a aplicação

