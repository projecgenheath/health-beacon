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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileUrl, fileName, examId } = await req.json();
    
    if (!fileUrl || !examId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fileUrl, examId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing exam: ${fileName} for user: ${user.id}`);

    // Fetch the file content
    const fileResponse = await fetch(fileUrl, {
      headers: { Authorization: authHeader }
    });
    
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file');
    }

    const fileBlob = await fileResponse.blob();
    const base64Content = await blobToBase64(fileBlob);
    const mimeType = fileBlob.type || 'application/pdf';

    // Use Lovable AI to extract exam data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling AI for OCR extraction...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert medical lab exam parser. Extract all exam results from the provided document image/PDF.
            
For each exam result, identify:
- name: The exam/test name (e.g., "Hemoglobina", "Glicose", "Colesterol Total")
- value: The numeric value (as a number)
- unit: The unit of measurement (e.g., "g/dL", "mg/dL", "U/L")
- reference_min: Minimum reference value (number or null if not available)
- reference_max: Maximum reference value (number or null if not available)
- category: Category like "Hematologia", "Bioquímica", "Hormônios", etc.
- status: "healthy" if within reference range, "warning" if slightly out, "danger" if significantly out

Also extract:
- lab_name: The laboratory name if visible
- exam_date: The exam date in YYYY-MM-DD format if visible

Return ONLY valid JSON in this exact format:
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
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all exam results from this medical lab document. Return only the JSON data, no additional text.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Content}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing...');

    // Parse the JSON response from AI
    let parsedData: ParsedExamData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse exam data from AI response');
    }

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update the exam record with extracted info
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
      console.error('Failed to update exam:', updateError);
      throw new Error('Failed to update exam record');
    }

    // Insert exam results
    if (parsedData.results && parsedData.results.length > 0) {
      // Filter out results with missing required fields and add defaults
      const validResults = parsedData.results.filter(result => 
        result.name && result.value !== undefined && result.value !== null
      );

      const examResults = validResults.map(result => ({
        exam_id: examId,
        user_id: user.id,
        name: result.name.trim(),
        value: Number(result.value) || 0,
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
        console.error('Failed to insert exam results:', insertError);
        throw new Error('Failed to save exam results');
      }

      console.log(`Successfully saved ${examResults.length} exam results`);

      // Check for warning or danger results and send email alerts
      const alertResults = parsedData.results.filter(r => r.status === 'warning' || r.status === 'danger');
      if (alertResults.length > 0) {
        console.log(`Found ${alertResults.length} results requiring attention, sending email alert...`);
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
          console.error('Failed to send email alert:', emailError);
          // Don't fail the whole request if email fails
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
    console.error('Error processing exam:', error);
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
