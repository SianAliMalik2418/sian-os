import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { deleteFinanceCategory } from '@/lib/finance'
import { handleApi, HttpError, json } from '@/lib/http'

export const Route = createFileRoute('/api/finance/categories/$categoryId')({
  server: {
    handlers: {
      DELETE: async ({ params }) => handleApi(async () => {
        const id = Number(params.categoryId)
        if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid category id')
        const existing = await db().prepare('SELECT id FROM finance_categories WHERE id = ?').bind(id).first<{ id: number }>()
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Category not found')
        await deleteFinanceCategory(id)
        await recordApiWrite('delete', 'finance_category', id)
        return json({ ok: true })
      }),
    },
  },
})
