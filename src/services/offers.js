import { isSupabaseConfigured, supabase } from './supabase'

const offerColumns = `
  offer_id,
  posted_time,
  offer_end_time,
  offer_completed,
  offer_description,
  store_id,
  views
`

const storeColumns = 'id, registered_at, name, address, description, store_type, image'

function requireConfiguration() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
}

async function attachStores(offers) {
  const storeIds = [...new Set(offers.map(offer => offer.store_id).filter(Boolean))]
  if (!storeIds.length) return offers.map(offer => ({ ...offer, store: null }))

  const { data: stores, error } = await supabase
    .from('Stores')
    .select(storeColumns)
    .in('id', storeIds)

  if (error) throw error

  const storesById = new Map(stores.map(store => [store.id, store]))
  return offers.map(offer => ({ ...offer, store: storesById.get(offer.store_id) ?? null }))
}

/** Returns incomplete offers that have not ended, newest first. */
export async function getAvailableOffers() {
  requireConfiguration()

  const { data, error } = await supabase
    .from('Offers')
    .select(offerColumns)
    .eq('offer_completed', false)
    .gte('offer_end_time', new Date().toISOString())
    .order('posted_time', { ascending: false })

  if (error) throw error
  return attachStores(data)
}

/** Returns one offer and its associated store. */
export async function getOffer(offerId) {
  requireConfiguration()

  const { data, error } = await supabase
    .from('Offers')
    .select(offerColumns)
    .eq('offer_id', offerId)
    .single()

  if (error) throw error
  return (await attachStores([data]))[0]
}

/** Increments the display counter for an offer. */
export async function incrementOfferViews(offerId, currentViews = 0) {
  requireConfiguration()

  const { data, error } = await supabase
    .from('Offers')
    .update({ views: Number(currentViews) + 1 })
    .eq('offer_id', offerId)
    .select('offer_id, views')
    .single()

  if (error) throw error
  return data
}
