# Pulse Labs

Een **Agile Team Mood App** als losse tool binnen de Pink Pollos Lab-omgeving. Track je team's dagelijkse mood en verbeter de teamdynamiek.

## Features

- **Dagelijkse check-ins** - 1 klik per dag met 5 mood levels
- **Anoniem** - Alleen geaggregeerde data wordt gedeeld
- **Multi-tenant** - Teams zien elkaar nooit
- **Streaks** - Gamification met persoonlijke streaks
- **Mobile-first** - Werkt perfect op elk apparaat

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Clerk** (Authentication)
- **Supabase** (Postgres database)
- **Resend** (Email notifications)
- **Tailwind CSS**
- **Vercel** (Deployment)

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/drprijkers-del/pulse-labs.git
cd pulse-labs
npm install
```

### 2. Supabase Setup

1. Maak een nieuw project aan op [supabase.com](https://supabase.com)
2. Ga naar **SQL Editor** en voer de inhoud van `supabase/schema.sql` uit
3. Ga naar **Settings > API** en kopieer je keys

### 3. Environment Variables

Kopieer `.env.example` naar `.env` en vul in:

```bash
cp .env.example .env
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/teams

# Resend (email notifications for contact form)
RESEND_API_KEY=re_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Clerk Setup

1. Maak een applicatie aan op [clerk.com](https://clerk.com)
2. Schakel "Email + Password" in als sign-in methode
3. Kopieer je API keys naar `.env`
4. Maak users aan in het Clerk Dashboard
5. Stel `publicMetadata` in per user: `{"role": "super_admin"}` of `{"role": "scrum_master"}`

### 5. Resend Setup (optioneel)

1. Maak een account aan op [resend.com](https://resend.com)
2. Voeg en verifieer je domein toe (bijv. `pulse-labs.io`)
3. Maak een API key aan en voeg toe aan `.env`
4. Contact formulier submissions worden per email verstuurd naar `info@pinkpollos.com`

Zonder `RESEND_API_KEY` worden submissions alleen opgeslagen in Supabase.

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
pulse-labs/
├── app/
│   ├── admin/           # Admin pages
│   │   ├── login/
│   │   └── teams/
│   └── t/[slug]/        # Team check-in pages
├── components/
│   ├── admin/           # Admin components
│   ├── team/            # Team components
│   └── ui/              # Shared UI components
├── domain/
│   ├── moods/           # Mood actions
│   └── teams/           # Team actions
├── lib/
│   ├── auth/            # Auth helpers
│   ├── supabase/        # Supabase clients
│   └── tenant/          # Multi-tenant context
├── prisma/              # Prisma schema
└── supabase/            # SQL schema
```

## User Flows

### Admin Flow
1. Login op `/login` (via Clerk)
2. Maak teams aan op `/teams`
3. Kopieer de share-link
4. Deel met je team

### Team Member Flow
1. Open share-link (bijv. `/t/marketing?k=abc123`)
2. Token wordt gevalideerd, sessie wordt gezet
3. Redirect naar clean URL `/t/marketing`
4. Kies je mood (1-5)
5. Optioneel: nickname en comment
6. Check-in!

## Deployment

De app is al gekoppeld aan Vercel. Om te deployen:

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

Of push naar GitHub - Vercel bouwt automatisch.

### Environment Variables in Vercel

Voeg dezelfde environment variables toe in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (gebruik `pk_live_...` voor productie)
- `CLERK_SECRET_KEY` (gebruik `sk_live_...` voor productie)
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (je Vercel URL)

## Security

- Admin routes alleen toegankelijk voor admin users
- Team data altijd gefilterd op `team_id`
- Public inserts via Postgres RPC functions
- Invite tokens worden gehashed opgeslagen
- Row Level Security op alle tabellen

## License

MIT - Pink Pollos Lab
