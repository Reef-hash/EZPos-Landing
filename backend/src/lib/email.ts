import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const PORTAL_URL = process.env.PORTAL_URL ?? 'https://ez-pos-landing.vercel.app/portal/login';

export interface LicenseEmailParams {
  to: string;
  customerName: string;
  product: string;
  planName: string;
  licenseKey: string;
  expiresAt: string;
}

export async function sendLicenseEmail(params: LicenseEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping license email to', params.to);
    return;
  }

  const { to, customerName, product, planName, licenseKey, expiresAt } = params;
  const productLabel = product === 'ezpos' ? 'EZPos Desktop' : 'CrossxPos';
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your ${productLabel} License — Thank You!`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#2563eb">Thank you, ${customerName}!</h2>
  <p>Your purchase was successful. Here are your license details:</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr style="background:#f1f5f9">
      <td style="padding:10px 12px;font-weight:bold;width:140px">Product</td>
      <td style="padding:10px 12px">${productLabel}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;font-weight:bold">Plan</td>
      <td style="padding:10px 12px">${planName}</td>
    </tr>
    <tr style="background:#f1f5f9">
      <td style="padding:10px 12px;font-weight:bold">License Key</td>
      <td style="padding:10px 12px;font-family:monospace;font-size:15px;letter-spacing:1px;color:#1d4ed8">
        <strong>${licenseKey}</strong>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 12px;font-weight:bold">Valid Until</td>
      <td style="padding:10px 12px">${expiryDate}</td>
    </tr>
  </table>

  <p>Keep this email safe — you'll need the license key to activate the software.</p>

  <a href="${PORTAL_URL}"
     style="display:inline-block;margin-top:12px;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
    View My Licenses
  </a>

  <p style="margin-top:24px;font-size:13px;color:#64748b">
    If you have any issues, contact us at support@ezpos.my
  </p>
</body>
</html>
    `.trim(),
  });

  console.log('[email] License email sent to', to);
}

export interface EntitlementEmailParams {
  to: string;
  customerName: string;
  product: string;
  action: 'suspended' | 'reinstated' | 'revoked';
}

export async function sendEntitlementStatusEmail(params: EntitlementEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const { to, customerName, product, action } = params;
  const productLabel = product === 'ezpos' ? 'EZPos Desktop' : 'CrossxPos';

  const messages: Record<typeof action, { subject: string; body: string }> = {
    suspended: {
      subject: `Your ${productLabel} license has been suspended`,
      body: `Your ${productLabel} license has been temporarily suspended due to a payment issue. Please update your payment method to restore access.`,
    },
    reinstated: {
      subject: `Your ${productLabel} license has been reinstated`,
      body: `Good news! Your ${productLabel} license has been reinstated and is now active again.`,
    },
    revoked: {
      subject: `Your ${productLabel} license has been cancelled`,
      body: `Your ${productLabel} license has been cancelled. If you believe this is an error, please contact support.`,
    },
  };

  const msg = messages[action];

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: msg.subject,
    html: `
<body style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:0 auto;padding:24px">
  <h2>Hi ${customerName},</h2>
  <p>${msg.body}</p>
  <a href="${PORTAL_URL}"
     style="display:inline-block;margin-top:12px;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
    View My Licenses
  </a>
  <p style="margin-top:24px;font-size:13px;color:#64748b">support@ezpos.my</p>
</body>
    `.trim(),
  });
}
