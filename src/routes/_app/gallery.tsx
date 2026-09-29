import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Camera, ImagePlus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { HeaderIllustration } from '@/components/sunrise/illustrations'
import { Notice, Page, PageHeader } from '@/components/sunrise/primitives'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getProgressPhotos } from '@/lib/app.functions'
import type { ProgressPhoto } from '@/lib/types'

export const Route = createFileRoute('/_app/gallery')({
  loader: () => getProgressPhotos(),
  component: GalleryPage,
})

const today = () => new Date().toISOString().slice(0, 10)

function GalleryPage() {
  const photos = Route.useLoaderData()
  const router = useRouter()
  const galleryFileRef = useRef<HTMLInputElement>(null)
  const cameraFileRef = useRef<HTMLInputElement>(null)
  const [savingSource, setSavingSource] = useState<'gallery' | 'camera' | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProgressPhoto | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null)
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()

  async function uploadPhoto(source: 'gallery' | 'camera', inputRef: RefObject<HTMLInputElement | null>) {
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setError(source === 'gallery' ? 'Choose a photo from your gallery first.' : 'Take a camera photo first.')
      setStatus(undefined)
      return
    }

    setSavingSource(source)
    setError(undefined)
    setStatus(undefined)
    const form = new FormData()
    form.set('date', today())
    form.set('photo', file)

    try {
      const response = await fetch('/api/progress-photos', { method: 'POST', body: form })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not upload photo')
      clearUploadInputs()
      setStatus('Photo uploaded.')
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload photo')
    } finally {
      setSavingSource(null)
    }
  }

  async function confirmDeletePhoto() {
    if (!deleteTarget) return
    const photo = deleteTarget
    setDeletingId(photo.id)
    setError(undefined)
    setStatus(undefined)

    try {
      const response = await fetch(`/api/progress-photos/${photo.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json() as { error?: { message?: string } }
        throw new Error(result.error?.message || 'Could not delete photo')
      }
      setStatus('Photo deleted.')
      setDeleteTarget(null)
      if (viewingPhoto?.id === photo.id) setViewingPhoto(null)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete photo')
    } finally {
      setDeletingId(null)
    }
  }

  function clearUploadInputs() {
    if (galleryFileRef.current) galleryFileRef.current.value = ''
    if (cameraFileRef.current) cameraFileRef.current.value = ''
  }

  return (
    <Page>
      <PageHeader
        kicker="Gallery"
        title="Progress, framed."
        description="Your progress photo timeline."
        illustration="gallery"
        aside={<span className="rounded-full bg-white/8 px-3.5 py-1.5 text-sm font-extrabold text-cream">{photos.length} photo{photos.length === 1 ? '' : 's'}</span>}
      />

      <section className="rise space-y-4 rounded-[1.8rem] border border-white/8 bg-card p-4 sm:p-5" style={{ '--d': 1 } as CSSProperties}>
        <div className="grid grid-cols-2 gap-3">
          <UploadTile tone="sun" icon={Camera} title="Take photo" subtitle="Opens the camera" loading={savingSource === 'camera'} disabled={savingSource !== null}>
            <input ref={cameraFileRef} type="file" accept="image/*" capture="environment" className="sr-only" disabled={savingSource !== null} onChange={() => uploadPhoto('camera', cameraFileRef)} />
          </UploadTile>
          <UploadTile tone="lilac" icon={ImagePlus} title="From library" subtitle="Pick an existing shot" loading={savingSource === 'gallery'} disabled={savingSource !== null}>
            <input ref={galleryFileRef} type="file" accept="image/*" className="sr-only" disabled={savingSource !== null} onChange={() => uploadPhoto('gallery', galleryFileRef)} />
          </UploadTile>
        </div>
      </section>

      {status && <Notice tone="status">{status}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {photos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <figure key={photo.id} className="group relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-card">
              <button type="button" onClick={() => setViewingPhoto(photo)} className="block w-full" aria-label="View photo full screen">
                <img
                  src={`/api/progress-photos/${photo.id}`}
                  alt="Progress photo"
                  width={480}
                  height={640}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading={index < 8 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index < 4 ? 'high' : 'auto'}
                />
              </button>
              <Button type="button" size="icon-sm" variant="destructive" className="absolute top-2 right-2 rounded-full sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" loading={deletingId === photo.id} disabled={deletingId !== null} onClick={() => setDeleteTarget(photo)} aria-label="Delete photo"><Trash2 /></Button>
            </figure>
          ))}
        </div>
      ) : (
        <div className="grid place-items-center gap-2 rounded-[1.8rem] border border-dashed border-white/12 px-6 py-14 text-center">
          <HeaderIllustration kind="gallery" className="w-32" />
          <p className="mt-2 text-lg font-extrabold text-cream">No photos yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">Snap your first one above. Future you will be glad you did.</p>
        </div>
      )}

      <PhotoLightbox photo={viewingPhoto} onClose={() => setViewingPhoto(null)} onDelete={(photo) => setDeleteTarget(photo)} />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete photo?"
        description="This permanently removes this progress photo."
        confirmLabel="Delete photo"
        deleting={deletingId !== null}
        onConfirm={confirmDeletePhoto}
      />
    </Page>
  )
}

function PhotoLightbox({ photo, onClose, onDelete }: { photo: ProgressPhoto | null; onClose: () => void; onDelete: (photo: ProgressPhoto) => void }) {
  useEffect(() => {
    if (!photo) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [photo, onClose])

  if (!photo) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <img src={`/api/progress-photos/${photo.id}`} alt="Progress photo" className="max-h-full max-w-full rounded-2xl object-contain" onClick={(event) => event.stopPropagation()} />
      <div className="absolute top-4 right-4 flex gap-2">
        <Button type="button" size="icon" variant="secondary" className="rounded-full" onClick={() => onDelete(photo)} aria-label="Delete photo"><Trash2 /></Button>
        <Button type="button" size="icon" variant="secondary" className="rounded-full" onClick={onClose} aria-label="Close full screen view"><X /></Button>
      </div>
    </div>
  )
}

function UploadTile({ tone, icon: Icon, title, subtitle, loading, disabled, children }: { tone: 'sun' | 'lilac'; icon: typeof Camera; title: string; subtitle: string; loading: boolean; disabled: boolean; children: ReactNode }) {
  const toneClass = tone === 'sun' ? 'border-sun/25 bg-[linear-gradient(150deg,rgb(255_107_44/.22),rgb(255_107_44/.05))] text-sun' : 'border-lilac/25 bg-[linear-gradient(150deg,rgb(167_139_250/.22),rgb(167_139_250/.05))] text-lilac'
  return (
    <label className={`relative flex min-h-32 cursor-pointer flex-col justify-between rounded-[1.5rem] border p-4 transition-transform active:scale-[.97] focus-within:ring-2 focus-within:ring-ring ${toneClass} ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      {children}
      <span className="grid size-11 place-items-center rounded-2xl bg-white/10">{loading ? <Spinner className="size-5" /> : <Icon className="size-5" strokeWidth={2.4} />}</span>
      <span><span className="block font-extrabold text-cream">{loading ? 'Uploading…' : title}</span><span className="block text-xs font-semibold text-muted-foreground">{subtitle}</span></span>
    </label>
  )
}
