# Know24 — AI Coding Assistant Rules

## Project Overview
Know24 is a multi-tenant SaaS platform — "Shopify for Knowledge Businesses" — enabling subject matter experts to go from raw expertise to a fully operational knowledge business in under one hour.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript (strict mode), Tailwind CSS v4, shadcn/ui
- **Auth**: Clerk (@clerk/nextjs)
- **Database + Storage**: Supabase (PostgreSQL 16 + pgvector + Storage)
- **Payments**: Stripe Billing + Stripe Connect
- **AI**: Vercel AI SDK — Google Gemini (drafts, images) + Anthropic Claude (polish)
- **Background Jobs**: Inngest (serverless, event-driven)
- **Email**: Resend + React Email
- **Hosting**: Vercel (everything — frontend, API, background jobs)
- **Monitoring**: Sentry + Vercel Analytics
- **Research**: Firecrawl + Tavily

## Code Conventions

### TypeScript
- **NO `any`**. No `@ts-ignore`. Strict mode ON.
- Use `interface` for component props: `interface ComponentNameProps { ... }`
- Use `type` for unions, intersections, and utility types
- All functions must have explicit return types in service/lib files

### Components
- All components are functional with arrow syntax
- Props interface named `{ComponentName}Props`
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Import order: React → Next.js → third-party → internal `@/` → relative

### API Routes
Every API route MUST:
1. Validate input with Zod
2. Authenticate with Clerk `auth()`
3. Check authorization (business ownership via RLS)
4. Return consistent JSON: `{ data, error, meta }`
5. Handle errors with try/catch → `{ error: { code, message } }`

### State Management
- Server state: TanStack React Query
- UI state: Zustand (small stores, co-located)
- Form state: React Hook Form + Zod resolvers

### Database
- Every table has `business_id` with RLS enforcing isolation
- Use Supabase client with Clerk JWT for RLS-aware queries
- Service role client ONLY in webhooks and server-side admin operations

## Explicit Prohibitions
- NEVER expose `STRIPE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` client-side
- NEVER call AI providers directly from client (always through API routes)
- NEVER use `useEffect` for data fetching in Server Components
- NEVER create API routes without Zod validation
- NEVER bypass Supabase RLS
- NEVER use inline styles (Tailwind only)
- NEVER leave `console.log` in production code

## Business Logic Rules
- V1 is ebook-only — one product type, done exceptionally well
- $99/mo + sliding transaction fee (5% → 1% based on volume)
- Unified credit system: 200 credits/mo (Research=10, Ebook=50, Cover=10, Scout=15, Chapter rewrite=5)
- Each user can have multiple businesses; each business has exactly one storefront
- Products belong to businesses, never to users directly
- Scout is a live opportunity hunter, NOT a playbook generator
- Storefronts at `know24.io/s/{slug}`
- Background jobs dispatched via `src/lib/queue/dispatch.ts` → Inngest events
- Storage uses Supabase Storage buckets: `ebooks`, `covers`, `knowledge`

## File Patterns
- Pages: `src/app/(group)/route/page.tsx`
- API routes: `src/app/api/resource/route.ts`
- Components: `src/components/{context}/{ComponentName}.tsx`
- Services: `src/server/services/{domain}.service.ts`
- DB queries: `src/server/db/{table}.ts`
- Hooks: `src/hooks/use{Name}.ts`
- Types: `src/types/{domain}.ts`

## Feature Addition Pattern
1. Define TypeScript types first
2. Create the Supabase migration
3. Write the API route with validation
4. Build the component with loading/error/empty states
5. Write at least one test
