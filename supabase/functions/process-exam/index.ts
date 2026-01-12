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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b:generateContent?key=${googleAIKey}`;
    console.log(`Using model: gemma-3-27b`);

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
        generationConfig: {
          responseMimeType: "application/json",
        },
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

    // Parse the JSON response from AI
    let parsedData: ParsedExamData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI JSON response:', content);
      throw new Error('Failed to parse exam data from AI response');
    }

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update the exam record with extracted info
    console.log('Updating exam record in database...');
    const { error: updateError } = await supabaseAdmin
      .from('exams')
      .update({
        lab_name: parsedData.lab_name,
        exam_date: parsedData.exam_date,
        processed: true
      })
      .eq('id', examId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update exam table:', updateError);
      throw new Error('Failed to update exam record');
    }

    // Insert exam results
    if (parsedData.results && parsedData.results.length > 0) {
      console.log(`Preparing to insert ${parsedData.results.length} results...`);
      // Filter out results with missing required fields and add defaults
      const validResults = parsedData.results.filter(result =>
        result.name && result.value !== undefined && result.value !== null
      );

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

      if (examResults.length === 0) {
        console.log('No valid exam results to save');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Exam processed but no valid results found',
            resultsCount: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: insertError } = await supabaseAdmin
        .from('exam_results')
        .insert(examResults);

      if (insertError) {
        console.error('Failed to insert results into exam_results table:', insertError);
        throw new Error('Failed to save exam results');
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
