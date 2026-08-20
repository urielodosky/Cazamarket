import { Resend } from 'resend';
import { getPostHogClient } from './tracking';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

interface ErrorContext {
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'ERROR';
  action: string;
  [key: string]: any;
}

export const handleCriticalError = async (error: Error | any, userId: string | null, context: ErrorContext) => {
  console.error(`[${context.severity}] Error in ${context.action}:`, error);

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';

  try {
    // 1. Log to system_logs table
    await supabaseAdmin.from('system_logs').insert({
      user_id: userId,
      level: context.severity,
      action: context.action,
      message: errorMessage,
      context: { stack: errorStack, ...context }
    });

    // 2. PostHog Forensic Analytics
    const phClient = getPostHogClient();
    phClient.capture({
      distinctId: userId || 'anonymous',
      event: context.severity === 'CRITICAL' ? 'security_breach' : 'critical_error_captured',
      properties: {
        error_message: errorMessage,
        stack: errorStack,
        ...context
      }
    });

    // 3. In-App Notifications & Email for CRITICAL errors
    if (context.severity === 'CRITICAL' || context.severity === 'ERROR') {
      // Find superadmins
      const { data: superadmins } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('is_superadmin', true);

      if (superadmins && superadmins.length > 0) {
        // Send In-App Notifications
        const notifications = superadmins.map(admin => ({
          user_id: admin.id,
          type: 'system',
          title: `[${context.severity}] Fallo en ${context.action}`,
          message: `Se detectó un error crítico: ${errorMessage}. Revisa el log de sistema para más detalles.`,
          is_read: false
        }));

        await supabaseAdmin.from('notifications').insert(notifications);

        // Send Email using Resend
        if (context.severity === 'CRITICAL' && process.env.RESEND_API_KEY) {
          const adminAlertEmail = process.env.ADMIN_ALERT_EMAIL || superadmins[0].email;
          
          if (adminAlertEmail) {
            await resend.emails.send({
              from: 'CazaMarket System <alertas@cazamarket.com>', // Update with verified domain
              to: [adminAlertEmail],
              subject: `🚨 ALERTA CRÍTICA: Fallo en ${context.action}`,
              html: `
                <div style="font-family: sans-serif; padding: 20px;">
                  <h2 style="color: #ef4444;">Alerta de Seguridad/Sistema</h2>
                  <p><strong>Nivel:</strong> CRITICAL</p>
                  <p><strong>Acción:</strong> ${context.action}</p>
                  <p><strong>Usuario Afectado:</strong> ${userId || 'N/A'}</p>
                  <p><strong>Mensaje de Error:</strong></p>
                  <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${errorMessage}</pre>
                  <p>Revisa el panel de administrador para más detalles.</p>
                </div>
              `
            }).catch(e => console.error("Error sending Resend email:", e));
          }
        }
      }
    }
  } catch (secondaryError) {
    console.error("Error in handleCriticalError execution:", secondaryError);
  }
};
