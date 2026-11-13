# NVIDIA vs Crypto Market Cap Tracker

A small dashboard that compares NVIDIA's market capitalization with the total cryptocurrency market cap.

**Live:** [gokhan-market-cap-tracker.pages.dev](https://gokhan-market-cap-tracker.pages.dev/)

The page is a static Next.js export on Cloudflare Pages. NVIDIA's quote comes from a Pages Function at `/api/nvidia`, which tries Alpha Vantage when the `ALPHA_VANTAGE_API_KEY` secret is set and otherwise uses the keyless Yahoo Finance chart API. Quotes are cached for one hour. Crypto totals come from CoinGecko's public API in the browser.

## Develop

```bash
npm install
npm run dev
```

The Next.js dev server does not run the Pages Function. To exercise `/api/nvidia` locally:

```bash
npx wrangler pages dev --compatibility-date=2026-11-13
```

## Deploy

```bash
npm run build
npx wrangler pages deploy out --project-name=gokhan-market-cap-tracker
```

To use your own Alpha Vantage key (optional — Yahoo is the default fallback):

```bash
npx wrangler pages secret put ALPHA_VANTAGE_API_KEY --project-name=gokhan-market-cap-tracker
```

The previous Vercel deployment at `market-cap-tracker.vercel.app` can be deleted once this Cloudflare URL is confirmed.
