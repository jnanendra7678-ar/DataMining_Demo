# DataMining Live 📊

A real-time, interactive data mining demonstration built for live seminars and classroom presentations. Participants submit their own lifestyle data from their phones, and a presenter's dashboard runs a full 8-stage data mining pipeline on the incoming data live — with charts and cluster visualizations updating in real time as new submissions arrive.

**Live demo:** https://realtime-datamining-ih3u.bolt.host/

## How it works

The app has two views:

- **Participant view** — a simple mobile-friendly form where each attendee submits four data points: age, average sleep hours, average study hours, and average recreation hours per day.
- **Presenter view** — a live dashboard (meant to be projected) that walks through the data mining pipeline stage by stage as responses come in, powered by Supabase Realtime subscriptions.

### The pipeline

1. **Data Collection** — participant responses are collected via the form and stored in Supabase.
2. **Data Cleaning** — checks for missing values, duplicate participant IDs, out-of-range ages, invalid time values, and impossible daily totals.
3. **Preprocessing** — standardizes each attribute (z-score normalization) so variables with different scales can be compared fairly.
4. **Exploratory Analysis** — computes Pearson correlations between every pair of attributes and ranks them by strength.
5. **Similarity** — calculates Euclidean distance between participants to find each person's closest matches.
6. **Clustering** — runs a from-scratch K-means++ implementation (seeded for reproducibility) to group participants into behavioral clusters.
7. **Pattern Discovery** — automatically labels clusters (e.g. "Study-focused," "Well-rested," "Recreation-focused," "Balanced") based on their standardized attribute averages.
8. **Interpretation** — summarizes the findings: records analyzed, clusters found, variables analyzed, and notable patterns detected.

Everything re-runs automatically whenever a new response comes in, since the dashboard subscribes to Postgres changes on the `responses` table via Supabase Realtime.

## Tech stack

- **React 18** + **TypeScript**
- **Vite** — build tool and dev server
- **Tailwind CSS** — styling
- **Supabase** — Postgres database, realtime subscriptions, and row-level security
- **Recharts / custom SVG charts** — scatter plots, bar charts, correlation matrix, and cluster visualization
- **qrcode.react** — generates a QR code so participants can join instantly
- **lucide-react** — icons

All data mining logic (standardization, Pearson correlation, K-means++, similarity ranking, data cleaning checks) is implemented from scratch in [`src/lib/datamining.ts`](src/lib/datamining.ts) — no external ML libraries.

## Project structure

```
src/
├── App.tsx                       # Top-level view routing (home / participant / presenter)
├── components/
│   ├── ParticipantForm.tsx       # Mobile-friendly data submission form
│   ├── PresentationDashboard.tsx # Live presenter dashboard, drives the pipeline stages
│   ├── Charts.tsx                # Scatter, bar, correlation matrix, cluster visualizations
│   └── ParticleField.tsx         # Animated background
└── lib/
    ├── datamining.ts             # Standardization, correlation, K-means++, similarity, cleaning
    ├── supabase.ts               # Supabase client setup
    └── types.ts                  # Shared TypeScript types and attribute config

supabase/
└── migrations/
    └── ..._create_responses_table.sql   # `responses` table schema, RLS policies, realtime setup
```

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/jnanendra7678-ar/DataMining_Demo.git
   cd DataMining_Demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   These are available in your Supabase project under **Settings → API**. The anon key is safe for client-side use — it's the public key Supabase is designed to expose, with access controlled entirely by Row Level Security policies.

4. **Set up the database**

   Run the migration in `supabase/migrations/` against your Supabase project (via the SQL editor in the Supabase dashboard, or the Supabase CLI). This creates the `responses` table, enables Row Level Security with open read/write policies (intentional — this is a no-auth, single-tenant seminar demo), and adds the table to the realtime publication.

5. **Run the dev server**
   ```bash
   npm run dev
   ```

### Other scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript's type checker with no emit |

## Usage in a live session

1. Open the presenter dashboard on the projector/screen and share the participant URL or QR code shown there.
2. Attendees scan the QR code or visit the link on their phones and submit their data.
3. Watch the pipeline run live on the dashboard as responses come in — the presenter can also clear all responses to reset the demo between sessions.

## Security note

This app is intentionally designed as an open, no-auth demo for live seminars: anyone with the link can submit or clear data. It's built for a controlled, in-person presentation setting rather than public deployment. If adapting it for another context, consider adding authentication and tightening the Row Level Security policies in the migration file accordingly.

## License

No license specified yet — add one (e.g. MIT) if you plan to share or accept contributions to this project.

