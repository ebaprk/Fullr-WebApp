import { supabase } from './supabase'

const BUCKET = 'store-images'

export async function uploadStoreImage(userId, file) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!file) throw new Error('Choose a photo to upload.')
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Please use a photo smaller than 5MB.')

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${userId}/profile-${Date.now()}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('Could not get a public URL for that photo.')
  return data.publicUrl
}
