import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'
import { readRecipe, recipeFromRequest, recipeId } from '@/lib/recipes'
import type { Recipe } from '@/lib/types'

export const Route = createFileRoute('/api/recipes/$recipeId')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => handleApi(async () => {
        const id = recipeId(params.recipeId)
        const existing = await readRecipe(id)
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Recipe not found')
        const parsed = await recipeFromRequest(request, existing)
        try {
          const result = await db().prepare(`
            UPDATE recipes
            SET name = ?, aliases = ?, category = ?, serving_description = ?, calories = ?, protein_grams = ?, fat_grams = ?, carb_grams = ?, ingredients = ?, notes = ?, photo_r2_key = ?, photo_content_type = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *
          `).bind(parsed.values.name, parsed.values.aliases, parsed.values.category, parsed.values.serving_description, parsed.values.calories, parsed.values.protein_grams, parsed.values.fat_grams, parsed.values.carb_grams, parsed.values.ingredients, parsed.values.notes, parsed.values.photo_r2_key, parsed.values.photo_content_type, id).first<Recipe>()
          if (parsed.oldPhotoKey) await env.FILES.delete(parsed.oldPhotoKey)
          await recordApiWrite('update', 'recipe', id, { name: parsed.values.name, calories: parsed.values.calories, protein_grams: parsed.values.protein_grams, fat_grams: parsed.values.fat_grams, carb_grams: parsed.values.carb_grams })
          return json({ ok: true, data: result })
        } catch (error) {
          if (parsed.newPhotoKey) await env.FILES.delete(parsed.newPhotoKey)
          throw error
        }
      }),
      DELETE: async ({ params }) => handleApi(async () => {
        const id = recipeId(params.recipeId)
        const recipe = await readRecipe(id)
        if (!recipe) throw new HttpError(404, 'NOT_FOUND', 'Recipe not found')
        if (recipe.photo_r2_key) await env.FILES.delete(recipe.photo_r2_key)
        await db().prepare('DELETE FROM recipes WHERE id = ?').bind(id).run()
        await recordApiWrite('delete', 'recipe', id, { name: recipe.name })
        return json({ ok: true })
      }),
    },
  },
})
