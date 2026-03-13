interface OrderConfirmationEmailProps {
  businessName: string;
  customerName?: string;
  productTitle: string;
  amount: number; // cents
  currency: string;
  accessUrl: string;
  orderId: string;
}

function formatCurrency(amountInCents: number, currency: string): string {
  const dollars = (amountInCents / 100).toFixed(2);
  const symbol = currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase();
  return currency.toUpperCase() === "USD" ? `$${dollars}` : `${dollars} ${symbol}`;
}

export function renderOrderConfirmationEmail(props: OrderConfirmationEmailProps): string {
  const { businessName, customerName, productTitle, amount, currency, accessUrl, orderId } = props;
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
  const formattedAmount = formatCurrency(amount, currency);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation - ${orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0891b2; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.3;">
                Order Confirmed
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
                Thank you for your purchase from <strong>${businessName}</strong>! Your order has been confirmed.
              </p>
              <!-- Order Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                      Order ID
                    </p>
                    <p style="margin: 0 0 16px; color: #1f2937; font-size: 14px; font-family: monospace;">
                      ${orderId}
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e5e7eb;">
                      <tr>
                        <td style="padding: 16px 0 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="color: #1f2937; font-size: 16px; font-weight: 600; line-height: 1.5;">
                                ${productTitle}
                              </td>
                              <td align="right" style="color: #1f2937; font-size: 16px; font-weight: 700; line-height: 1.5;">
                                ${formattedAmount}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 0;">
                    <a href="${accessUrl}" style="display: inline-block; background-color: #0891b2; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 6px; line-height: 1;">
                      Access Your Purchase
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                If you have any questions, reply to this email and we'll be happy to help.
              </p>
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
