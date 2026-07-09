# FenceFlow — Temporary Fence Rental Management

Full-stack rental ops app: dashboard, orders, inventory, customers, dispatch, calendar, payments, admin. React + Vite + TypeScript + Tailwind v4, Supabase (auth + Postgres + RLS), deploys to Netlify.

## Setup (15 min)

### 1. Supabase
1. Create a project at supabase.com (free tier fine).
2. SQL Editor → run `supabase/schema.sql`, then `supabase/seed.sql` (demo data).
3. Authentication → Providers → enable Email. Optionally enable Google OAuth (add your Google client ID/secret).
4. Settings → API → copy the Project URL and anon key.

### 2. Local dev
```bash
npm install
cp .env.example .env   # paste your Supabase URL + anon key
npm run dev
```
Sign up — the FIRST account automatically becomes admin. Later signups are drivers (promote in Admin page).

### 3. Netlify
1. Push this folder to GitHub.
2. Netlify → New site from Git. Build command and publish dir are read from `netlify.toml`.
3. Site settings → Environment variables → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In Supabase → Authentication → URL Configuration → set Site URL to your Netlify URL (needed for Google OAuth redirects).

### 4. Email notifications (optional)
- Sign up at resend.com, verify your sending domain.
- `supabase functions deploy notify` and `supabase secrets set RESEND_API_KEY=...`
- Wire it with Supabase Database Webhooks: e.g. on `deliveries` INSERT → call the function to notify the driver; on `orders` UPDATE → notify the customer.

### 5. Card payments (recommended path)
Raw card entry = PCI scope. Use Stripe Payment Links: create a link per invoice amount, paste into the payment record reference, and log the payment when Stripe confirms. A full Stripe Checkout integration can be added later via a second edge function.

## Roles
- **Admin** — everything.
- **Driver** — dashboard, dispatch (their runs), calendar. Enforced by Postgres RLS, not just UI.

## Invoices
Order detail → "Invoice PDF" uses the browser print dialog (Save as PDF). Print styles strip the app chrome.

## v2: Public booking, portal, waiver, Stripe
- Run `supabase/migration_v2.sql` after schema.sql.
- **/book** — public quote request form (no login). New requests appear on the Orders page for one-click conversion to an order.
- **/portal** — customers look up rentals with email + order number, see balance, pay online.
- **Damage waiver** — orders carry `waiver_pct` (default 12%); shown on invoices and portal. Set to 0 or toggle `waiver_accepted` off per order.
- **Stripe** — deploy `supabase functions deploy stripe-checkout --no-verify-jwt` and set `STRIPE_SECRET_KEY`. Portal "Pay online" opens Stripe Checkout. Until deployed, the button falls back to a contact message.

### Embed on your existing site
```html
<iframe src="https://YOUR-APP.netlify.app/book" style="width:100%;min-height:760px;border:0"></iframe>
```
Same pattern for `/portal`. Or just link buttons to those URLs.
