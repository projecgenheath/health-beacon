import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
    try {
        const { record } = await req.json();

        if (!record) {
            return new Response(
                JSON.stringify({ error: 'No record provided' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get exam request details
        const { data: examRequest, error: requestError } = await supabase
            .from('exam_requests')
            .select('*, patient:profiles!exam_requests_patient_id_fkey(*, user:auth.users(email))')
            .eq('id', record.exam_request_id)
            .single();

        if (requestError) throw requestError;

        // Get laboratory details
        const { data: laboratory, error: labError } = await supabase
            .from('profiles')
            .select('laboratory_name')
            .eq('id', record.laboratory_id)
            .single();

        if (labError) throw labError;

        // Get patient user_id for notification
        const patientUserId = examRequest.patient.user_id;

        // Create in-app notification
        const notification = {
            user_id: patientUserId,
            type: 'quotation_received',
            title: 'Novo Orçamento Recebido',
            message: `${laboratory.laboratory_name} enviou um orçamento de R$ ${record.total_price.toFixed(2)}`,
            link: `/patient/quotations`,
        };

        const { error: notifError } = await supabase
            .from('notifications')
            .insert(notification);

        if (notifError) {
            console.error('Error creating notification:', notifError);
        }

        // Send email if Resend API key is configured
        if (resendApiKey && examRequest.patient.user?.email) {
            const resend = new Resend(resendApiKey);
            const patientEmail = examRequest.patient.user.email;
            const items = record.items as Array<{ exam_name: string; price: number }>;

            try {
                await resend.emails.send({
                    from: 'BHB Marketplace <noreply@bhb.com>',
                    to: patientEmail,
                    subject: `Novo Orçamento de ${laboratory.laboratory_name}`,
                    html: `
            <h2>Você recebeu um novo orçamento!</h2>
            <p><strong>Laboratório:</strong> ${laboratory.laboratory_name}</p>
            <p><strong>Valor Total:</strong> R$ ${record.total_price.toFixed(2)}</p>
            
            <h3>Itens:</h3>
            <ul>
              ${items.map(item => `<li>${item.exam_name}: R$ ${item.price.toFixed(2)}</li>`).join('')}
            </ul>
            
            ${record.estimated_delivery_days ? `<p><strong>Prazo de Entrega:</strong> ${record.estimated_delivery_days} dias</p>` : ''}
            ${record.notes ? `<p><strong>Observações:</strong> ${record.notes}</p>` : ''}
            
            <p>Válido até: ${new Date(record.valid_until).toLocaleDateString('pt-BR')}</p>
            
            <p><a href="${supabaseUrl.replace('supabase.co', 'supabase.app')}/patient/quotations">Ver Orçamentos</a></p>
          `,
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
            }
        }

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in notify-quotation function:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
