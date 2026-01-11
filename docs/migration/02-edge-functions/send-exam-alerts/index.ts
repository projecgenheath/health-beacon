// =====================================================
// EDGE FUNCTION: send-exam-alerts
// Envia alertas por email quando há resultados alterados
// =====================================================
// SECRETS NECESSÁRIOS:
// - RESEND_API_KEY
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExamAlert {
  name: string;
  value: number;
  unit: string;
  status: 'warning' | 'danger';
  reference_min: number | null;
  reference_max: number | null;
}

interface AlertRequest {
  userEmail: string;
  userName?: string;
  alerts: ExamAlert[];
  examDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
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

    // IMPORTANTE: Substitua pelas URLs do seu projeto Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { alerts, examDate }: AlertRequest = await req.json();

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No alerts to send' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user notification preferences
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('email_notifications')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData && profileData.email_notifications === false) {
      console.log(`User ${user.id} has disabled email notifications, skipping`);
      return new Response(
        JSON.stringify({ message: 'Email notifications disabled by user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = user.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dangerAlerts = alerts.filter(a => a.status === 'danger');
    const warningAlerts = alerts.filter(a => a.status === 'warning');

    const alertRows = alerts.map(alert => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; font-weight: 500;">${alert.name}</td>
        <td style="padding: 12px; text-align: center;">
          <span style="color: ${alert.status === 'danger' ? '#dc2626' : '#d97706'}; font-weight: bold;">
            ${alert.value} ${alert.unit}
          </span>
        </td>
        <td style="padding: 12px; text-align: center; color: #6b7280;">
          ${alert.reference_min ?? '-'} - ${alert.reference_max ?? '-'}
        </td>
        <td style="padding: 12px; text-align: center;">
          <span style="
            background-color: ${alert.status === 'danger' ? '#fef2f2' : '#fffbeb'};
            color: ${alert.status === 'danger' ? '#dc2626' : '#d97706'};
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          ">
            ${alert.status === 'danger' ? 'Alterado' : 'Atenção'}
          </span>
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Alerta de Exames</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
                Alguns resultados do seu exame de ${examDate} precisam de atenção
              </p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              ${dangerAlerts.length > 0 ? `
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                  <strong style="color: #dc2626;">🔴 ${dangerAlerts.length} resultado(s) alterado(s)</strong>
                </div>
              ` : ''}
              
              ${warningAlerts.length > 0 ? `
                <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                  <strong style="color: #d97706;">🟡 ${warningAlerts.length} resultado(s) requer atenção</strong>
                </div>
              ` : ''}

              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Exame</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Valor</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Referência</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${alertRows}
                </tbody>
              </table>

              <div style="margin-top: 30px; padding: 16px; background-color: #f0f9ff; border-radius: 8px;">
                <p style="margin: 0; color: #0369a1; font-size: 14px;">
                  💡 <strong>Recomendação:</strong> Consulte um profissional de saúde para avaliar seus resultados.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                Este email foi enviado automaticamente pelo MeuExame.<br>
                Você recebeu este email porque habilitou as notificações de exames.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending alert email to ${userEmail} with ${alerts.length} alerts`);

    // IMPORTANTE: Configure seu domínio no Resend para usar um email personalizado
    // Por padrão, use onboarding@resend.dev para testes
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "MeuExame <onboarding@resend.dev>",
        to: [userEmail],
        subject: `⚠️ Alerta: ${dangerAlerts.length > 0 ? `${dangerAlerts.length} resultado(s) alterado(s)` : `${warningAlerts.length} resultado(s) requer atenção`}`,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending email:", emailData);
      throw new Error(emailData.message || 'Failed to send email');
    }

    console.log("Alert email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error("Error in send-exam-alerts function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
