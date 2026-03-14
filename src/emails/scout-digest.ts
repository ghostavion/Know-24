interface ScoutOpportunity {
  platform: string;
  title: string;
  url: string;
  relevanceScore: number;
}

interface ScoutDigestEmailProps {
  businessName: string;
  recipientName?: string;
  opportunities: ScoutOpportunity[];
  dashboardUrl: string;
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    reddit: "#ff4500",
    twitter: "#1da1f2",
    quora: "#b92b27",
    linkedin: "#0a66c2",
    youtube: "#ff0000",
    hackernews: "#ff6600",
  };
  return colors[platform.toLowerCase()] ?? "#7C3AED";
}

function renderRelevanceBadge(score: number): string {
  let color: string;
  let label: string;
  if (score >= 0.8) {
    color = "#059669";
    label = "High";
  } else if (score >= 0.5) {
    color = "#d97706";
    label = "Medium";
  } else {
    color = "#6b7280";
    label = "Low";
  }
  const percentage = Math.round(score * 100);
  return `<span style="display: inline-block; background-color: ${color}; color: #ffffff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; line-height: 1.4;">${label} (${percentage}%)</span>`;
}

function renderOpportunityRow(opportunity: ScoutOpportunity): string {
  const platformColor = getPlatformColor(opportunity.platform);
  return `<tr>
    <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="vertical-align: top; width: 100%;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <span style="display: inline-block; background-color: ${platformColor}; color: #ffffff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.4;">${opportunity.platform}</span>
                  &nbsp;
                  ${renderRelevanceBadge(opportunity.relevanceScore)}
                </td>
              </tr>
              <tr>
                <td style="padding-top: 8px;">
                  <a href="${opportunity.url}" style="color: #1f2937; font-size: 15px; font-weight: 600; text-decoration: none; line-height: 1.4;">
                    ${opportunity.title}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function renderScoutDigestEmail(props: ScoutDigestEmailProps): string {
  const { businessName, recipientName, opportunities, dashboardUrl } = props;
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const opportunityRows = opportunities.map(renderOpportunityRow).join("");
  const count = opportunities.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Scout Digest - ${businessName}</title>
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
                ${businessName} Scout
              </p>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;">
                Your Opportunity Digest
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
                Scout found <strong>${count} ${count === 1 ? "opportunity" : "opportunities"}</strong> that match your expertise. Here's a summary:
              </p>
              <!-- Opportunities List -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${opportunityRows}
              </table>
              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 32px 0 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #7C3AED; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 6px; line-height: 1;">
                      View All in Dashboard
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
