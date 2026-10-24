/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Shared Hoppy Tech Supabase project URL (injected by vite.config). */
  readonly HT_SUPABASE_PROJECT_URL?: string;
  /** Shared Hoppy Tech Supabase publishable key (injected by vite.config). */
  readonly HT_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
