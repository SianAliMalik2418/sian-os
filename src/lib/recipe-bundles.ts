import { db } from './db'
import { HttpError, readJson } from './http'
import { recipeBundleSchema, type RecipeBundleInput } from './schemas'
import type { RecipeBundle } from './types'

export function recipeBundleId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'INVALID_ID', 'Recipe bundle id must be a positive integer')
  return id
}

export async function listRecipeBundles(limit = 500) {
  const database = db()
  const result = await database.prepare(`
    SELECT
      b.id AS bundle_id,
      b.name AS bundle_name,
      b.notes AS bundle_notes,
      b.created_at AS bundle_created_at,
      b.updated_at AS bundle_updated_at,
      i.id AS bundle_item_id,
      i.recipe_id,
      i.default_quantity,
      i.position,
      r.id,
      r.name,
      r.aliases,
      r.category,
      r.serving_description,
      r.calories,
      r.protein_grams,
      r.fat_grams,
      r.carb_grams,
      r.ingredients,
      r.notes,
      r.photo_r2_key,
      r.photo_content_type,
      r.created_at,
      r.updated_at
    FROM recipe_bundles b
    LEFT JOIN recipe_bundle_items i ON i.bundle_id = b.id
    LEFT JOIN recipes r ON r.id = i.recipe_id
    ORDER BY b.name COLLATE NOCASE, i.position, i.id
    LIMIT ?
  `).bind(limit).all<RecipeBundleRow>()
  return bundlesFromRows(result.results)
}

export async function readRecipeBundle(id: number) {
  const database = db()
  const result = await database.prepare(`
    SELECT
      b.id AS bundle_id,
      b.name AS bundle_name,
      b.notes AS bundle_notes,
      b.created_at AS bundle_created_at,
      b.updated_at AS bundle_updated_at,
      i.id AS bundle_item_id,
      i.recipe_id,
      i.default_quantity,
      i.position,
      r.id,
      r.name,
      r.aliases,
      r.category,
      r.serving_description,
      r.calories,
      r.protein_grams,
      r.fat_grams,
      r.carb_grams,
      r.ingredients,
      r.notes,
      r.photo_r2_key,
      r.photo_content_type,
      r.created_at,
      r.updated_at
    FROM recipe_bundles b
    LEFT JOIN recipe_bundle_items i ON i.bundle_id = b.id
    LEFT JOIN recipes r ON r.id = i.recipe_id
    WHERE b.id = ?
    ORDER BY i.position, i.id
  `).bind(id).all<RecipeBundleRow>()
  return bundlesFromRows(result.results)[0] ?? null
}

export async function recipeBundleFromRequest(request: Request) {
  return recipeBundleSchema.parse(await readJson(request))
}

export async function createRecipeBundle(input: RecipeBundleInput) {
  const database = db()
  const bundle = await database.prepare(`
    INSERT INTO recipe_bundles (name, notes, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    RETURNING *
  `).bind(input.name, input.notes ?? null).first<{ id: number }>()
  if (!bundle) throw new HttpError(500, 'CREATE_FAILED', 'Could not create recipe bundle')
  await writeBundleItems(bundle.id, input.items)
  const saved = await readRecipeBundle(bundle.id)
  if (!saved) throw new HttpError(500, 'READ_FAILED', 'Could not read saved recipe bundle')
  return saved
}

export async function updateRecipeBundle(id: number, input: RecipeBundleInput) {
  const database = db()
  await database.batch([
    database.prepare('UPDATE recipe_bundles SET name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(input.name, input.notes ?? null, id),
    database.prepare('DELETE FROM recipe_bundle_items WHERE bundle_id = ?').bind(id),
  ])
  await writeBundleItems(id, input.items)
  const saved = await readRecipeBundle(id)
  if (!saved) throw new HttpError(404, 'NOT_FOUND', 'Recipe bundle not found')
  return saved
}

async function writeBundleItems(bundleId: number, items: RecipeBundleInput['items']) {
  const database = db()
  await database.batch(items.map((item, index) => database.prepare(`
    INSERT INTO recipe_bundle_items (bundle_id, recipe_id, default_quantity, position)
    VALUES (?, ?, ?, ?)
  `).bind(bundleId, item.recipe_id, item.default_quantity, item.position ?? index)))
}

function bundlesFromRows(rows: RecipeBundleRow[]) {
  const bundles = new Map<number, RecipeBundle>()

  for (const row of rows) {
    let bundle = bundles.get(row.bundle_id)
    if (!bundle) {
      bundle = {
        id: row.bundle_id,
        name: row.bundle_name,
        notes: row.bundle_notes,
        recipes: [],
        created_at: row.bundle_created_at,
        updated_at: row.bundle_updated_at,
      }
      bundles.set(row.bundle_id, bundle)
    }

    if (row.id === null || row.bundle_item_id === null || row.recipe_id === null || row.default_quantity === null || row.position === null) continue
    bundle.recipes.push({
      bundle_item_id: row.bundle_item_id,
      bundle_id: row.bundle_id,
      recipe_id: row.recipe_id,
      default_quantity: row.default_quantity,
      position: row.position,
      id: row.id,
      name: row.name ?? '',
      aliases: row.aliases,
      category: row.category,
      serving_description: row.serving_description,
      calories: row.calories ?? 0,
      protein_grams: row.protein_grams ?? 0,
      fat_grams: row.fat_grams ?? 0,
      carb_grams: row.carb_grams ?? 0,
      ingredients: row.ingredients,
      notes: row.notes,
      photo_r2_key: row.photo_r2_key,
      photo_content_type: row.photo_content_type,
      created_at: row.created_at ?? '',
      updated_at: row.updated_at ?? '',
    })
  }

  return [...bundles.values()]
}

interface RecipeBundleRow {
  bundle_id: number
  bundle_name: string
  bundle_notes: string | null
  bundle_created_at: string
  bundle_updated_at: string
  bundle_item_id: number | null
  recipe_id: number | null
  default_quantity: number | null
  position: number | null
  id: number | null
  name: string | null
  aliases: string | null
  category: string | null
  serving_description: string | null
  calories: number | null
  protein_grams: number | null
  fat_grams: number | null
  carb_grams: number | null
  ingredients: string | null
  notes: string | null
  photo_r2_key: string | null
  photo_content_type: string | null
  created_at: string | null
  updated_at: string | null
}
