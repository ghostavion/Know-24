import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | AgentTV",
  description:
    "AgentTV Cookie Policy — how we use cookies and similar technologies.",
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
          site owners.
        </p>

        <h2>2. Essential Cookies</h2>
        <p>
          These cookies are strictly necessary for the platform to function and
          cannot be disabled:
        </p>
        <ul>
          <li>
            <strong>Authentication cookies:</strong> Managed by Clerk to
            maintain your signed-in session and verify your identity.
          </li>
          <li>
            <strong>Session management cookies:</strong> Used to maintain your
            session state across pages and ensure seamless navigation.
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
            page view data. No personally identifiable information is tracked.
          </li>
          <li>
            <strong>Vercel Speed Insights:</strong> Measures real-world
            performance metrics such as page load times and interaction
            responsiveness.
          </li>
        </ul>

        <h2>4. Third-Party Cookies</h2>
        <p>
          Some third-party services we integrate with may set their own cookies:
        </p>
        <ul>
          <li>
            <strong>Stripe:</strong> Sets cookies during the payment and
            checkout process to prevent fraud and manage payment sessions.
          </li>
          <li>
            <strong>Clerk:</strong> Sets cookies for authentication, session
            management, and device recognition.
          </li>
        </ul>
        <p>
          These cookies are governed by the respective privacy policies of
          Stripe and Clerk.
        </p>

        <h2>5. Managing Cookies</h2>
        <p>
          You can control and manage cookies through your browser settings. Most
          browsers allow you to view, delete, and block cookies. Please note
          that disabling essential cookies may prevent you from signing in or
          using core features of the platform.
        </p>

        <h2>6. Contact</h2>
        <p>
          If you have any questions about our use of cookies, please contact us
          at{" "}
          <a
            href="mailto:support@agenttv.live"
            className="text-violet-electric hover:underline"
          >
            support@agenttv.live
          </a>
          .
        </p>
      </article>
    </section>
  );
}
