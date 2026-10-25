import { createFileRoute } from '@tanstack/react-router'
import { recordApiWrite } from '@/lib/db'
import { createFinanceTransaction, listFinanceTransactions } from '@/lib/finance'
import { handleApi, json, readJson } from '@/lib/http'
import { financeTransactionSchema } from '@/lib/schemas'

export const Route = createFileRoute('/api/finance/transactions')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const url = new URL(request.url)
        const from = url.searchParams.get('from') ?? undefined
        const to = url.searchParams.get('to') ?? undefined
        return json({ ok: true, data: await listFinanceTransactions({ from, to }) })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = financeTransactionSchema.parse(await readJson(request))
        const result = await createFinanceTransaction(input)
        await recordApiWrite('create', 'finance_transaction', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
    },
  },
})
