import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'
import { recipeBundleFromRequest, recipeBundleId, readRecipeBundle, updateRecipeBundle } from '@/lib/recipe-bundles'

export const Route = createFileRoute('/api/recipe-bundles/$bundleId')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => handleApi(async () => {
        const id = recipeBundleId(params.bundleId)
        const existing = await readRecipeBundle(id)
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Recipe bundle not found')
        const input = await recipeBundleFromRequest(request)
        const bundle = await updateRecipeBundle(id, input)
        await recordApiWrite('update', 'recipe_bundle', id, { name: bundle.name, recipes: bundle.recipes.map((recipe) => ({ recipe_id: recipe.id, default_quantity: recipe.default_quantity })) })
        return json({ ok: true, data: bundle })
      }),
      DELETE: async ({ params }) => handleApi(async () => {
        const id = recipeBundleId(params.bundleId)
        const existing = await readRecipeBundle(id)
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Recipe bundle not found')
        await db().prepare('DELETE FROM recipe_bundles WHERE id = ?').bind(id).run()
        await recordApiWrite('delete', 'recipe_bundle', id, { name: existing.name })
        return json({ ok: true })
      }),
    },
  },
})
