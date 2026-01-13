import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExamResult {
  name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  category: string;
  status: 'healthy' | 'warning' | 'danger';
}

interface ParsedExamData {
  lab_name: string | null;
  exam_date: string | null;
  results: ExamResult[];
}

function normalizeExamName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[–—−-]/g, ' ') // Replace all types of dashes with space
    .replace(/[^A-Z0-9\s]/g, ' ') // Keep only alphanumeric
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLocaleNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  // Replace comma with dot and remove any characters that aren't digits, dots, or minus signs
  const normalizedValue = value.replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(normalizedValue);
  return isNaN(parsed) ? 0 : parsed;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Unauthorized user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileUrl, fileName, examId } = await req.json();

    if (!fileUrl || !examId) {
      console.error('Missing required fields:', { fileUrl, examId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fileUrl, examId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing exam: ${fileName} (ID: ${examId}) for user: ${user.id}`);

    // Fetch the file content
    console.log(`Fetching file from: ${fileUrl}`);
    const fileResponse = await fetch(fileUrl, {
      headers: { Authorization: authHeader }
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error(`Failed to fetch file: ${fileResponse.status}`, errorText);
      throw new Error(`Failed to fetch file from storage: ${fileResponse.status}`);
    }

    const fileBlob = await fileResponse.blob();
    const base64Content = await blobToBase64(fileBlob);
    const mimeType = fileBlob.type || 'application/pdf';

    console.log(`File converted to Base64 (${base64Content.length} bytes), MimeType: ${mimeType}`);

    // --- DIRECT GEMINI API CALL ---
    const googleAIKey = Deno.env.get('CHAVE_API_DO_GOOGLE_AI') ?? Deno.env.get('GOOGLE_AI_API_KEY');
    if (!googleAIKey) {
      throw new Error('CHAVE_API_DO_GOOGLE_AI (or GOOGLE_AI_API_KEY) environment variable is not set');
    }

    console.log('Calling Gemini API for extraction...');

    const modelName = 'gemma-3-27b-it';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${googleAIKey}`;
    console.log(`Using model: ${modelName}`);


    const prompt = `You are an expert medical lab exam parser. Extract all exam results from the provided document.
    
Return ONLY valid JSON in this exact format, with no extra text or markdown:
{
  "lab_name": "string or null",
  "exam_date": "YYYY-MM-DD or null",
  "results": [
    {
      "name": "string",
      "value": number,
      "unit": "string",
      "reference_min": number or null,
      "reference_max": number or null,
      "category": "string",
      "status": "healthy" | "warning" | "danger"
    }
  ]
}

IMPORTANT:
1. Extract values exactly as they appear, but ensure they are represented as numbers in the JSON. If a value has a comma (like 1,05), treat it as a decimal (1.05).
2. For exam names, use a consistent name if possible (e.g., "Glicose", "Colesterol Total").
3. Look for the date of the exam (data de coleta or data de cadastro). Use YYYY-MM-DD format.
4. Determine status based on reference values: "healthy" if within range, "warning" if slightly out, "danger" if significantly out.`;

    // Use Google AI Direct API
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Content,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API error: ${geminiResponse.status}`, errorText);
      throw new Error(`AI extraction failed: ${geminiResponse.status}`);
    }

    const geminiResult = await geminiResponse.json();
    const content = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error('Empty response from AI:', JSON.stringify(geminiResult));
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing JSON...');
    console.log('Raw AI content:', content.substring(0, 500));

    // Parse the JSON response from AI
    let parsedData: ParsedExamData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Clean content for parsing:', cleanContent.substring(0, 500));
      parsedData = JSON.parse(cleanContent);
      console.log('Parsed data:', JSON.stringify(parsedData, null, 2).substring(0, 1000));
      console.log('Results count from AI:', parsedData.results?.length ?? 0);
    } catch (parseError) {
      console.error('Failed to parse AI JSON response:', content);
      throw new Error('Failed to parse exam data from AI response');
    }

    // Use service role for database operations
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!');
      throw new Error('Service role key not configured');
    }
    console.log('Service role key length:', serviceRoleKey.length);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    );

    // Update the exam record with extracted info (but not processed yet)
    console.log('Updating exam record with lab info...');
    const { error: updateError } = await supabaseAdmin
      .from('exams')
      .update({
        lab_name: parsedData.lab_name,
        exam_date: parsedData.exam_date
        // processed: true will be set AFTER results are inserted
      })
      .eq('id', examId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update exam table:', updateError);
      throw new Error('Failed to update exam record');
    }
    console.log('Exam record updated with lab info');

    // Insert exam results
    if (parsedData.results && parsedData.results.length > 0) {
      console.log(`Preparing to insert ${parsedData.results.length} results...`);
      // Filter out results with missing required fields and add defaults
      const validResults = parsedData.results.filter(result =>
        result.name && result.value !== undefined && result.value !== null
      );
      console.log(`After filtering: ${validResults.length} valid results`);

      const examResults = validResults.map(result => ({
        exam_id: examId,
        user_id: user.id,
        name: normalizeExamName(result.name),
        value: parseLocaleNumber(result.value),
        unit: result.unit?.trim() || '-',
        reference_min: result.reference_min ?? null,
        reference_max: result.reference_max ?? null,
        category: result.category?.trim() || 'Geral',
        status: result.status || 'healthy',
        exam_date: parsedData.exam_date || new Date().toISOString().split('T')[0]
      }));

      console.log('First result to insert:', JSON.stringify(examResults[0], null, 2));

      if (examResults.length === 0) {
        console.log('No valid exam results to save after mapping');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Exam processed but no valid results found',
            resultsCount: 0,
            rawResultsCount: parsedData.results.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Inserting ${examResults.length} results into exam_results table...`);
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('exam_results')
        .insert(examResults)
        .select();

      if (insertError) {
        console.error('Failed to insert results into exam_results table:', JSON.stringify(insertError, null, 2));
        throw new Error(`Failed to save exam results: ${insertError.message}`);
      }

      console.log(`Successfully inserted ${insertData?.length ?? 0} results`);

      // Now mark the exam as processed since results were saved
      console.log('Marking exam as processed...');
      const { error: markProcessedError } = await supabaseAdmin
        .from('exams')
        .update({ processed: true })
        .eq('id', examId)
        .eq('user_id', user.id);

      if (markProcessedError) {
        console.error('Failed to mark exam as processed:', markProcessedError);
      } else {
        console.log('Exam marked as processed successfully');
      }

      console.log(`Successfully saved ${examResults.length} exam results`);

      // Check for warning or danger results and send email alerts
      const alertResults = parsedData.results.filter(r => r.status === 'warning' || r.status === 'danger');
      if (alertResults.length > 0) {
        console.log(`Found ${alertResults.length} results requiring attention, sending alerts...`);
        try {
          const alertResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-exam-alerts`,
            {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                alerts: alertResults.map(r => ({
                  name: r.name,
                  value: r.value,
                  unit: r.unit,
                  status: r.status,
                  reference_min: r.reference_min,
                  reference_max: r.reference_max,
                })),
                examDate: parsedData.exam_date || new Date().toISOString().split('T')[0],
              }),
            }
          );
          const alertData = await alertResponse.json();
          console.log('Email alert response:', alertData);
        } catch (emailError) {
          console.error('Failed to call send-exam-alerts function:', emailError);
        }
      }
    } else {
      // No results from AI - still mark as processed
      console.log('No results returned from AI. Marking exam as processed anyway.');
      const { error: markProcessedError } = await supabaseAdmin
        .from('exams')
        .update({ processed: true })
        .eq('id', examId)
        .eq('user_id', user.id);

      if (markProcessedError) {
        console.error('Failed to mark exam as processed:', markProcessedError);
      } else {
        console.log('Exam marked as processed (no results)');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Exam processed successfully',
        resultsCount: parsedData.results?.length || 0,
        labName: parsedData.lab_name,
        examDate: parsedData.exam_date
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical Error in process-exam:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
