export const helpCategories = [
  {
    slug: "getting-started",
    name: "Getting Started",
    icon: "Rocket",
    description: "Set up your account and launch your first business.",
    articles: [
      {
        slug: "creating-your-account",
        title: "Creating Your Account",
        body: "Sign up at know24.io and verify your email. You'll be guided through our onboarding process that takes less than 5 minutes to complete.\n\n## Steps\n\n1. Click **Start Free** on the homepage\n2. Enter your email and create a password (or sign in with Google)\n3. Complete your profile with your name and expertise area\n4. You're ready to set up your first business!",
      },
      {
        slug: "setup-my-business-walkthrough",
        title: "Setup My Business Walkthrough",
        body: 'Our 5-step "Setup My Business" wizard guides you from raw expertise to a live storefront.\n\n## The 5 Steps\n\n1. **Knowledge Intake** — Upload documents, paste URLs, or let our AI interview you\n2. **AI Analysis** — We analyze your expertise and recommend products\n3. **Product Selection** — Choose from 12 product types to create\n4. **AI Building** — Watch as AI generates your products, storefront, and content\n5. **Go Live** — Review everything and launch with one click',
      },
    ],
  },
  {
    slug: "products",
    name: "Products",
    icon: "Package",
    description: "Create, manage, and sell digital products.",
    articles: [
      {
        slug: "product-types-explained",
        title: "Product Types Explained",
        body: "Know24 supports 12 product types, each tailored for different ways to package and sell knowledge.\n\n## Static Products\n- **Guide / eBook** — Long-form PDF with chapters\n- **Framework / Template Pack** — Fillable templates and SOPs\n- **Cheat Sheet** — Condensed 1-3 page references\n- **Worksheet / Workbook** — Interactive exercises\n- **Swipe File** — Copy-paste scripts and templates\n- **Resource Directory** — Curated tool and link lists\n- **Prompt Pack** — AI prompts for specific workflows\n\n## Interactive Products\n- **Email Course** — 5-7 day drip sequence\n- **Assessment / Quiz** — Self-evaluation with scoring\n- **Mini-Course** — Multi-module lessons\n\n## AI Products\n- **Chatbot** — Conversational access to your knowledge\n- **Expert Engine** — Your knowledge as an API service",
      },
      {
        slug: "editing-product-content",
        title: "Editing Product Content",
        body: "After AI generates your products, you can edit every aspect.\n\n## How to Edit\n\n1. Go to your **Dashboard**\n2. Click the **Product** card for your business\n3. In the slide-over panel, select the product to edit\n4. Modify title, description, pricing, and content\n5. Click **Save** to update\n\nChanges are reflected on your storefront immediately.",
      },
    ],
  },
  {
    slug: "storefront",
    name: "Storefront",
    icon: "Store",
    description: "Customize your branded storefront.",
    articles: [
      {
        slug: "customizing-your-storefront",
        title: "Customizing Your Storefront",
        body: "Your storefront is your public-facing store. Customize branding, colors, and content.\n\n## What You Can Customize\n\n- **Colors** — Primary, secondary, and accent colors\n- **Hero Section** — Headline, tagline, credibility line\n- **About Section** — Your bio and photo\n- **Product Layout** — Featured products and ordering\n- **Social Links** — Connect your social profiles\n- **Custom Domain** — Use your own domain name",
      },
      {
        slug: "connecting-custom-domain",
        title: "Connecting a Custom Domain",
        body: "By default, your storefront lives at `your-slug.know24.io`. You can connect your own domain.\n\n## Steps\n\n1. Go to **Dashboard** → **Store** slide-over → **Domain** tab\n2. Enter your custom domain (e.g., `myexpertise.com`)\n3. Add the CNAME record shown to your DNS provider\n4. Wait for DNS propagation (usually 5-30 minutes)\n5. SSL certificate is automatically provisioned",
      },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    icon: "Megaphone",
    description: "AI-powered marketing tools and Scout intelligence.",
    articles: [
      {
        slug: "social-post-generator",
        title: "Social Post Generator",
        body: "Generate platform-optimized social posts from your knowledge base.\n\n## How It Works\n\n1. Open **Dashboard** → **Marketing** slide-over\n2. Click **Generate Post**\n3. Select the platform (Twitter/X, LinkedIn, Instagram)\n4. Choose a topic or let AI suggest one\n5. Review, edit, and copy the generated post\n\nYou get 300 social posts per month included in your plan.",
      },
      {
        slug: "scout-overview",
        title: "Scout Overview",
        body: "Scout is your AI market intelligence agent. It scans Reddit, X, LinkedIn, Quora, podcast directories, and news sources to find opportunities for you.\n\n## What Scout Finds\n\n- **Hot Threads** — Relevant discussions where your expertise would add value\n- **Trending Topics** — Topics gaining traction in your niche\n- **Podcast Opportunities** — Shows looking for guests in your area\n- **Community Engagement** — Questions you can answer to build authority\n\nScout runs automatically every 6 hours and surfaces opportunities as cards you can approve, edit, or dismiss.",
      },
    ],
  },
  {
    slug: "billing",
    name: "Billing",
    icon: "CreditCard",
    description: "Subscriptions, payments, and invoices.",
    articles: [
      {
        slug: "managing-your-subscription",
        title: "Managing Your Subscription",
        body: "Your Know24 subscription is $99/month per business.\n\n## How to Manage\n\n1. Go to **Settings** → **Billing** tab\n2. View your current plan and usage\n3. Update payment method or cancel\n\n## What's Included\n- Unlimited products per business\n- 300 social posts/month\n- AI Workspace access\n- Branded storefront with custom domain\n\n## Scout Add-On\nAdd Scout for $199/month for AI market intelligence.",
      },
      {
        slug: "stripe-connect-payouts",
        title: "Stripe Connect & Payouts",
        body: "When customers buy from your storefront, payments go directly to your Stripe account via Stripe Connect.\n\n## How It Works\n\n1. During setup, you connect or create a Stripe Express account\n2. Customer pays on your storefront\n3. Funds go to your Stripe account (minus Stripe fees + 5% platform fee)\n4. Stripe sends payouts to your bank on your configured schedule\n\nKnow24 never holds your funds. You're always in control.",
      },
    ],
  },
  {
    slug: "expert-engine",
    name: "Expert Engine",
    icon: "Cpu",
    description: "Your knowledge as an API service.",
    articles: [
      {
        slug: "what-is-expert-engine",
        title: "What is Expert Engine?",
        body: "Expert Engine turns your knowledge base into a structured API that other apps and services can query.\n\n## Use Cases\n\n- **SaaS Integrations** — Other apps embed your expertise\n- **Custom Chatbots** — Build chatbots powered by your knowledge\n- **Internal Tools** — Companies use your expertise in their workflows\n\n## How It Works\n\n1. Create an Expert Engine product\n2. Configure which knowledge sources to include\n3. Set pricing (per-query or subscription)\n4. Share your API key with customers",
      },
      {
        slug: "expert-engine-api-keys",
        title: "Managing API Keys",
        body: "Each Expert Engine product gets its own API keys.\n\n## Generating Keys\n\n1. Go to **Dashboard** → **Product** → select your Expert Engine\n2. Open the **API Keys** tab\n3. Click **Generate New Key**\n4. Copy and securely store the key (it won't be shown again)\n\n## Rate Limits\n- Default: 100 requests/minute\n- Contact support for higher limits",
      },
    ],
  },
] as const;
