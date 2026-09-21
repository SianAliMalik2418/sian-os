import { z, type ZodType } from 'zod'
import { checkinSchema, dateSchema, nutritionEntrySchema, profileSchema, recipeBundleSchema, recipeSchema } from '@/lib/schemas'

const empty = z.object({}).strict()

// Sleep, waist, and water are legacy check-in fields; fats and carbs are legacy nutrition
// fields (see docs/FITNESS_COACHING_CONTEXT.md Legacy features). The REST API and database
// still accept and return them unchanged, but MCP tools intentionally do not advertise them
// as writable so agents do not start asking about or logging them again.
const saveCheckinArgs = checkinSchema.omit({ waist_inches: true, sleep_hours: true, water_liters: true, fat_grams: true, carb_grams: true })
const addNutritionEntryArgs = nutritionEntrySchema.omit({ fat_grams: true, carb_grams: true })
const createRecipeArgs = recipeSchema.omit({ fat_grams: true, carb_grams: true })

const getCheckinsArgs = z.object({
  date: dateSchema.optional(),
  limit: z.number().int().min(1).max(365).optional(),
}).strict()

const deleteCheckinArgs = z.object({ date: dateSchema }).strict()

const getNutritionEntriesArgs = z.object({ date: dateSchema }).strict()

const deleteNutritionEntryArgs = z.object({ entryId: z.number().int().min(1) }).strict()

const updateRecipeArgs = createRecipeArgs.extend({ recipeId: z.number().int().min(1) }).strict()
const deleteRecipeArgs = z.object({ recipeId: z.number().int().min(1) }).strict()

const updateRecipeBundleArgs = recipeBundleSchema.extend({ bundleId: z.number().int().min(1) }).strict()
const deleteRecipeBundleArgs = z.object({ bundleId: z.number().int().min(1) }).strict()

const getReportsArgs = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  interval: z.enum(['daily', 'weekly', 'monthly']).optional(),
}).strict()

const getLyftaWorkoutsArgs = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
}).strict()

const agentStateKey = z.literal('last_weekly_report_date')
const getAgentStateArgs = z.object({ key: agentStateKey.optional() }).strict()
const saveAgentStateArgs = z.object({ key: agentStateKey, value: dateSchema.nullable() }).strict()

type Request = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  body?: unknown
}

