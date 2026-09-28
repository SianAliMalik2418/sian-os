import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Camera, ImagePlus, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { HeaderIllustration } from '@/components/sunrise/illustrations'
import { Notice, Page, PageHeader, SectionTitle } from '@/components/sunrise/primitives'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { getProgressPhotos } from '@/lib/app.functions'
import { groupProgressPhotosByDate } from '@/lib/progress-photos'
import type { ProgressPhoto } from '@/lib/types'

export const Route = createFileRoute('/_app/gallery')({
  loader: () => getProgressPhotos(),
  component: GalleryPage,
})

const today = () => new Date().toISOString().slice(0, 10)
const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

function GalleryPage() {
  const photos = Route.useLoaderData()
  const router = useRouter()
  const galleryFileRef = useRef<HTMLInputElement>(null)
  const cameraFileRef = useRef<HTMLInputElement>(null)
  const [date, setDate] = useState(() => today())
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [savingSource, setSavingSource] = useState<'gallery' | 'camera' | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()
  const groups = useMemo(() => groupProgressPhotosByDate(photos), [photos])

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
    form.set('date', date)
    form.set('label', label)
    form.set('notes', notes)
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

  async function deletePhoto(photo: ProgressPhoto) {
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
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete photo')
    } finally {
      setDeletingId(null)
    }
  }

  function clearUploadInputs() {
    setLabel('')
    setNotes('')
    if (galleryFileRef.current) galleryFileRef.current.value = ''
    if (cameraFileRef.current) cameraFileRef.current.value = ''
  }

  return (
    <Page>
      <PageHeader
        kicker="Gallery"
        title="Progress, framed."
        description="A dated timeline of your progress photos."
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Field><FieldLabel>Date</FieldLabel><DatePicker value={date} onValueChange={setDate} required /></Field>
          <Field><FieldLabel>Label</FieldLabel><Input nativeInput value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Front, side, month 3" /></Field>
          <div className="sm:col-span-2"><Field><FieldLabel>Notes</FieldLabel><Textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context" /></Field></div>
        </div>
        <p className="px-1 text-xs font-semibold text-muted-foreground">Set the date and label first. The photo uploads as soon as you pick it.</p>
      </section>

      {status && <Notice tone="status">{status}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {groups.length ? (
        <div className="space-y-6">
          {groups.map((group, groupIndex) => (
            <section key={group.date} className="rise space-y-3" style={{ '--d': Math.min(groupIndex, 6) + 2 } as CSSProperties}>
              <SectionTitle title={formatPhotoDate(group.date)} meta={`${group.photos.length} photo${group.photos.length === 1 ? '' : 's'}`} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.photos.map((photo) => (
                  <figure key={photo.id} className="group relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-card">
                    <img src={`/api/progress-photos/${photo.id}`} alt={photo.label || `Progress photo from ${group.date}`} className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgb(18_15_36/.92))] px-3 pt-8 pb-3">
                      <p className="truncate text-sm font-extrabold text-cream">{photo.label || 'Progress photo'}</p>
                      {photo.notes && <p className="line-clamp-1 text-xs font-medium text-cream/70">{photo.notes}</p>}
                    </figcaption>
                    <Button type="button" size="icon-sm" variant="destructive" className="absolute top-2 right-2 rounded-full sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" loading={deletingId === photo.id} disabled={deletingId !== null} onClick={() => deletePhoto(photo)} aria-label="Delete photo"><Trash2 /></Button>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid place-items-center gap-2 rounded-[1.8rem] border border-dashed border-white/12 px-6 py-14 text-center">
          <HeaderIllustration kind="gallery" className="w-32" />
          <p className="mt-2 text-lg font-extrabold text-cream">No photos yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">Snap your first one above. Future you will be glad you did.</p>
        </div>
      )}
    </Page>
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

function formatPhotoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}
