import { createFileRoute } from '@tanstack/react-router'
import { recordApiWrite } from '@/lib/db'
import { createFinanceDebt, listFinanceDebts } from '@/lib/finance'
import { handleApi, json, readJson } from '@/lib/http'
import { financeDebtSchema } from '@/lib/schemas'

export const Route = createFileRoute('/api/finance/debts')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => json({ ok: true, data: await listFinanceDebts() })),
      POST: async ({ request }) => handleApi(async () => {
        const input = financeDebtSchema.parse(await readJson(request))
        const result = await createFinanceDebt(input)
        await recordApiWrite('create', 'finance_debt', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
    },
  },
})
