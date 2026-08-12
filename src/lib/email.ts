/**
 * Email Service
 * 
 * TODO: Integrate Resend API here in the future.
 * Currently, this just logs the email to the console to simulate sending.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('\n======================================================');
  console.log('📧 SIMULATED EMAIL SENT');
  console.log('======================================================');
  console.log(`To:      ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log('------------------------------------------------------');
  console.log('HTML Body:');
  console.log(options.html);
  if (options.text) {
    console.log('\nText Body:');
    console.log(options.text);
  }
  console.log('======================================================\n');
  
  // En el futuro:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ ...options, from: 'CazaMarket <no-reply@cazamarket.com>' });

  return true; // Simulate success
}
