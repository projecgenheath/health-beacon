# Health Beacon - Sistema de Gestão de Exames de Saúde

<p align="center">
  <img src="public/favicon.svg" alt="Health Beacon Logo" width="80" height="80">
</p>

<p align="center">
  <strong>Gerencie seus exames de saúde de forma inteligente com análise por IA</strong>
</p>

<p align="center">
  <a href="#funcionalidades">Funcionalidades</a> •
  <a href="#tecnologias">Tecnologias</a> •
  <a href="#instalação">Instalação</a> •
  <a href="#uso">Uso</a> •
  <a href="#estrutura">Estrutura</a>
</p>

---

## 📋 Sobre

O **Health Beacon** (BHB - Biomedical Health Bank) é uma aplicação web progressiva (PWA) para gerenciamento inteligente de exames de saúde. Utiliza inteligência artificial para analisar resultados de exames, identificar tendências e fornecer insights personalizados sobre sua saúde.

## ✨ Funcionalidades

### Core
- 📊 **Dashboard Inteligente** - Visão geral do seu estado de saúde com score calculado
- 📤 **Upload de Exames** - Suporte a PDF e imagens, com processamento via IA (Gemini)
- 📈 **Análise de Tendências** - Acompanhe a evolução dos seus marcadores ao longo do tempo
- 🔍 **Comparação de Exames** - Compare resultados entre diferentes períodos
- 📄 **Relatórios PDF** - Exporte seus dados em relatórios personalizados

### Inteligência Artificial
- 🤖 **Insights Personalizados** - Análise automática dos resultados com recomendações
- 📊 **Score de Saúde** - Avaliação geral baseada em todos os seus exames
- ⚠️ **Alertas Inteligentes** - Notificações sobre valores fora do normal

### Acompanhamento
- 🎯 **Metas de Saúde** - Defina e acompanhe objetivos para seus marcadores
- 💊 **Controle de Medicamentos** - Gerencie seus medicamentos e horários
- 📅 **Lembretes** - Notificações para exames periódicos

### Compartilhamento
- 🔗 **Links Compartilháveis** - Compartilhe exames com médicos via link seguro
- 📊 **Logs de Acesso** - Veja quem acessou seus exames compartilhados

### Mobile & Offline
- 📱 **PWA** - Instalável como app nativo no celular
- 🔄 **Sincronização** - Dados salvos localmente e sincronizados com a nuvem

## 🛠️ Tecnologias

### Frontend
- **React 18** + **TypeScript** - Framework principal
- **Vite 7** - Build tool ultra-rápido
- **TailwindCSS** - Estilização utilitária
- **shadcn/ui** - Componentes de UI acessíveis
- **Framer Motion** - Animações fluidas
- **Recharts** - Gráficos interativos
- **TanStack Query** - Gerenciamento de estado do servidor

### Backend
- **Supabase** - Banco de dados PostgreSQL + Auth + Storage
- **Edge Functions** (Deno) - Processamento server-side
- **Google Gemini AI** - Análise de documentos

### Qualidade
- **Vitest** - Testes unitários
- **ESLint** - Linting
- **Sentry** - Monitoramento de erros
- **TypeScript** - Tipagem estática

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou bun
- Conta no [Supabase](https://supabase.com)
- Chave da API do [Google AI (Gemini)](https://ai.google.dev)

### Configuração

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd health-beacon
```

2. **Instale as dependências**
```bash
npm install
# ou
bun install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:
```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-anon-key"
```

4. **Configure o Supabase**
- Crie um projeto no Supabase
- Execute as migrations em `supabase/migrations/`
- Configure a chave Gemini nas secrets das Edge Functions

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## 📖 Uso

### Primeiro Acesso
1. Acesse `http://localhost:3000`
2. Crie uma conta ou faça login com Google
3. Complete seu perfil com nome e data de nascimento

### Upload de Exames
1. Arraste um PDF ou imagem de exame para a área de upload
2. Aguarde o processamento pela IA (10-30 segundos)
3. Visualize os resultados extraídos automaticamente

### Dashboard
- **Score de Saúde**: Avaliação geral baseada nos seus exames
- **Tendências**: Veja quais marcadores estão melhorando ou piorando
- **Alertas**: Itens que requerem atenção médica

## 📁 Estrutura do Projeto

```
health-beacon/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   │   ├── ui/         # Componentes base (shadcn/ui)
│   │   └── skeletons/  # Loading states
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários e configurações
│   ├── pages/          # Páginas da aplicação
│   ├── types/          # Tipos TypeScript
│   └── integrations/   # Integrações externas (Supabase)
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Migrations do banco de dados
├── public/             # Assets estáticos
└── docs/               # Documentação adicional
```

## 🔒 Segurança

- **Row Level Security (RLS)**: Todas as tabelas têm políticas de acesso
- **Validação de Paciente**: Exames só são aceitos se o nome coincidir com o perfil
- **Links Expiráveis**: Compartilhamentos têm prazo de validade
- **Proteção contra senhas vazadas**: Integração com HaveIBeenPwned

## 📊 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run test         # Executar testes
npm run test:ui      # Testes com interface visual
npm run lint         # Verificar linting
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido com ❤️ para cuidar da sua saúde
</p>
