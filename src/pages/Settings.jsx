import React, { useEffect, useRef, useState } from 'react'
import { Camera, Check } from 'lucide-react'
import { DashNav } from '../components/DashNav'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadStoreImage } from '../lib/storage'

const storeTypes = ['Pantry', 'Business', 'Campus', 'Restaurant']

export function Settings() {
  const { store, user, refreshStore } = useAuth()
  const fileInput = useRef(null)
  const dragDepth = useRef(0)
  const [form, setForm] = useState({
    name: '',
    store_type: 'Business',
    address: '',
    description: '',
    image: ''
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [draggingPhoto, setDraggingPhoto] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!store) return
    setForm({
      name: store.name || '',
      store_type: store.store_type || 'Business',
      address: store.address || '',
      description: store.description || '',
      image: store.image || ''
    })
    setPhotoPreview(store.image || '')
    setPhotoFile(null)
  }, [store])

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const onPickPhoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
    setInfo('')
  }

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read that photo.'))
    reader.readAsDataURL(file)
  })

  const onDropPhoto = (event) => {
    event.preventDefault()
    dragDepth.current = 0
    setDraggingPhoto(false)

    const file = event.dataTransfer.files?.[0]
    if (!file) return

    const transfer = new DataTransfer()
    transfer.items.add(file)
    onPickPhoto({ target: { files: transfer.files, value: '' } })
  }

  const onDragEnterPhoto = (event) => {
    event.preventDefault()
    dragDepth.current += 1
    setDraggingPhoto(true)
  }

  const onDragLeavePhoto = (event) => {
    event.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDraggingPhoto(false)
  }

  const onDragOverPhoto = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const onSave = async (event) => {
    event.preventDefault()
    setError('')
    setInfo('')
    if (!store?.id) {
      setError('Your store profile is still loading. Please try again in a moment.')
      return
    }

    setSaving(true)
    try {
      let imageUrl = form.image.trim() || null
      if (photoFile) {
        try {
          imageUrl = await uploadStoreImage(user.id, photoFile)
        } catch (uploadError) {
          const message = uploadError?.message || ''
          const bucketMissing = /bucket|not found|storage/i.test(message)
          if (!bucketMissing) throw uploadError
          imageUrl = await readFileAsDataUrl(photoFile)
        }
      }

      const { error: updateError } = await supabase
        .from('Stores')
        .update({
          name: form.name.trim(),
          store_type: form.store_type,
          address: form.address.trim() || null,
          description: form.description.trim() || null,
          image: imageUrl
        })
        .eq('id', store.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setPhotoFile(null)
      await refreshStore()
      setInfo('Settings saved.')
    } catch (saveError) {
      setError(saveError.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash-shell">
      <DashNav />
      <main className="dash-main">
        <section className="dash-intro">
          <div>
            <span className="eyebrow">Store settings</span>
            <h1>Your shop profile.</h1>
            <p>Update the details students see in the Fullr iOS app, including your store photo.</p>
          </div>
        </section>

        <form className="offer-form settings-form" onSubmit={onSave}>
          <div
            className={`photo-dropzone ${draggingPhoto ? 'dragging' : ''}`}
            onDragEnter={onDragEnterPhoto}
            onDragLeave={onDragLeavePhoto}
            onDragOver={onDragOverPhoto}
            onDrop={onDropPhoto}
          >
            <div
              className="photo-preview"
              style={photoPreview ? { backgroundImage: `url(${photoPreview})` } : undefined}
            >
              {!photoPreview && <Camera size={28} />}
            </div>
            <div className="photo-drop-copy">
              <span className="eyebrow">Profile photo</span>
              <h2>Show students your shop</h2>
              <p>Drag a photo here or click to upload. JPG, PNG, or WebP, up to 5MB.</p>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={onPickPhoto} />
              <button type="button" className="secondary-file-btn" onClick={() => fileInput.current?.click()}>
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Store name
              <input value={form.name} onChange={update('name')} required />
            </label>
            <label>
              Category
              <select value={form.store_type} onChange={update('store_type')}>
                {storeTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="span-2">
              Address
              <input value={form.address} onChange={update('address')} placeholder="123 College Ave" />
            </label>
            <label className="span-2">
              Store description
              <textarea value={form.description} onChange={update('description')} rows={4} placeholder="Tell students what your store offers." />
            </label>
            <label className="span-2">
              Or paste an image URL
              <input
                type="url"
                value={form.image}
                onChange={(event) => {
                  setPhotoFile(null)
                  update('image')(event)
                  setPhotoPreview(event.target.value)
                }}
                placeholder="https://…"
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}
          {info && <p className="form-info"><Check size={14} /> {info}</p>}
          <button className="primary-wide" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </main>
    </div>
  )
}
