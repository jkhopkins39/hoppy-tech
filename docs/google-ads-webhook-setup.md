# Google Ads → Hoppy Tech dashboard (webhook)

## What was built

| Piece | Path |
|-------|------|
| SQL table | `supabase/migrations/20260718_google_leads.sql` |
| Webhook API | `api/webhooks/google-ads.js` |
| Dashboard badge | Messages tab shows an **Ads** tag for these leads |

Hoppy Tech is **Vite + Vercel `/api`**, not Next.js — the live URL is still a normal HTTPS POST endpoint.

## Live webhook URL

```
https://www.hoppytech.com/api/webhooks/google-ads
```

**Use `www`.** Apex `https://hoppytech.com/...` returns a **308 redirect** to www. Google’s lead-form webhook often does not follow POST redirects, which shows as: *“Your data management system didn't respond correctly.”*

(Use your production domain after deploy.)

## What you need to do

### 1. Run the SQL migration in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your Hoppy Tech project  
2. **SQL Editor** → New query  
3. Paste the full contents of `supabase/migrations/20260718_google_leads.sql`  
4. Run it  

This creates `hoppy_tech.google_leads` and adds `source` / `google_lead_id` on `contact_submissions`.

### 2. Set the webhook secret on Vercel

1. Generate a long random string (password manager / `openssl rand -hex 32`)  
2. Vercel → Hoppy Tech project → **Settings → Environment Variables**  
3. Add:

| Name | Value |
|------|--------|
| `GOOGLE_ADS_WEBHOOK_KEY` | *(your secret)* |

4. Redeploy so the new env var is live  

Also add the same line to local `.env` if you test with `vercel dev`.

### 3. Deploy this code

Push / deploy hoppy-tech so `api/webhooks/google-ads.js` is on production.

### 4. Configure Google Ads

1. Google Ads → your **Lead form** asset/extension  
2. Webhook / CRM integration:  
   - **Webhook URL:** `https://www.hoppytech.com/api/webhooks/google-ads`  
   - **Key:** exactly the same as `GOOGLE_ADS_WEBHOOK_KEY`  
3. Use **Send test data** in the Ads UI  

A successful test should:

- Return HTTP 200  
- Appear under **/dashboard → Messages** with an **Ads** badge  
- Insert a row in `hoppy_tech.google_leads`  
- Email you (if Resend is configured)

### 5. Form field mapping tip

In the lead form, name your multiple-choice question something that includes **“business size”** (or “company size” / “team size”), so the webhook maps it to `business_size`. Standard Google fields map automatically:

| Google `column_id` / name | Stored as |
|---------------------------|-----------|
| `FULL_NAME` / Full Name | `full_name` + dashboard name |
| `EMAIL` / User Email | `email` |
| `PHONE_NUMBER` / User Phone | `phone_number` |
| Business size (custom) | `business_size` (+ company on inbox row) |

## How authenticity works

Google sends `google_key` (or `Google_key`) in the JSON body. The handler rejects the request with **401** unless it matches `GOOGLE_ADS_WEBHOOK_KEY`. Query/header keys are also accepted as optional fallbacks.
