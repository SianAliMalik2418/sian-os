import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  deleting = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  deleting?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogPanel><p className="text-sm text-muted-foreground">This action cannot be undone.</p></DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button type="button" variant="destructive" loading={deleting} onClick={onConfirm}><Trash2 /> {confirmLabel}</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
