# Deploy ComplianceOS to Vercel

## Option A — Import zip

1. Go to [vercel.com/new](https://vercel.com/new)
2. Upload `complianceos-vercel.zip`
3. Add environment variable: **`GEMINI_API_KEY`** = your Google AI key
4. Click **Deploy**

## Option B — GitHub

1. Push this folder to a GitHub repo
2. Import the repo in Vercel
3. Set **`GEMINI_API_KEY`** in Project → Settings → Environment Variables
4. Deploy (auto-detects Next.js)

## Required env vars

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes (for AI) | AI chat & policy generation |

## Optional env vars

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Live Stripe billing |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay billing |

## After deploy

- App URL: `https://your-project.vercel.app`
- API health: `https://your-project.vercel.app/api/health`
- Data is seeded from `data/seed-db.json` (resets on cold starts)

## Local test (Vercel-like)

```bash
npm install
npm run dev
```
