# The Realtor OS — by FlowSolo Systems

> Your complete real estate business — listings, leads, pipeline, commissions, and follow-ups all in one place.

A niche-specific business management dashboard for independent real estate agents and solo brokers. Built on Vite + React + Supabase, white-labeled per agent, and gated by single-use license keys for clean per-seat sales.

---

## Features

- **My Realtor Hub** — at-a-glance dashboard for active listings, hot leads, deals under contract, and commissions in flight
- **Clients** — buyer / seller / past-client CRM with budget, timeline, pre-approval, and preferred-contact fields
- **Active Listings** — track each property end-to-end: price, status, days on market, showings, offers, and open houses
- **Lead Pipeline** — drag-and-drop kanban from New Lead → Closed, with source, timeline, and next-touch dates
- **Open Houses** — schedule, capture sign-ins, log expected vs actual visitors, and auto-flag follow-ups
- **Commission Hub** — invoice every closing with sale price, rate, gross commission, brokerage split, and net to you (powered by the shared Commission Calculator)
- **Document Vault** — buyer/seller templates, disclosures, listing presentations, and checklists in one searchable library
- **Client Follow-Ups** — calls, texts, and email touches scheduled per client and per lead, with channel and outcome tracking
- **Transaction Checklist** — every milestone from earnest money to keys delivered, per deal
- **Weekly Business Review** — listings/showings/offers/closings logged each week, plus prospecting reflections and the next 3 priorities
- **Showing Tracker** — log every showing with interest level (1–5) and offer-likely flag for quick recall
- **Market Analytics** — DOM, list-to-sale, months of inventory, and trend notes for each area you serve
- **Settings** — agent profile, default commission rate & brokerage split, brokerage logo upload, brand & accent colors, and theme presets

A 5-step onboarding wizard runs on first login to capture brokerage details, commission defaults, market focus, and the agent's first listing or client.

---

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Configure environment variables** — copy the example file and fill in your project's keys:
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SERVICE_KEY=sb_secret_...
   ```
   `SUPABASE_SERVICE_KEY` is only used locally by the key generator — never ship it to the browser.

4. **Load the schema** — open the Supabase SQL Editor and run `supabase-schema.sql`. It creates every table, RLS policy, and the `on_auth_user_created` trigger that auto-creates the profile row on signup.

5. **Mint license keys** — keys are required to redeem an account:
   ```bash
   npm run generate-keys -- 10
   ```

6. **Run the dev server**
   ```bash
   npm run dev
   ```

---

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool and dev server
- [React 18](https://react.dev/) — UI library
- [React Router v6](https://reactrouter.com/) — client-side routing
- [Tailwind CSS](https://tailwindcss.com/) — styling with CSS-variable-driven brand/accent theming
- [Supabase JS](https://supabase.com/docs/reference/javascript/introduction) — auth, Postgres, RLS, and storage
- [lucide-react](https://lucide.dev/) — icon set
- [recharts](https://recharts.org/) — dashboard charts
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) — drag-and-drop on the lead pipeline and task board

---

White-labeled per agent: brokerage name + uploaded logo + per-user brand & accent colors stored on the profile and applied via CSS variables at runtime — no rebuild required.
