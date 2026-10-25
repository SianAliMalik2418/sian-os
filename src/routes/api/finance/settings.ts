import { createFileRoute } from '@tanstack/react-router'
import { recordApiWrite } from '@/lib/db'
import { getFinanceSettings, updateFinanceSettings } from '@/lib/finance'
import { handleApi, json, readJson } from '@/lib/http'
import { financeSettingsSchema } from '@/lib/schemas'

export const Route = createFileRoute('/api/finance/settings')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => json({ ok: true, data: await getFinanceSettings() })),
      PUT: async ({ request }) => handleApi(async () => {
        const input = financeSettingsSchema.parse(await readJson(request))
        const result = await updateFinanceSettings(input)
        await recordApiWrite('update', 'finance_settings', 1, input)
        return json({ ok: true, data: result })
      }),
    },
  },
})
