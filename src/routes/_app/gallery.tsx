import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Camera, ImagePlus, Images, Trash2, Upload } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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

  async function submit(event: FormEvent<HTMLFormElement>, source: 'gallery' | 'camera') {
    event.preventDefault()
    await uploadPhoto(source, source === 'gallery' ? galleryFileRef : cameraFileRef)
  }

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
    <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Gallery</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Progress photos by date.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">A dated timeline of your uploaded progress pictures.</p>
        </div>
        <div className="rounded-2xl border bg-secondary/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total photos</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{photos.length}</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div><CardTitle>Add photo</CardTitle><CardDescription>Choose a date, then upload from photos or capture from camera.</CardDescription></div>
          <CardAction><ImagePlus className="size-5 text-primary" /></CardAction>
        </CardHeader>
        <CardPanel>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel>Date</FieldLabel><DatePicker value={date} onValueChange={setDate} required /></Field>
              <Field><FieldLabel>Label</FieldLabel><Input nativeInput value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Front, side, month 3" /></Field>
              <div className="sm:col-span-2"><Field><FieldLabel>Notes</FieldLabel><Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context" /></Field></div>
            </div>

            <div className="grid gap-3">
              <Form onSubmit={(event) => submit(event, 'gallery')} className="rounded-xl border bg-background/60 p-3">
                <Field>
                  <FieldLabel>Upload from gallery</FieldLabel>
                  <Input ref={galleryFileRef} nativeInput type="file" accept="image/*" />
                  <FieldDescription>Use an existing image from your photo library.</FieldDescription>
                </Field>
                <Button type="submit" className="mt-3 w-full" loading={savingSource === 'gallery'} disabled={savingSource !== null}><Upload /> Upload gallery photo</Button>
              </Form>

              <Form onSubmit={(event) => submit(event, 'camera')} className="rounded-xl border bg-background/60 p-3">
                <Field>
                  <FieldLabel>Take live photo</FieldLabel>
                  <Input ref={cameraFileRef} nativeInput type="file" accept="image/*" capture="environment" />
                  <FieldDescription>Opens the device camera when the browser supports it.</FieldDescription>
                </Field>
                <Button type="submit" variant="outline" className="mt-3 w-full" loading={savingSource === 'camera'} disabled={savingSource !== null}><Camera /> Upload camera photo</Button>
              </Form>
            </div>
          </div>
        </CardPanel>
      </Card>

      {status && <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">{status}</p>}
      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}

      {groups.length ? (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.date} className="space-y-3">
              <div className="flex items-end justify-between gap-3 border-b pb-2">
                <div>
                  <h2 className="font-heading text-xl font-semibold">{formatPhotoDate(group.date)}</h2>
                  <p className="text-sm text-muted-foreground">{group.photos.length} photo{group.photos.length === 1 ? '' : 's'}</p>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.date}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.photos.map((photo) => (
                  <figure key={photo.id} className="group relative overflow-hidden rounded-2xl border bg-card">
                    <img src={`/api/progress-photos/${photo.id}`} alt={photo.label || `Progress photo from ${group.date}`} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                    <figcaption className="min-h-16 p-3">
                      <p className="truncate text-sm font-medium">{photo.label || 'Progress photo'}</p>
                      {photo.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{photo.notes}</p>}
                    </figcaption>
                    <Button type="button" size="icon-sm" variant="destructive" className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" loading={deletingId === photo.id} disabled={deletingId !== null} onClick={() => deletePhoto(photo)} aria-label="Delete photo"><Trash2 /></Button>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Images /></EmptyMedia>
              <EmptyTitle>No progress photos yet</EmptyTitle>
              <EmptyDescription>Add your first photo above and it will appear in a dated section here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        </Card>
      )}
    </div>
  )
}

function formatPhotoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}
