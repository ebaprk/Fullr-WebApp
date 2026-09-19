# Fullr

A business-facing web app for posting live surplus-food offers. Students discover those offers in the separate Fullr iOS app. Both sides read and write through Supabase.

## Run locally

Create a `.env` file from `.env.example` and add your Supabase project URL and anon key. Then run the schema in `supabase/schema.sql` inside the Supabase SQL Editor.

```bash
npm install
npm run dev
```

Build for production with `npm run build`.
