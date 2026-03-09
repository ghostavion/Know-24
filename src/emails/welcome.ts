interface WelcomeEmailProps {
  businessName: string;
  recipientName?: string;
  storefrontUrl: string;
}

export function renderWelcomeEmail(props: WelcomeEmailProps): string {
  const { businessName, recipientName, storefrontUrl } = props;
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #6366f1; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.3;">
                Welcome to ${businessName}!
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Thanks for joining <strong>${businessName}</strong>. We're thrilled to have you on board!
              </p>
              <p style="margin: 0 0 24px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Here's what you can look forward to:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 0 0 12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top; color: #6366f1; font-size: 16px; font-weight: 700;">1.</td>
                        <td style="color: #1f2937; font-size: 15px; line-height: 1.5;">Exclusive content and resources curated just for you</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 0 12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top; color: #6366f1; font-size: 16px; font-weight: 700;">2.</td>
                        <td style="color: #1f2937; font-size: 15px; line-height: 1.5;">New product announcements and updates</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 0 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top; color: #6366f1; font-size: 16px; font-weight: 700;">3.</td>
                        <td style="color: #1f2937; font-size: 15px; line-height: 1.5;">Tips, insights, and community highlights</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 0;">
                    <a href="${storefrontUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 6px; line-height: 1;">
                      Visit Our Storefront
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                Powered by <a href="https://know24.io" style="color: #6366f1; text-decoration: none;">Know24</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                <a href="{{unsubscribe_url}}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
