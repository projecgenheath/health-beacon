import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestRequest {
  frequency: 'weekly' | 'monthly';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { frequency }: DigestRequest = await req.json();
    console.log(`Sending ${frequency} digest emails...`);

    // Get users who have this digest frequency enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, digest_frequency')
      .eq('digest_frequency', frequency)
      .eq('email_notifications', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users with ${frequency} digest enabled`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to send digest to' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate date range based on frequency
    const now = new Date();
    const startDate = new Date();
    if (frequency === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }
    const startDateStr = startDate.toISOString().split('T')[0];

    const emailsSent: string[] = [];

    for (const profile of profiles) {
      // Get user email from auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
      
      if (authError || !authUser?.user?.email) {
        console.error(`Could not get email for user ${profile.user_id}:`, authError);
        continue;
      }

      const userEmail = authUser.user.email;

      // Get exam results for this user in the date range
      const { data: examResults, error: resultsError } = await supabase
        .from('exam_results')
        .select('name, value, unit, status, exam_date, reference_min, reference_max')
        .eq('user_id', profile.user_id)
        .gte('exam_date', startDateStr)
        .order('exam_date', { ascending: false });

      if (resultsError) {
        console.error(`Error fetching results for user ${profile.user_id}:`, resultsError);
        continue;
      }

      if (!examResults || examResults.length === 0) {
        console.log(`No exam results for user ${profile.user_id} in the period`);
        continue;
      }

      // Calculate summary
      const totalExams = examResults.length;
      const healthyCount = examResults.filter(r => r.status === 'healthy').length;
      const warningCount = examResults.filter(r => r.status === 'warning').length;
      const dangerCount = examResults.filter(r => r.status === 'danger').length;

      const periodText = frequency === 'weekly' ? 'últimos 7 dias' : 'último mês';
      const userName = profile.full_name || 'Usuário';

      // Build exam list HTML
      const examListHtml = examResults.slice(0, 10).map(exam => {
        const statusColor = exam.status === 'healthy' ? '#10b981' : 
                           exam.status === 'warning' ? '#f59e0b' : '#ef4444';
        const statusText = exam.status === 'healthy' ? 'Normal' : 
                          exam.status === 'warning' ? 'Atenção' : 'Alterado';
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${exam.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${exam.value} ${exam.unit}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(exam.exam_date).toLocaleDateString('pt-BR')}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📊 Resumo dos Seus Exames</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">${periodText}</p>
            </div>
            
            <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="color: #374151; font-size: 16px;">Olá, ${userName}!</p>
              <p style="color: #6b7280; font-size: 14px;">Aqui está o resumo dos seus exames nos ${periodText}:</p>
              
              <div style="display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 100px; background: #f0fdf4; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #10b981;">${healthyCount}</div>
                  <div style="font-size: 12px; color: #6b7280;">Normais</div>
                </div>
                <div style="flex: 1; min-width: 100px; background: #fffbeb; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${warningCount}</div>
                  <div style="font-size: 12px; color: #6b7280;">Atenção</div>
                </div>
                <div style="flex: 1; min-width: 100px; background: #fef2f2; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${dangerCount}</div>
                  <div style="font-size: 12px; color: #6b7280;">Alterados</div>
                </div>
              </div>

              <h3 style="color: #374151; font-size: 16px; margin-top: 24px;">Últimos Resultados</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Exame</th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Valor</th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Status</th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Data</th>
                  </tr>
                </thead>
                <tbody>
                  ${examListHtml}
                </tbody>
              </table>
              ${examResults.length > 10 ? `<p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 12px;">E mais ${examResults.length - 10} exames...</p>` : ''}

              <div style="margin-top: 32px; text-align: center;">
                <p style="color: #6b7280; font-size: 12px;">
                  Você está recebendo este email porque ativou o resumo ${frequency === 'weekly' ? 'semanal' : 'mensal'} nas suas preferências.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "HealthTrack <onboarding@resend.dev>",
          to: [userEmail],
          subject: `📊 Seu resumo ${frequency === 'weekly' ? 'semanal' : 'mensal'} de exames`,
          html: htmlContent,
        });

        console.log(`Digest email sent to ${userEmail}:`, emailResponse);
        emailsSent.push(userEmail);
      } catch (emailError) {
        console.error(`Failed to send digest to ${userEmail}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        recipients: emailsSent 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-digest function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
