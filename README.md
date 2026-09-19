# Fullr

A polished food-rescue marketplace for college students and local businesses. Students can discover discounted surplus food, save favorites, and reserve a pickup while helping reduce food waste.

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Supabase offers

The offer feed is loaded from `Offers` and associated with `Stores` through
`store_id`. Copy `.env.example` to `.env.local`, then enter your Supabase
project URL and anon key. The app uses the placeholder URL and key by default
and shows a configuration message until those values are set.

The frontend intentionally uses only the anonymous key; configure Supabase Row
Level Security policies to allow the reads your app needs.
