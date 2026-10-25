import { createFileRoute } from '@tanstack/react-router'
import { createFinanceCategory, listFinanceCategories } from '@/lib/finance'
import { handleApi, json, readJson } from '@/lib/http'
import { recordApiWrite } from '@/lib/db'
import { financeCategorySchema } from '@/lib/schemas'

export const Route = createFileRoute('/api/finance/categories')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => json({ ok: true, data: await listFinanceCategories() })),
      POST: async ({ request }) => handleApi(async () => {
        const input = financeCategorySchema.parse(await readJson(request))
        const result = await createFinanceCategory(input)
        await recordApiWrite('create', 'finance_category', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
    },
  },
})
