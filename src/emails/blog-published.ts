interface BlogPublishedEmailProps {
  businessName: string;
  recipientName?: string;
  postTitle: string;
  postExcerpt: string;
  postUrl: string;
}

export function renderBlogPublishedEmail(props: BlogPublishedEmailProps): string {
  const { businessName, recipientName, postTitle, postExcerpt, postUrl } = props;
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Post: ${postTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0891b2; padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 4px; color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500;">
                ${businessName}
              </p>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;">
                New Blog Post Published
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                We just published a new post we think you'll enjoy:
              </p>
              <!-- Post Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 12px; color: #1f2937; font-size: 20px; font-weight: 700; line-height: 1.3;">
                      ${postTitle}
                    </h2>
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ${postExcerpt}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 0;">
                    <a href="${postUrl}" style="display: inline-block; background-color: #0891b2; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 6px; line-height: 1;">
                      Read the Full Post
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
                Powered by <a href="https://know24.io" style="color: #0891b2; text-decoration: none;">Know24</a>
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
