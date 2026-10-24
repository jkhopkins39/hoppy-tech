# Jeremy Hopkins - Personal Website

This is Jeremy Hopkins' personal portfolio website built with React, TypeScript, and Vite.

## Features
- Responsive design with mobile-first approach
- Modern React with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Mobile-friendly hamburger menu
- Contact form with EmailJS integration
- Portfolio showcase
- Blog section
- Creative projects display

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Deployment**: Vercel
- **Backend**: Express.js (Railway)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd jkhopkins39.github.io

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `./deploy.sh` - Deploy to Vercel

## Deployment

### Full Stack (Vercel)
The entire application is deployed on Vercel with automatic deployments from the main branch.

**Live Site**: https://hoppytech.com

To deploy manually:
```bash
# Quick deployment
./deploy.sh

# Or manually
npm run build
vercel --prod
```

### Local Development
To run the application locally:

1. **Start the frontend**:
```bash
npm run dev
```

2. **Start the development server** (in a separate terminal):
```bash
npm run dev:server
```

The frontend will run on `http://localhost:5173` and the API server on `http://localhost:3001`.

## Environment Variables

### For Production (Vercel)
Add these environment variables in your Vercel project settings:

**Shared Hoppy Tech (`HT_*` — linked/shared env):**
- `HT_SUPABASE_PROJECT_URL`: Supabase project URL
- `HT_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (also injected into the Vite client via `vite.config.ts`)
- `HT_SUPABASE_SECRET_KEY`: Supabase secret / service-role key (**server only**)

**Email + admin:**
- `HT_RESEND_API_KEY`: Resend API key
- `RESEND_FROM`: e.g. `Hoppy Tech Intake <hello@hoppytech.com>`
- `RESEND_TO`: your inbox (comma-separated if multiple)
- `ADMIN_EMAIL`: e.g. `jeremy@hoppytech.com`

**AI:**
- `HT_GEMINI_API_KEY`: Chatbot and contact-form screening

Admin login uses **Supabase Auth** — do not store `USERNAME` / `PASSWORD` in Vercel. Ads webhook / design-team CC / ZeroBounce / Twilio are optional and currently unused.

## Contact-form screening

`/api/contact` verifies and screens every submission before it reaches the inbox:

1. **Honeypot + per-IP rate limit** — hidden fields, plus max `CONTACT_RATE_LIMIT_PER_HOUR`
   (default 5) submissions per IP per hour and a 45-second minimum gap.
2. **Contact verification** — email is checked for syntax, disposable/placeholder
   domains, and a live DNS lookup proving the domain can receive mail; phone is
   normalised to E.164 and checked against NANP rules (valid area code and
   exchange, no reserved or fictional ranges, no filler digits). Set
   `ZEROBOUNCE_API_KEY` / `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` to upgrade
   these to live mailbox and line-status checks.
3. **Deterministic content filter** (`api/_lib/contentFilter.js`) — a wordlist
   pass over name/company/message that rejects explicit language, slurs, joke
   aliases, laughter-only messages, and keyboard mashing in ~10ms with **no
   network call**. This is the backstop that still works when the model is
   rate-limited or down. Ordinary swearing is deliberately *not* blocked here —
   a frustrated customer is still a customer — it is flagged and passed to the AI.
4. **Screening agent** — `gemini-3.5-flash-lite` (reusing `HT_GEMINI_API_KEY`)
   classifies the message and returns `accept` / `review` / `reject`. Rejections
   route the sender to `/sorry`; `review` still emails, flagged in the subject
   line. Set `CONTACT_SCREENING=off` to bypass. Every submission is stored either
   way, so false positives are recoverable from the dashboard.

Only unambiguous junk — spam/solicitation, trolling, gibberish, form tests — is
ever rejected, and only at ≥60% confidence. Small budgets, vague asks, typos, and
non-native English are explicitly protected in the prompt and always get through.
Content that Gemini's own safety filters refuse to process is rejected outright.

**Free-tier rate limits.** Gemini free tier allows ~15 requests/min *per model*.
On a 429 the screener automatically retries on `gemini-3.1-flash-lite`, then
`gemini-3.5-flash` (separate quota buckets) within a 16-second budget. If every
model fails, the submission is delivered but marked `review` — never silently
passed off as clean. Enabling billing on the Google Cloud project removes the
limit. Note the 2.5 model line is no longer served to new projects (404).

DNS and provider lookups **fail open** — if they are unreachable the submission
is accepted rather than lost, since the content filter and AI still apply.

Request metadata (IP, user agent, referrer, IP-derived city/region) is stored with
each submission. Run `supabase/migrations/20260727_contact_security.sql` in the
Supabase SQL editor to add the required columns.

### For Local Development
Copy `.env.example` to `.env` and fill in values:

```bash
HT_SUPABASE_PROJECT_URL=https://your-project.supabase.co
HT_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
HT_SUPABASE_SECRET_KEY=your_secret_key
HT_RESEND_API_KEY=
RESEND_FROM=Hoppy Tech Intake <hello@hoppytech.com>
RESEND_TO=jeremy@hoppytech.com
ADMIN_EMAIL=jeremy@hoppytech.com
HT_GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
``` 