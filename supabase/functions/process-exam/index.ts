import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de exame suportados
type ExamType = 'laboratory' | 'imaging' | 'pathology';

interface ExamResult {
  name: string;
  value?: number | null;           // Para exames laboratoriais
  text_value?: string | null;      // Para exames de imagem/patologia (laudos descritivos)
  unit?: string;
  reference_min?: number | null;
  reference_max?: number | null;
  category: string;
  status: 'healthy' | 'warning' | 'danger' | 'normal' | 'abnormal';
  exam_type?: ExamType;
  description?: string;            // Descrição detalhada do laudo
  conclusion?: string;             // Conclusão do médico
}

interface ParsedExamData {
  lab_name: string | null;
  exam_date: string | null;
  exam_type: ExamType;
  patient_name: string | null;     // Extracted patient name
  patient_dob: string | null;      // Extracted patient date of birth
  results: ExamResult[];
  general_conclusion?: string;     // Conclusão geral do exame
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

// Biological validation - detect impossible or highly unlikely values
interface ValidationResult {
  isValid: boolean;
  warning?: string;
  correctedValue?: number;
}

const BIOLOGICAL_LIMITS: Record<string, { min: number; max: number; unit?: string }> = {
  'GLICOSE': { min: 10, max: 800, unit: 'mg/dL' },
  'GLICEMIA': { min: 10, max: 800, unit: 'mg/dL' },
  'HEMOGLOBINA': { min: 3, max: 25, unit: 'g/dL' },
  'HEMATOCRITO': { min: 10, max: 70, unit: '%' },
  'COLESTEROL TOTAL': { min: 50, max: 600, unit: 'mg/dL' },
  'COLESTEROL': { min: 50, max: 600, unit: 'mg/dL' },
  'LDL': { min: 10, max: 400, unit: 'mg/dL' },
  'HDL': { min: 10, max: 150, unit: 'mg/dL' },
  'TRIGLICERIDES': { min: 20, max: 2000, unit: 'mg/dL' },
  'TRIGLICERÍDEOS': { min: 20, max: 2000, unit: 'mg/dL' },
  'CREATININA': { min: 0.1, max: 20, unit: 'mg/dL' },
  'UREIA': { min: 5, max: 300, unit: 'mg/dL' },
  'TGO': { min: 1, max: 2000, unit: 'U/L' },
  'AST': { min: 1, max: 2000, unit: 'U/L' },
  'TGP': { min: 1, max: 2000, unit: 'U/L' },
  'ALT': { min: 1, max: 2000, unit: 'U/L' },
  'TSH': { min: 0.01, max: 100, unit: 'mUI/L' },
  'T4 LIVRE': { min: 0.1, max: 10, unit: 'ng/dL' },
  'VITAMINA D': { min: 1, max: 200, unit: 'ng/mL' },
  'VITAMINA B12': { min: 50, max: 10000, unit: 'pg/mL' },
  'FERRITINA': { min: 1, max: 5000, unit: 'ng/mL' },
  'FERRO SERICO': { min: 5, max: 500, unit: 'µg/dL' },
  'HEMOGLOBINA GLICADA': { min: 3, max: 20, unit: '%' },
  'HBA1C': { min: 3, max: 20, unit: '%' },
  'PLAQUETAS': { min: 10000, max: 1000000, unit: '/mm³' },
  'LEUCOCITOS': { min: 500, max: 100000, unit: '/mm³' },
  'LEUCÓCITOS': { min: 500, max: 100000, unit: '/mm³' },
  'ACIDO URICO': { min: 0.5, max: 20, unit: 'mg/dL' },
  'CALCIO': { min: 5, max: 20, unit: 'mg/dL' },
  'SODIO': { min: 100, max: 180, unit: 'mEq/L' },
  'POTASSIO': { min: 2, max: 10, unit: 'mEq/L' },
};

// Retry with exponential backoff for API calls
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
  retryableStatuses: [429, 503, 500, 502, 504],
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`API call attempt ${attempt + 1}/${config.maxRetries + 1}...`);

      const response = await fetch(url, options);

      // If successful or non-retryable error, return immediately
      if (response.ok || !config.retryableStatuses.includes(response.status)) {
        return response;
      }

      // Log the retryable error
      const errorText = await response.text();
      console.warn(`Retryable error (${response.status}): ${errorText}`);

      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw new Error(`API request failed after ${config.maxRetries + 1} attempts: ${response.status} - ${errorText}`);
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 500; // Add up to 500ms of random jitter
      const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);

      console.log(`Waiting ${Math.round(delay)}ms before retry...`);
      await sleep(delay);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw
      if (attempt === config.maxRetries) {
        throw lastError;
      }

      // Calculate delay for network errors
      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        config.maxDelayMs
      );

      console.warn(`Network error on attempt ${attempt + 1}: ${lastError.message}. Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown error during retry');
}

function validateBiologicalValue(examName: string, value: number): ValidationResult {
  const normalizedName = examName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Find matching limit
  for (const [key, limits] of Object.entries(BIOLOGICAL_LIMITS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      if (value < limits.min || value > limits.max) {
        console.warn(`⚠️ Value validation warning: ${examName} = ${value} is outside biological range [${limits.min}-${limits.max}]`);
        return {
          isValid: false,
          warning: `Value ${value} for ${examName} is outside expected range [${limits.min}-${limits.max}]`,
        };
      }
      break;
    }
  }

  // Check for obviously wrong values (negative for most exams, extremely high values)
  if (value < 0) {
    console.warn(`⚠️ Negative value detected for ${examName}: ${value}`);
    return {
      isValid: false,
      warning: `Negative value ${value} for ${examName}`,
      correctedValue: Math.abs(value),
    };
  }

  if (value > 1000000) {
    console.warn(`⚠️ Extremely high value detected for ${examName}: ${value}`);
    return {
      isValid: false,
      warning: `Extremely high value ${value} for ${examName}`,
    };
  }

  return { isValid: true };
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header starts with:', authHeader?.substring(0, 30) + '...');

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
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

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


    const prompt = `You are an expert medical document parser. Analyze the provided document and extract all medical exam information.

FIRST, identify the type of exam:
- "laboratory": Blood tests, urine tests, biochemistry, hematology, immunology, serology (HIV, Hepatitis), etc.
- "imaging": X-rays, CT scans, MRI, Ultrasound, Mammography, etc. (descriptive reports)
- "pathology": Biopsies, cytology, histopathology, etc. (descriptive findings)

Return ONLY valid JSON in this exact format, with no extra text or markdown:
{
  "lab_name": "string or null",
  "exam_date": "YYYY-MM-DD or null",
  "patient_name": "string or null (full name of the patient as written in the doc)",
  "patient_dob": "YYYY-MM-DD or null (patient date of birth if found)",
  "exam_type": "laboratory" | "imaging" | "pathology",
  "general_conclusion": "string or null (overall conclusion if available)",
  "results": [
    {
      "name": "string (exam name)",
      "value": number or null (ONLY for quantitative results),
      "text_value": "string or null (for qualitative results like 'Non-Reactive', 'Negative', 'Detected' OR imaging findings)",
      "unit": "string or null",
      "reference_min": number or null,
      "reference_max": number or null,
      "category": "string (e.g., 'Hematologia', 'Imunologia', 'Hormônios')",
      "status": "healthy" | "warning" | "danger" | "normal" | "abnormal",
      "exam_type": "laboratory" | "imaging" | "pathology",
      "description": "string or null",
      "conclusion": "string or null"
    }
  ]
}

RULES:
1. For LABORATORY exams:
   - If numeric: Use "value" field (e.g., Glucose: 90).
   - If qualitative (Text): Use "text_value" field (e.g., HIV: "Non-Reactive", Blood Type: "A+").
   - Set "status":
     - "healthy"/"normal": for "Non-Reactive", "Negative", "Undetected", "Within limits".
     - "warning"/"abnormal": for "Reactive", "Positive", "Detected" (unless expected).
   - Convert numeric commas to dots: 1,05 → 1.05

2. For IMAGING exams:
   - Use "text_value" for the findings.
   - Use "description" for details.

3. For PATHOLOGY exams:
   - Use "text_value" for the diagnosis.

4. Extract the exam date, laboratory name, patient name and DOB.`;


    // Use Google AI Direct API with retry
    const geminiResponse = await fetchWithRetry(geminiUrl, {
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

    // --- PATIENT VALIDATION ---
    console.log('Validating patient data...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, birth_date')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    } else if (profile && (profile.full_name || profile.birth_date)) {
      const normalizedProfileName = profile.full_name ? normalizeExamName(profile.full_name) : null;
      const normalizedExtractedName = parsedData.patient_name ? normalizeExamName(parsedData.patient_name) : null;

      const profileDob = profile.birth_date;
      const extractedDob = parsedData.patient_dob;

      let nameMatches = true;
      let dobMatches = true;

      if (normalizedProfileName && normalizedExtractedName) {
        // Simple comparison, we could use Levenshtein distance for more robust matching if needed
        nameMatches = normalizedExtractedName.includes(normalizedProfileName) ||
          normalizedProfileName.includes(normalizedExtractedName);

        // If no direct includes, check if major parts overlap
        if (!nameMatches) {
          const profileParts = normalizedProfileName.split(' ').filter(p => p.length > 2);
          const extractedParts = normalizedExtractedName.split(' ').filter(p => p.length > 2);
          const matchingParts = profileParts.filter(part => extractedParts.includes(part));
          nameMatches = matchingParts.length >= 2; // At least two significant name parts match
        }
      }

      if (profileDob && extractedDob) {
        dobMatches = profileDob === extractedDob;
      }

      console.log(`Validation results: Name match: ${nameMatches}, DOB match: ${dobMatches}`);
      console.log(`Profile: ${profile.full_name} (${profileDob}), Extracted: ${parsedData.patient_name} (${extractedDob})`);

      if (!nameMatches || !dobMatches) {
        // If it's a clear mismatch, we stop here
        console.error('Patient mismatch detected!');
        return new Response(
          JSON.stringify({
            error: 'Documento não pertence ao paciente cadastrado.',
            details: {
              name_match: nameMatches,
              dob_match: dobMatches,
              detected_patient: parsedData.patient_name,
              detected_dob: parsedData.patient_dob
            }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('User profile incomplete, skipping patient validation or allowing it.');
    }

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
      console.log(`Exam type detected: ${parsedData.exam_type || 'laboratory'}`);

      // Filter out results with missing required fields - accept either value OR text_value
      const validResults = parsedData.results.filter(result =>
        result.name && (
          (result.value !== undefined && result.value !== null) ||
          (result.text_value !== undefined && result.text_value !== null)
        )
      );
      console.log(`After filtering: ${validResults.length} valid results`);

      const examResults = validResults.map(result => {
        // Determine if this is a numeric or text-based result
        const isNumeric = result.value !== undefined && result.value !== null;
        const examType = result.exam_type || parsedData.exam_type || 'laboratory';

        // Parse the value
        let parsedValue = isNumeric ? parseLocaleNumber(result.value ?? 0) : 0;

        // Validate biological plausibility for numeric results
        if (isNumeric && parsedValue > 0) {
          const validation = validateBiologicalValue(result.name, parsedValue);
          if (!validation.isValid) {
            console.warn(`⚠️ Validation warning for ${result.name}: ${validation.warning}`);
            // Use corrected value if available
            if (validation.correctedValue !== undefined) {
              parsedValue = validation.correctedValue;
            }
          }
        }

        return {
          exam_id: examId,
          user_id: user.id,
          name: normalizeExamName(result.name),
          // For numeric results, use the value; for text results, use 0 as placeholder
          value: parsedValue,
          // Store the text value for imaging/pathology exams
          text_value: result.text_value?.trim() || null,
          unit: result.unit?.trim() || (isNumeric ? '-' : null),
          reference_min: result.reference_min ?? null,
          reference_max: result.reference_max ?? null,
          category: result.category?.trim() || 'Geral',
          status: result.status || (isNumeric ? 'healthy' : 'normal'),
          exam_type: examType,
          description: result.description?.trim() || null,
          conclusion: result.conclusion?.trim() || null,
          exam_date: parsedData.exam_date || new Date().toISOString().split('T')[0]
        };
      });


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
