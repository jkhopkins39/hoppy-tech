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

**Frontend (exposed to browser — `VITE_` prefix):**
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase publishable (anon) key
- `VITE_ADMIN_EMAIL`: Admin email allowlist for UI (e.g. `jeremy@hoppytech.com`)

**Server only (never prefix with `VITE_`):**
- `SUPABASE_URL`: Same Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase secret (service role) key
- `ADMIN_EMAIL`: Admin email verified on API routes (e.g. `jeremy@hoppytech.com`)
- `GEMINI_API_KEY`: Chatbot
- `GITHUB_TOKEN`: Authenticated blog publishing
- `WEB3FORMS_ACCESS_KEY`: Contact form proxy

Admin login uses **Supabase Auth** — do not store `USERNAME` / `PASSWORD` in Vercel.

### For Local Development
Copy `.env.example` to `.env` and fill in values:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key
VITE_ADMIN_EMAIL=jeremy@hoppytech.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
ADMIN_EMAIL=jeremy@hoppytech.com
GEMINI_API_KEY=your_gemini_api_key_here
WEB3FORMS_ACCESS_KEY=your_web3forms_access_key_here
GITHUB_TOKEN=your_github_token_here
PORT=3001
``` 