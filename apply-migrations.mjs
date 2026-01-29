import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

// Obter credenciais do .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Construir connection string do Supabase
// Formato: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
const PROJECT_REF = 'nufifxcjujpjipoocvaz';

console.log('🔧 Para aplicar as migrations, você tem 2 opções:\n');

console.log('━'.repeat(60));
console.log('OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)');
console.log('━'.repeat(60));
console.log('1. Acesse: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
console.log('2. Copie o conteúdo de cada arquivo abaixo e execute:');
console.log('   - supabase/migrations/20260128_marketplace_foundation.sql');
console.log('   - supabase/migrations/20260128_notification_triggers.sql');
console.log('   - supabase/migrations/20260128_add_document_url.sql');
console.log('   - supabase/migrations/20260128_create_storage_bucket.sql');
console.log('3. Clique em "Run" para cada um\n');

console.log('━'.repeat(60));
console.log('OPÇÃO 2: Via Terminal (mais rápido)');
console.log('━'.repeat(60));
console.log('Execute no terminal:\n');
console.log('  npx supabase db push --db-url "postgresql://postgres:SUA_SENHA@db.' + PROJECT_REF + '.supabase.co:5432/postgres"\n');
console.log('Substitua SUA_SENHA pela sua senha do banco Supabase.');
console.log('Encontre em: https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database\n');

console.log('━'.repeat(60));
console.log('📁 Arquivos de Migration:');
console.log('━'.repeat(60));

const migrations = [
    'supabase/migrations/20260128_marketplace_foundation.sql',
    'supabase/migrations/20260128_notification_triggers.sql',
    'supabase/migrations/20260128_add_document_url.sql',
    'supabase/migrations/20260128_create_storage_bucket.sql'
];

migrations.forEach((file, index) => {
    try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        const size = (content.length / 1024).toFixed(1);
        console.log(`${index + 1}. ${file}`);
        console.log(`   ✓ ${lines} linhas, ${size} KB\n`);
    } catch (error) {
        console.log(`${index + 1}. ${file}`);
        console.log(`   ✗ Arquivo não encontrado\n`);
    }
});

console.log('━'.repeat(60));
console.log('⚡ ATALHO RÁPIDO:');
console.log('━'.repeat(60));
console.log('Abra este link e execute cada migration:');
console.log('https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new\n');
