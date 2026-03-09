import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Know24",
  description:
    "Know24 Terms of Service — the rules and regulations governing your use of the platform.",
};

export default function TermsOfServicePage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Home
      </Link>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: March 2026
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Know24 platform (&quot;Service&quot;), you
          agree to be bound by these Terms of Service (&quot;Terms&quot;). If you
          do not agree to these Terms, you may not access or use the Service. We
          reserve the right to update these Terms at any time, and your continued
          use of the Service constitutes acceptance of any changes.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Know24 is a software-as-a-service (SaaS) platform designed for
          knowledge businesses. The platform enables subject matter experts to
          create, manage, and sell digital knowledge products through branded
          storefronts. The core subscription is $99 per month, which includes
          unlimited products, a branded storefront, AI-powered marketing tools,
          and integrated payment processing via Stripe Connect.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          Account authentication is managed through Clerk. You are responsible
          for maintaining the security of your account credentials and for all
          activity that occurs under your account. A single user may create and
          manage multiple businesses on the platform, each with its own
          storefront and products. You must provide accurate and complete
          information when creating your account and keep it up to date.
        </p>

        <h2>4. Payment Terms</h2>
        <p>
          All subscription billing is processed through Stripe. By subscribing
          to Know24, you authorize recurring monthly charges of $99 to your
          designated payment method. Know24 charges a 10% platform fee on all
          creator sales processed through the platform. This fee is
          automatically deducted from each transaction before funds are
          transferred to the creator&apos;s connected Stripe account.
          Subscription fees are non-refundable except as required by applicable
          law.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          Creators retain full ownership of all content, courses, and digital
          products they create and upload to the platform. Know24 owns all
          rights, title, and interest in the platform itself, including its
          design, features, code, branding, and proprietary technology. By using
          the Service, creators grant Know24 a limited, non-exclusive license to
          display and distribute their content solely for the purpose of
          operating the platform and fulfilling buyer purchases.
        </p>

        <h2>6. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Upload, distribute, or sell any illegal or unlawful content</li>
          <li>
            Send unsolicited messages, spam, or engage in deceptive marketing
            practices
          </li>
          <li>
            Engage in fraud, misrepresentation, or any activity intended to
            deceive buyers
          </li>
          <li>
            Infringe upon the intellectual property rights of any third party
          </li>
          <li>
            Attempt to disrupt, damage, or gain unauthorized access to any part
            of the Service
          </li>
          <li>
            Use the platform for any activity that violates applicable laws or
            regulations
          </li>
        </ul>
        <p>
          Know24 reserves the right to suspend or terminate accounts that
          violate these acceptable use policies.
        </p>

        <h2>7. Termination</h2>
        <p>
          Either party may terminate this agreement at any time. You may cancel
          your subscription through your account settings or by contacting
          support. Know24 may terminate or suspend your account for violations of
          these Terms or for any other reason at its sole discretion. Upon
          termination, you will have 30 days to export your data, including
          product content, customer data, and transaction records. After 30
          days, your data will be permanently deleted from our systems.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Know24 and its
          officers, directors, employees, and agents shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages,
          including but not limited to loss of profits, data, use, or goodwill,
          arising out of or in connection with your use of the Service.
          Know24&apos;s total aggregate liability shall not exceed the amount you
          paid to Know24 in the twelve (12) months preceding the claim.
        </p>

        <h2>9. Privacy</h2>
        <p>
          Your use of the Service is also governed by our{" "}
          <Link
            href="/legal/privacy"
            className="text-[#0891b2] hover:text-[#0e7490]"
          >
            Privacy Policy
          </Link>
          , which describes how we collect, use, and protect your personal
          information. By using the Service, you consent to the data practices
          described in our Privacy Policy.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          Know24 reserves the right to modify these Terms at any time. We will
          notify users of material changes by posting the updated Terms on the
          platform and updating the &quot;Last updated&quot; date above. Changes
          become effective immediately upon posting. Your continued use of the
          Service after changes are posted constitutes your acceptance of the
          revised Terms.
        </p>

        <h2>11. Contact Information</h2>
        <p>
          If you have any questions about these Terms of Service, please contact
          us at{" "}
          <a
            href="mailto:support@know24.io"
            className="text-[#0891b2] hover:text-[#0e7490]"
          >
            support@know24.io
          </a>
          .
        </p>
      </article>
    </section>
  );
}
