import { Resend } from 'resend';

// Initialize Resend with API key
// If key is missing, email service will be disabled
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'alerts@yeetpdf.com';

let resend = null;
if (RESEND_API_KEY) {
    resend = new Resend(RESEND_API_KEY);
    console.log('[EMAIL] Service initialized');
} else {
    console.warn('[EMAIL] RESEND_API_KEY missing. Email alerts disabled.');
}

// Cooldown tracker to prevent spam
// Map<documentId, timestamp>
const alertCooldowns = new Map();
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/**
 * Send an alert email to the document owner
 * 
 * @param {string} email - Recipient email
 * @param {string} documentId - Document ID
 * @param {string} documentName - Document name
 * @param {object} metadata - Additional info (location, device, etc)
 */
export async function sendViewAlert(email, documentId, documentName, metadata = {}) {
    if (!resend) return;
    if (!email) return;

    // Check cooldown
    const lastSent = alertCooldowns.get(documentId);
    const now = Date.now();
    if (lastSent && (now - lastSent) < COOLDOWN_MS) {
        console.log('[EMAIL] Alert suppressed by cooldown:', documentId);
        return;
    }

    // Update cooldown immediately to prevent race conditions
    alertCooldowns.set(documentId, now);

    const { city, country, device } = metadata;
    const locationStr = city && country ? `${city}, ${country}` : 'Unknown Location';
    const timeStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }); // Default to EST or use UTC

    try {
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: email, // In test mode, this must be YOUR verification email
            subject: `🔔 New View: ${documentName}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your document was just viewed!</h2>
          <p><strong>Document:</strong> ${documentName}</p>
          
          <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;">📍 <strong>Location:</strong> ${locationStr}</p>
            <p style="margin: 5px 0;">📱 <strong>Device:</strong> ${device || 'Unknown'}</p>
            <p style="margin: 5px 0;">🕒 <strong>Time:</strong> ${timeStr}</p>
          </div>

          <a href="${process.env.FRONTEND_URL}/analytics/${documentId}" 
             style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Analytics
          </a>
        </div>
      `,
        });

        if (error) {
            console.error('[EMAIL] Failed to send alert:', error);
            // clear cooldown so we can try again
            alertCooldowns.delete(documentId);
        } else {
            console.log('[EMAIL] Alert sent for:', documentId, 'ID:', data.id);
        }
    } catch (err) {
        console.error('[EMAIL] Exception sending email:', err);
        alertCooldowns.delete(documentId);
    }
}
