interface RecommendedProduct {
  title: string;
  description: string;
  price: number; // cents
  currency: string;
  url: string;
}

interface ProductRecommendationEmailProps {
  businessName: string;
  customerName?: string;
  products: RecommendedProduct[];
}

function formatCurrency(amountInCents: number, currency: string): string {
  const dollars = (amountInCents / 100).toFixed(2);
  const symbol = currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase();
  return currency.toUpperCase() === "USD" ? `$${dollars}` : `${dollars} ${symbol}`;
}

function renderProductCard(product: RecommendedProduct): string {
  const formattedPrice = formatCurrency(product.price, product.currency);
  return `<tr>
    <td style="padding: 0 0 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 20px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 17px; font-weight: 700; line-height: 1.3;">
                    ${product.title}
                  </h3>
                  <p style="margin: 0 0 12px; color: #4b5563; font-size: 14px; line-height: 1.5;">
                    ${product.description}
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="vertical-align: middle;">
                        <span style="color: #1f2937; font-size: 18px; font-weight: 700;">${formattedPrice}</span>
                      </td>
                      <td align="right" style="vertical-align: middle;">
                        <a href="${product.url}" style="display: inline-block; background-color: #7C3AED; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 6px; line-height: 1;">
                          View Product
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function renderProductRecommendationEmail(props: ProductRecommendationEmailProps): string {
  const { businessName, customerName, products } = props;
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
  const productCards = products.map(renderProductCard).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recommended for You - ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #7C3AED; padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 4px; color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500;">
                ${businessName}
              </p>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;">
                Picked Just for You
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
                Based on your interests, we think you'll love these products from <strong>${businessName}</strong>:
              </p>
              <!-- Product Cards -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${productCards}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                Powered by <a href="https://agenttv.live" style="color: #7C3AED; text-decoration: none;">AgentTV</a>
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