export type Tool = {
  name: string
  description: string
  argsSchema: ZodType
  buildRequest: (args: never) => Request
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const tools: Tool[] = [
  {
    name: 'get_agent_context',
    description: 'Get the full daily coaching context in one call: profile and nutrition goals, dashboard summary, recent check-ins, recent nutrition entries, saved recipes, saved recipe bundles, and agent workflow guidance (write contracts, recipe-matching rules, weekly report cadence). Call this first in a new conversation to load current context.',
    argsSchema: empty,
    buildRequest: () => ({ method: 'GET', path: '/api/agent/context' }),
  },
  {
    name: 'get_dashboard',
    description: "Get today's dashboard summary: latest check-in, daily streak, current week completion, and recent weight trend.",
    argsSchema: empty,
    buildRequest: () => ({ method: 'GET', path: '/api/dashboard' }),
  },
  {
    name: 'get_checkins',
    description: 'Get daily check-ins. Pass date for one specific day, otherwise pass limit to get recent days (default 90, max 365).',
    argsSchema: getCheckinsArgs,
    buildRequest: (args: z.infer<typeof getCheckinsArgs>) => ({ method: 'GET', path: `/api/checkins${query({ date: args.date, limit: args.limit })}` }),
  },
  {
    name: 'save_checkin',
    description: 'Create or update a daily check-in by date (upsert). This is a full upsert: omitted optional fields are cleared, so call get_checkins for that date first and pass through any existing confirmed values you want to keep. Use nutrition entry tools for itemized food instead of this.',
    argsSchema: saveCheckinArgs,
    buildRequest: (args: z.infer<typeof saveCheckinArgs>) => ({ method: 'POST', path: '/api/checkins', body: args }),
  },
  {
    name: 'delete_checkin',
    description: 'Permanently delete the daily check-in for one date. Ask for confirmation before calling this.',
    argsSchema: deleteCheckinArgs,
    buildRequest: (args: z.infer<typeof deleteCheckinArgs>) => ({ method: 'DELETE', path: `/api/checkins${query({ date: args.date })}` }),
  },
  {
    name: 'get_nutrition_entries',
    description: 'Get itemized food rows logged for one date.',
    argsSchema: getNutritionEntriesArgs,
    buildRequest: (args: z.infer<typeof getNutritionEntriesArgs>) => ({ method: 'GET', path: `/api/nutrition-entries${query({ date: args.date })}` }),
  },
  {
    name: 'add_nutrition_entry',
    description: "Add one itemized food row for a date. Automatically recalculates that day's check-in calorie and protein totals. Check saved recipes/bundles first for repeat foods instead of estimating.",
    argsSchema: addNutritionEntryArgs,
    buildRequest: (args: z.infer<typeof addNutritionEntryArgs>) => ({ method: 'POST', path: '/api/nutrition-entries', body: args }),
  },
  {
    name: 'delete_nutrition_entry',
    description: "Delete one itemized food row by id. Automatically recalculates that day's check-in totals.",
    argsSchema: deleteNutritionEntryArgs,
    buildRequest: (args: z.infer<typeof deleteNutritionEntryArgs>) => ({ method: 'DELETE', path: `/api/nutrition-entries/${args.entryId}` }),
  },
  {
    name: 'get_recipes',
    description: 'Get saved repeat recipes (one normal serving each). Check these by name/aliases before estimating nutrition for a repeat food.',
    argsSchema: empty,
    buildRequest: () => ({ method: 'GET', path: '/api/recipes' }),
  },
  {
    name: 'create_recipe',
    description: "Save a new repeat recipe representing one normal serving.",
    argsSchema: createRecipeArgs,
    buildRequest: (args: z.infer<typeof createRecipeArgs>) => ({ method: 'POST', path: '/api/recipes', body: args }),
  },
  {
    name: 'update_recipe',
    description: 'Update an existing saved recipe by id. Replaces editable fields, so read get_recipes first when preserving fields matters.',
    argsSchema: updateRecipeArgs,
    buildRequest: (args: z.infer<typeof updateRecipeArgs>) => {
      const { recipeId, ...body } = args
      return { method: 'PUT', path: `/api/recipes/${recipeId}`, body }
    },
  },
  {
    name: 'delete_recipe',
    description: 'Delete a saved recipe by id. Ask for confirmation before calling this.',
    argsSchema: deleteRecipeArgs,
    buildRequest: (args: z.infer<typeof deleteRecipeArgs>) => ({ method: 'DELETE', path: `/api/recipes/${args.recipeId}` }),
  },
  {
    name: 'get_recipe_bundles',
    description: 'Get saved recipe bundles (quick meal templates made of saved recipes).',
    argsSchema: empty,
    buildRequest: () => ({ method: 'GET', path: '/api/recipe-bundles' }),
  },
  {
    name: 'create_recipe_bundle',
    description: 'Save a new recipe bundle: a named template made of saved recipes with default quantities.',
    argsSchema: recipeBundleSchema,
    buildRequest: (args: z.infer<typeof recipeBundleSchema>) => ({ method: 'POST', path: '/api/recipe-bundles', body: args }),
  },
  {
    name: 'update_recipe_bundle',
    description: 'Update an existing saved recipe bundle by id. Only change the saved bundle when Sian explicitly asks to change the recurring template, not for one-day adjustments.',
    argsSchema: updateRecipeBundleArgs,
    buildRequest: (args: z.infer<typeof updateRecipeBundleArgs>) => {
      const { bundleId, ...body } = args
      return { method: 'PUT', path: `/api/recipe-bundles/${bundleId}`, body }
    },
  },
  {
    name: 'delete_recipe_bundle',
    description: 'Delete a saved recipe bundle by id. Ask for confirmation before calling this.',
    argsSchema: deleteRecipeBundleArgs,
    buildRequest: (args: z.infer<typeof deleteRecipeBundleArgs>) => ({ method: 'DELETE', path: `/api/recipe-bundles/${args.bundleId}` }),
  },
  {
    name: 'get_profile',
    description: 'Get the owner profile: body stats, training context, and editable nutrition goals (calorie_goal, protein_goal).',
    argsSchema: empty,
    buildRequest: () => ({ method: 'GET', path: '/api/profile' }),
  },
  {
    name: 'save_profile',
    description: 'Create or update the owner profile and nutrition goals. Full upsert: omitted fields become null, so call get_profile first and pass through values you want to keep.',
    argsSchema: profileSchema,
    buildRequest: (args: z.infer<typeof profileSchema>) => ({ method: 'PUT', path: '/api/profile', body: args }),
  },
  {
    name: 'get_reports',
    description: 'Get derived daily, weekly, or monthly wellness report points and averages for a date range.',
    argsSchema: getReportsArgs,
    buildRequest: (args: z.infer<typeof getReportsArgs>) => ({ method: 'GET', path: `/api/reports${query({ from: args.from, to: args.to, interval: args.interval })}` }),
  },
  {
    name: 'get_lyfta_workouts',
    description: 'Get completed workouts read through the Sian OS Lyfta-backed proxy. Lyfta remains the upstream source of truth for workout detail; use this instead of guessing from memory.',
    argsSchema: getLyftaWorkoutsArgs,
    buildRequest: (args: z.infer<typeof getLyftaWorkoutsArgs>) => ({ method: 'GET', path: `/api/lyfta/workouts${query({ limit: args.limit, page: args.page })}` }),
  },
  {
    name: 'get_agent_state',
    description: 'Get agent cadence state, such as the date of the last weekly report given.',
    argsSchema: getAgentStateArgs,
    buildRequest: (args: z.infer<typeof getAgentStateArgs>) => ({ method: 'GET', path: `/api/agent/state${query({ key: args.key })}` }),
  },
  {
    name: 'save_agent_state',
    description: 'Save agent cadence state. Use only for last_weekly_report_date immediately after giving a weekly report.',
    argsSchema: saveAgentStateArgs,
    buildRequest: (args: z.infer<typeof saveAgentStateArgs>) => ({ method: 'PUT', path: '/api/agent/state', body: args }),
  },
]

export function findTool(name: string) {
  return tools.find((tool) => tool.name === name)
}
