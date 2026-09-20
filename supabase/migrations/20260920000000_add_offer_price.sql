alter table public."Offers"
  add column if not exists offer_price numeric(10, 2);

alter table public."Offers"
  drop constraint if exists offers_offer_price_non_negative;

alter table public."Offers"
  add constraint offers_offer_price_non_negative
  check (offer_price is null or offer_price >= 0);