// Script para aplicar migrations via API do Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas!');
    console.log('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSql(sql, description) {
    console.log(`\n🔄 Executando: ${description}...`);

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // Tentar executar diretamente via REST API
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                },
                body: JSON.stringify({ sql_query: sql })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
        }

        console.log(`✅ ${description} - Concluído!`);
        return true;
    } catch (error) {
        console.error(`❌ Erro em ${description}:`, error.message);
        return false;
    }
}

async function applyMigrations() {
    console.log('🚀 Iniciando aplicação das migrations...\n');

    const migrations = [
        {
            file: 'supabase/migrations/20260128_marketplace_foundation.sql',
            description: 'Marketplace Foundation (Tabelas principais)'
        },
        {
            file: 'supabase/migrations/20260128_notification_triggers.sql',
            description: 'Notification Triggers'
        },
        {
            file: 'supabase/migrations/20260128_add_document_url.sql',
            description: 'Document URL Column'
        },
        {
            file: 'supabase/migrations/20260128_create_storage_bucket.sql',
            description: 'Storage Bucket'
        }
    ];

    let successCount = 0;

    for (const migration of migrations) {
        try {
            const filePath = join(__dirname, migration.file);
            const sql = readFileSync(filePath, 'utf8');

            const success = await executeSql(sql, migration.description);
            if (success) successCount++;

            // Pequeno delay entre migrations
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Erro ao ler ${migration.file}:`, error.message);
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Migrations aplicadas: ${successCount}/${migrations.length}`);
    console.log(`${'='.repeat(50)}\n`);

    if (successCount === migrations.length) {
        console.log('🎉 Todas as migrations foram aplicadas com sucesso!');
        console.log('\n📝 Próximos passos:');
        console.log('1. Configure a GEMINI_API_KEY no Supabase Dashboard');
        console.log('2. Faça deploy das Edge Functions');
        console.log('3. Teste a aplicação em http://localhost:3000');
    } else {
        console.log('⚠️  Algumas migrations falharam. Verifique os erros acima.');
    }
}

applyMigrations().catch(console.error);
