import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, json } from '@/lib/http'
import { listRecipes, recipeFromForm } from '@/lib/recipes'
import type { Recipe } from '@/lib/types'

export const Route = createFileRoute('/api/recipes')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => {
        return json({ ok: true, data: await listRecipes() })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const parsed = await recipeFromForm(await request.formData())
        try {
          const result = await db().prepare(`
            INSERT INTO recipes (name, aliases, category, serving_description, calories, protein_grams, ingredients, notes, photo_r2_key, photo_content_type, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            RETURNING *
          `).bind(parsed.values.name, parsed.values.aliases, parsed.values.category, parsed.values.serving_description, parsed.values.calories, parsed.values.protein_grams, parsed.values.ingredients, parsed.values.notes, parsed.values.photo_r2_key, parsed.values.photo_content_type).first<Recipe>()
          await recordApiWrite('create', 'recipe', result?.id, { name: parsed.values.name, calories: parsed.values.calories, protein_grams: parsed.values.protein_grams })
          return json({ ok: true, data: result }, { status: 201 })
        } catch (error) {
          if (parsed.newPhotoKey) await env.FILES.delete(parsed.newPhotoKey)
          throw error
        }
      }),
    },
  },
})
