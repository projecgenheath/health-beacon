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

        // Get patient profile with location
        const { data: patientProfile, error: patientError } = await supabase
            .from('profiles')
            .select('*, user:auth.users(email)')
            .eq('id', record.patient_id)
            .single();

        if (patientError) throw patientError;

        // Get nearby laboratories (within 50km)
        let laboratories = [];
        if (patientProfile.latitude && patientProfile.longitude) {
            const { data, error } = await supabase
                .rpc('get_nearby_laboratories', {
                    patient_lat: patientProfile.latitude,
                    patient_lon: patientProfile.longitude,
                    max_distance_km: 50
                });

            if (!error && data) {
                laboratories = data;
            }
        } else {
            // If patient has no location, notify all laboratories
            const { data, error } = await supabase
                .from('profiles')
                .select('id, laboratory_name, user_id')
                .eq('user_type', 'laboratory');

            if (!error && data) {
                laboratories = data;
            }
        }

        console.log(`Found ${laboratories.length} laboratories to notify`);

        // Create in-app notifications for laboratories
        const notifications = laboratories.map(lab => ({
            user_id: lab.user_id,
            type: 'exam_request',
            title: 'Novo Pedido de Exame',
            message: `Novo pedido de exame disponível: ${record.exam_types.join(', ')}`,
            link: `/laboratory/requests`,
        }));

        if (notifications.length > 0) {
            const { error: notifError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notifError) {
                console.error('Error creating notifications:', notifError);
            }
        }

        // Send emails if Resend API key is configured
        if (resendApiKey && laboratories.length > 0) {
            const resend = new Resend(resendApiKey);

            // Get laboratory user emails
            const labUserIds = laboratories.map(l => l.user_id);
            const { data: labUsers, error: usersError } = await supabase.auth.admin.listUsers();

            if (!usersError && labUsers) {
                const emails = labUsers.users
                    .filter(u => labUserIds.includes(u.id))
                    .map(u => u.email)
                    .filter(Boolean);

                for (const email of emails) {
                    try {
                        await resend.emails.send({
                            from: 'BHB Marketplace <noreply@bhb.com>',
                            to: email,
                            subject: 'Novo Pedido de Exame Disponível',
                            html: `
                <h2>Novo Pedido de Exame</h2>
                <p>Um novo pedido de exame está disponível para orçamento:</p>
                <ul>
                  ${record.exam_types.map((exam: string) => `<li>${exam}</li>`).join('')}
                </ul>
                <p><strong>Urgência:</strong> ${record.urgency_level === 'emergency' ? 'Emergência' : record.urgency_level === 'urgent' ? 'Urgente' : 'Normal'}</p>
                ${record.description ? `<p><strong>Observações:</strong> ${record.description}</p>` : ''}
                <p><a href="${supabaseUrl.replace('supabase.co', 'supabase.app')}/laboratory/requests">Acessar Sistema</a></p>
              `,
                        });
                    } catch (emailError) {
                        console.error(`Error sending email to ${email}:`, emailError);
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                notified: laboratories.length
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in notify-exam-request function:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
