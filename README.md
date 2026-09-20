# Fullr

A business-facing web app for posting live surplus-food offers. Students discover those offers in the separate Fullr iOS app. Both sides read and write through Supabase.

## Run locally

Create a `.env` file from `.env.example` and add your Supabase project URL and anon key. Then run the schema in `supabase/schema.sql` inside the Supabase SQL Editor.

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Supabase data model

- `auth.users` holds every authenticated account.
- `Users` holds business-owner profiles only; each web registration creates a
  linked `Stores` record through `Stores.owner_id`.
- `Offers.store_id` references `Stores.id`.

Student-profile creation belongs to the separate iOS/mobile codebase. This web
repository only creates and manages business-owner accounts and stores.

## Supabase offers

The offer feed is loaded from `Offers` and associated with `Stores` through
`store_id`. Copy `.env.example` to `.env.local`, then enter your Supabase
project URL and anon key. The app uses the placeholder URL and key by default
and shows a configuration message until those values are set.

The frontend intentionally uses only the anonymous key; configure Supabase Row
Level Security policies to allow the reads your app needs.
