import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/lib/db'
import { handleApi, HttpError } from '@/lib/http'
import { recipeId } from '@/lib/recipes'

export const Route = createFileRoute('/api/recipes/$recipeId/photo')({
  server: {
    handlers: {
      GET: async ({ params }) => handleApi(async () => {
        const recipe = await db().prepare('SELECT photo_r2_key FROM recipes WHERE id = ?').bind(recipeId(params.recipeId)).first<{ photo_r2_key: string | null }>()
        if (!recipe?.photo_r2_key) throw new HttpError(404, 'NOT_FOUND', 'Recipe photo not found')
        const object = await env.FILES.get(recipe.photo_r2_key)
        if (!object) throw new HttpError(404, 'OBJECT_NOT_FOUND', 'Recipe photo object not found')
        const headers = new Headers({ 'Cache-Control': 'public, max-age=3600', ETag: object.httpEtag })
        object.writeHttpMetadata(headers)
        return new Response(object.body, { headers })
      }),
    },
  },
})
