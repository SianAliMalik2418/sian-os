import { env } from 'cloudflare:workers'
import { db } from './db'
import { HttpError, readJson } from './http'
import { recipeSchema, type RecipeInput } from './schemas'
import type { Recipe } from './types'

const maxRecipePhotoBytes = 8 * 1024 * 1024

export function recipeId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'INVALID_ID', 'Recipe id must be a positive integer')
  return id
}

export async function listRecipes(limit = 500) {
  const result = await db().prepare(`
    SELECT id, name, aliases, category, serving_description, calories, protein_grams, fat_grams, carb_grams, ingredients, notes, photo_r2_key, photo_content_type, created_at, updated_at
    FROM recipes
    ORDER BY name COLLATE NOCASE
    LIMIT ?
  `).bind(limit).all<Recipe>()
  return result.results
}

export async function readRecipe(id: number) {
  return db().prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first<Recipe>()
}

export async function recipeFromRequest(request: Request, existing?: Recipe | null) {
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return recipeFromJson(recipeSchema.parse(await readJson(request)), existing)
  return recipeFromForm(await request.formData(), existing)
}

export async function recipeFromForm(form: FormData, existing?: Recipe | null) {
  const name = formText(form, 'name')
  const aliases = formText(form, 'aliases')
  const category = formText(form, 'category')
  const servingDescription = formText(form, 'serving_description')
  const ingredients = formText(form, 'ingredients')
  const notes = formText(form, 'notes')
  const calories = formInt(form, 'calories', 0, 20000)
  const proteinGrams = formInt(form, 'protein_grams', 0, 2000)
  const fatGrams = formOptionalInt(form, 'fat_grams', 0, 2000)
  const carbGrams = formOptionalInt(form, 'carb_grams', 0, 2000)
  const photo = form.get('photo')

  if (!name) throw new HttpError(400, 'NAME_REQUIRED', 'Recipe name is required')

  let photoKey = existing?.photo_r2_key || null
  let photoContentType = existing?.photo_content_type || null
  let oldPhotoKey: string | null = null

  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith('image/')) throw new HttpError(400, 'INVALID_PHOTO', 'Only image files are accepted')
    if (photo.size > maxRecipePhotoBytes) throw new HttpError(413, 'PHOTO_TOO_LARGE', 'Recipe photos must be 8 MB or smaller')
    oldPhotoKey = existing?.photo_r2_key || null
    const extension = photo.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'image'
    photoKey = `recipes/${crypto.randomUUID()}.${extension}`
    photoContentType = photo.type
    await env.FILES.put(photoKey, photo.stream(), { httpMetadata: { contentType: photo.type }, customMetadata: { originalName: photo.name } })
  }

  return {
    values: {
      name,
      aliases: optionalValue(aliases),
      category: optionalValue(category),
      serving_description: optionalValue(servingDescription),
      calories,
      protein_grams: proteinGrams,
      fat_grams: fatGrams,
      carb_grams: carbGrams,
      ingredients: optionalValue(ingredients),
      notes: optionalValue(notes),
      photo_r2_key: photoKey,
      photo_content_type: photoContentType,
    },
    oldPhotoKey,
    newPhotoKey: photoKey && photoKey !== existing?.photo_r2_key ? photoKey : null,
  }
}

function recipeFromJson(input: RecipeInput, existing?: Recipe | null) {
  return {
    values: {
      name: input.name,
      aliases: optionalValue(input.aliases || ''),
      category: optionalValue(input.category || ''),
      serving_description: optionalValue(input.serving_description || ''),
      calories: input.calories,
      protein_grams: input.protein_grams,
      fat_grams: input.fat_grams ?? 0,
      carb_grams: input.carb_grams ?? 0,
      ingredients: optionalValue(input.ingredients || ''),
      notes: optionalValue(input.notes || ''),
      photo_r2_key: existing?.photo_r2_key || null,
      photo_content_type: existing?.photo_content_type || null,
    },
    oldPhotoKey: null,
    newPhotoKey: null,
  }
}

function optionalValue(value: string) {
  return value === '' ? null : value
}

function formText(form: FormData, key: string) {
  return String(form.get(key) || '').trim().slice(0, key === 'ingredients' || key === 'notes' ? 2000 : 500)
}

function formInt(form: FormData, key: string, min: number, max: number) {
  const raw = String(form.get(key) || '').trim()
  const value = Number(raw)
  if (!Number.isInteger(value) || value < min || value > max) throw new HttpError(400, 'INVALID_NUMBER', `${key} must be an integer from ${min} to ${max}`)
  return value
}

function formOptionalInt(form: FormData, key: string, min: number, max: number) {
  const raw = String(form.get(key) || '').trim()
  if (!raw) return 0
  const value = Number(raw)
  if (!Number.isInteger(value) || value < min || value > max) throw new HttpError(400, 'INVALID_NUMBER', `${key} must be an integer from ${min} to ${max}`)
  return value
}
