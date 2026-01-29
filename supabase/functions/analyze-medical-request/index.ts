import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
    try {
        const { filePath } = await req.json();

        if (!filePath) {
            return new Response(
                JSON.stringify({ error: 'No file path provided' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Download the file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('exam-requests')
            .download(filePath);

        if (downloadError) throw downloadError;

        // Convert file to base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // Determine file type
        const fileType = filePath.toLowerCase().endsWith('.pdf')
            ? 'application/pdf'
            : 'image/jpeg';

        // Call Gemini API to analyze the medical request
        if (!geminiApiKey) {
            // Fallback: return mock data for testing
            console.warn('GEMINI_API_KEY not configured, using mock response');
            return new Response(
                JSON.stringify({
                    exams: [
                        'Hemograma Completo',
                        'Glicemia em Jejum',
                        'Colesterol Total e Frações',
                        'Triglicerídeos',
                        'Ureia',
                        'Creatinina'
                    ]
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Você é um assistente médico especializado em análise de pedidos de exames laboratoriais.

Analise o pedido médico fornecido e extraia TODOS os exames solicitados.

IMPORTANTE:
- Liste APENAS os nomes dos exames solicitados
- NÃO inclua informações do paciente, médico, data, etc.
- Use os nomes técnicos corretos dos exames
- Se houver abreviações médicas, use o nome completo
- Retorne em formato de lista simples, um exame por linha
- Não inclua numeração ou marcadores

Exemplos de exames comuns:
- Hemograma Completo
- Glicemia em Jejum
- Colesterol Total e Frações (HDL, LDL, VLDL)
- Triglicerídeos
- TSH (Hormônio Tireoestimulante)
- T4 Livre
- Ureia
- Creatinina
- TGO (AST)
- TGP (ALT)
- Gama GT
- Ácido Úrico
- Proteínas Totais e Frações

Agora analise o pedido médico e liste os exames:`
                            },
                            {
                                inline_data: {
                                    mime_type: fileType,
                                    data: base64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 1000,
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        const extractedText = geminiData.candidates[0]?.content?.parts[0]?.text || '';

        // Parse the extracted exams
        const exams = extractedText
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0 && !line.startsWith('-') && !line.match(/^\d+\./))
            .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
            .filter((line: string) => line.length > 3); // Filter out very short lines

        console.log('Extracted exams:', exams);

        return new Response(
            JSON.stringify({ exams }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error analyzing medical request:', error);
        return new Response(
            JSON.stringify({
                error: error.message,
                exams: [] // Return empty array on error
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
