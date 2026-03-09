import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Know24",
  description:
    "Know24 Cookie Policy — how we use cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Home
      </Link>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Cookie Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: March 2026
        </p>

        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files that are stored on your device when you
          visit a website. They are widely used to make websites work more
          efficiently, remember your preferences, and provide information to
          site owners. Cookies can be &quot;session&quot; cookies, which are
          deleted when you close your browser, or &quot;persistent&quot; cookies,
          which remain on your device until they expire or you delete them.
        </p>

        <h2>2. Essential Cookies</h2>
        <p>
          These cookies are strictly necessary for the platform to function and
          cannot be disabled. They include:
        </p>
        <ul>
          <li>
            <strong>Authentication cookies:</strong> Managed by Clerk to
            maintain your signed-in session, verify your identity, and protect
            against unauthorized access.
          </li>
          <li>
            <strong>Session management cookies:</strong> Used to maintain your
            session state across pages, remember your active business context,
            and ensure a seamless navigation experience.
          </li>
          <li>
            <strong>Security cookies:</strong> Used for CSRF protection and
            other security measures to safeguard your account.
          </li>
        </ul>

        <h2>3. Analytics Cookies</h2>
        <p>
          We use privacy-friendly analytics to understand how the platform is
          used and to improve the experience:
        </p>
        <ul>
          <li>
            <strong>Vercel Analytics:</strong> Collects aggregated, anonymous
            page view data to help us understand traffic patterns and popular
            features. No personally identifiable information is tracked.
          </li>
          <li>
            <strong>Vercel Speed Insights:</strong> Measures real-world
            performance metrics such as page load times and interaction
            responsiveness. This data is used to identify and fix performance
            bottlenecks.
          </li>
        </ul>

        <h2>4. Third-Party Cookies</h2>
        <p>
          Some third-party services we integrate with may set their own cookies:
        </p>
        <ul>
          <li>
            <strong>Stripe:</strong> Sets cookies during the payment and
            checkout process to prevent fraud, manage payment sessions, and
            comply with financial regulations.
          </li>
          <li>
            <strong>Clerk:</strong> Sets cookies for authentication, session
            management, and device recognition to provide secure sign-in across
            sessions.
          </li>
        </ul>
        <p>
          These cookies are governed by the respective privacy policies of
          Stripe and Clerk. We do not control the content or behavior of
          third-party cookies.
        </p>

        <h2>5. Managing Cookies</h2>
        <p>
          You can control and manage cookies through your browser settings. Most
          browsers allow you to:
        </p>
        <ul>
          <li>View what cookies are stored on your device</li>
          <li>Delete individual cookies or clear all cookies</li>
          <li>Block cookies from specific or all websites</li>
          <li>Set preferences for first-party vs. third-party cookies</li>
        </ul>
        <p>
          Please note that disabling essential cookies may prevent you from
          signing in or using core features of the platform. For instructions on
          managing cookies in your browser, visit your browser&apos;s help
          documentation:
        </p>
        <ul>
          <li>
            <strong>Chrome:</strong> Settings &gt; Privacy and Security &gt;
            Cookies and other site data
          </li>
          <li>
            <strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt;
            Cookies and Site Data
          </li>
          <li>
            <strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage
            Website Data
          </li>
          <li>
            <strong>Edge:</strong> Settings &gt; Cookies and site permissions
            &gt; Cookies and site data
          </li>
        </ul>

        <h2>6. Contact</h2>
        <p>
          If you have any questions about our use of cookies, please contact us
          at{" "}
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
