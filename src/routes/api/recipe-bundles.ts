import { createFileRoute } from '@tanstack/react-router'
import { recordApiWrite } from '@/lib/db'
import { createRecipeBundle, listRecipeBundles, recipeBundleFromRequest } from '@/lib/recipe-bundles'
import { handleApi, json } from '@/lib/http'

export const Route = createFileRoute('/api/recipe-bundles')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => {
        return json({ ok: true, data: await listRecipeBundles() })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = await recipeBundleFromRequest(request)
        const bundle = await createRecipeBundle(input)
        await recordApiWrite('create', 'recipe_bundle', bundle.id, { name: bundle.name, recipes: bundle.recipes.map((recipe) => ({ recipe_id: recipe.id, default_quantity: recipe.default_quantity })) })
        return json({ ok: true, data: bundle }, { status: 201 })
      }),
    },
  },
})
