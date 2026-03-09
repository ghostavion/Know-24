import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Know24",
  description:
    "Know24 Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Home
      </Link>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: March 2026
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li>
            <strong>Account information:</strong> Name, email address, and
            profile details provided through Clerk authentication.
          </li>
          <li>
            <strong>Business data:</strong> Business names, storefront
            configurations, product content, customer records, and transaction
            history that you create and manage on the platform.
          </li>
          <li>
            <strong>Payment information:</strong> Billing details processed
            securely through Stripe. Know24 does not directly store credit card
            numbers or bank account details.
          </li>
          <li>
            <strong>Usage analytics:</strong> Page views, feature usage
            patterns, session duration, and performance metrics collected to
            improve the platform experience.
          </li>
        </ul>

        <h2>2. How We Use Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>
            Provide, maintain, and improve the Know24 platform and its features
          </li>
          <li>
            Process payments, manage subscriptions, and facilitate creator
            payouts through Stripe Connect
          </li>
          <li>
            Analyze usage patterns to improve platform performance and user
            experience
          </li>
          <li>
            Send transactional notifications such as order confirmations,
            payment receipts, and account updates via email
          </li>
          <li>
            Provide AI-powered features, including the AI Advisor, marketing
            suggestions, and product recommendations
          </li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>
          Your data is stored in Supabase-managed PostgreSQL databases located
          in US-based data centers. All data is encrypted at rest using
          AES-256 encryption and in transit using TLS 1.2 or higher. File
          uploads and digital assets are stored on Cloudflare R2, which provides
          globally distributed, encrypted object storage. We implement
          row-level security (RLS) policies to ensure strict tenant isolation
          between businesses.
        </p>

        <h2>4. Third-Party Services</h2>
        <p>
          We use the following third-party services to operate the platform.
          Each service processes data in accordance with its own privacy policy:
        </p>
        <ul>
          <li>
            <strong>Clerk</strong> — Authentication and user management
          </li>
          <li>
            <strong>Stripe</strong> — Payment processing, subscription billing,
            and creator payouts
          </li>
          <li>
            <strong>Supabase</strong> — Database hosting and management
          </li>
          <li>
            <strong>OpenAI, Anthropic, and Google AI</strong> — AI-powered
            platform features (content generation, analysis, recommendations)
          </li>
          <li>
            <strong>Sentry</strong> — Error monitoring and performance tracking
          </li>
          <li>
            <strong>Vercel</strong> — Application hosting and analytics
          </li>
          <li>
            <strong>Resend</strong> — Transactional email delivery
          </li>
          <li>
            <strong>Cloudflare R2</strong> — File storage and content delivery
          </li>
        </ul>

        <h2>5. Data Sharing</h2>
        <p>
          We <strong>never sell your personal data</strong> to third parties. We
          share data only with the third-party processors listed above, solely
          for the purpose of operating the platform. We may also disclose
          information when required by law, regulation, legal process, or
          governmental request, or when we believe in good faith that disclosure
          is necessary to protect our rights, your safety, or the safety of
          others.
        </p>

        <h2>6. Cookies</h2>
        <p>
          Know24 uses essential cookies required for platform functionality,
          including authentication session management through Clerk. We also use
          Vercel Analytics for aggregated, privacy-friendly usage analytics.
          For more details, please see our{" "}
          <Link
            href="/legal/cookies"
            className="text-[#0891b2] hover:text-[#0e7490]"
          >
            Cookie Policy
          </Link>
          .
        </p>

        <h2>7. Your Rights</h2>
        <p>
          You have the following rights regarding your personal data:
        </p>
        <ul>
          <li>
            <strong>Access:</strong> Request a copy of the personal data we hold
            about you.
          </li>
          <li>
            <strong>Correction:</strong> Request correction of inaccurate or
            incomplete personal data.
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal data,
            subject to legal retention requirements.
          </li>
          <li>
            <strong>Data portability:</strong> Request an export of your data in
            a standard, machine-readable format.
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at the email
          address provided below.
        </p>

        <h2>8. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active and as
          needed to provide the Service. Upon account closure, we retain your
          data for up to 90 days to allow for account recovery or data export
          requests. After this 90-day period, all personal data and business
          content is permanently deleted from our systems and backups.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p>
          Know24 is not intended for use by individuals under the age of 18. We
          do not knowingly collect personal information from children. If we
          become aware that we have collected personal data from a child under
          18, we will take prompt steps to delete that information from our
          systems.
        </p>

        <h2>10. Changes to Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of material changes by posting the updated policy on the platform
          and updating the &quot;Last updated&quot; date above. We encourage you
          to review this policy periodically to stay informed about how we
          protect your data.
        </p>

        <h2>11. Contact</h2>
        <p>
          If you have any questions about this Privacy Policy or our data
          practices, please contact us at{" "}
          <a
            href="mailto:privacy@know24.io"
            className="text-[#0891b2] hover:text-[#0e7490]"
          >
            privacy@know24.io
          </a>
          .
        </p>
      </article>
    </section>
  );
}
