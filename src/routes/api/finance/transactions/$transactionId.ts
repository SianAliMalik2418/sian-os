import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { deleteFinanceTransaction } from '@/lib/finance'
import { handleApi, HttpError, json } from '@/lib/http'

export const Route = createFileRoute('/api/finance/transactions/$transactionId')({
  server: {
    handlers: {
      DELETE: async ({ params }) => handleApi(async () => {
        const id = Number(params.transactionId)
        if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid transaction id')
        const existing = await db().prepare('SELECT id FROM finance_transactions WHERE id = ?').bind(id).first<{ id: number }>()
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Transaction not found')
        await deleteFinanceTransaction(id)
        await recordApiWrite('delete', 'finance_transaction', id)
        return json({ ok: true })
      }),
    },
  },
})
