import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { deleteFinanceDebt, updateFinanceDebt } from '@/lib/finance'
import { handleApi, HttpError, json, readJson } from '@/lib/http'
import { financeDebtUpdateSchema } from '@/lib/schemas'

export const Route = createFileRoute('/api/finance/debts/$debtId')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => handleApi(async () => {
        const id = Number(params.debtId)
        if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid debt id')
        const input = financeDebtUpdateSchema.parse(await readJson(request))
        const result = await updateFinanceDebt(id, input)
        if (!result) throw new HttpError(404, 'NOT_FOUND', 'Debt not found')
        await recordApiWrite('update', 'finance_debt', id, input)
        return json({ ok: true, data: result })
      }),
      DELETE: async ({ params }) => handleApi(async () => {
        const id = Number(params.debtId)
        if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid debt id')
        const existing = await db().prepare('SELECT id FROM finance_debts WHERE id = ?').bind(id).first<{ id: number }>()
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Debt not found')
        await deleteFinanceDebt(id)
        await recordApiWrite('delete', 'finance_debt', id)
        return json({ ok: true })
      }),
    },
  },
})
