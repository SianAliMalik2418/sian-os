import { z, type ZodType } from 'zod'
import { checkinSchema, dateSchema, decisionSchema, nutritionEntrySchema, profileSchema, recipeBundleSchema, recipeSchema, wearableMetricsSchema } from '@/lib/schemas'

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

const getDecisionsArgs = z.object({ limit: z.number().int().min(1).max(200).optional() }).strict()
const deleteDecisionArgs = z.object({ decisionId: z.number().int().min(1) }).strict()

const agentStateKey = z.enum(['last_weekly_report_date', 'last_nightly_review_note'])
const getAgentStateArgs = z.object({ key: agentStateKey.optional() }).strict()
const saveAgentStateArgs = z.object({
  key: agentStateKey,
  value: z.string().max(2000).nullable(),
}).strict().superRefine((data, ctx) => {
  if (data.key === 'last_weekly_report_date' && data.value !== null && !dateSchema.safeParse(data.value).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'value must be YYYY-MM-DD for last_weekly_report_date' })
  }
})

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
    description: 'Get the full daily coaching context in one call: profile and nutrition goals, dashboard summary, recent check-ins, recent nutrition entries, saved recipes, saved recipe bundles, the standing decision log, and agent workflow guidance (write contracts, recipe-matching rules, weekly report cadence). Call this first in a new conversation to load current context.',
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
    name: 'save_wearable_metrics',
    description: 'Record steps, active calories, and/or sleep hours synced from a wearable device for one date. Partial upsert: only the fields you pass are changed, everything else on that day is left alone. Use this to correct a bad wearable sync, not for manually-estimated data.',
    argsSchema: wearableMetricsSchema,
    buildRequest: (args: z.infer<typeof wearableMetricsSchema>) => ({ method: 'POST', path: '/api/wearable-metrics', body: args }),
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
    description: "Get agent cadence state: the date of the last weekly report given (key last_weekly_report_date), or last night's nightly review note (key last_nightly_review_note).",
    argsSchema: getAgentStateArgs,
    buildRequest: (args: z.infer<typeof getAgentStateArgs>) => ({ method: 'GET', path: `/api/agent/state${query({ key: args.key })}` }),
  },
  {
    name: 'save_agent_state',
    description: 'Save agent cadence state. Use last_weekly_report_date (YYYY-MM-DD) immediately after giving a weekly report. Use last_nightly_review_note (free text, max 2000 chars) after a nightly review to summarize the calls/adjustments made, so the next nightly review can check whether they were followed.',
    argsSchema: saveAgentStateArgs,
    buildRequest: (args: z.infer<typeof saveAgentStateArgs>) => ({ method: 'PUT', path: '/api/agent/state', body: args }),
  },
  {
    name: 'get_decisions',
    description: 'Get the standing decision log: major confirmed calls like switching bulk/cut, changing the primary goal, a meaningful calorie/protein target change, or a training split change. This is a short durable history, not a daily activity log — pass limit to bound it (default 50, max 200).',
    argsSchema: getDecisionsArgs,
    buildRequest: (args: z.infer<typeof getDecisionsArgs>) => ({ method: 'GET', path: `/api/decisions${query({ limit: args.limit })}` }),
  },
  {
    name: 'save_decision',
    description: "Record one major, owner-confirmed decision (date plus a one-line summary, max 300 chars). Use this only for significant pivots worth remembering months later, such as switching from bulk to cut, changing the primary goal, a meaningful calorie/protein target change, or a training split change. Do not log routine daily facts, minor tweaks, or anything not yet confirmed by the owner — this log is meant to stay short.",
    argsSchema: decisionSchema,
    buildRequest: (args: z.infer<typeof decisionSchema>) => ({ method: 'POST', path: '/api/decisions', body: args }),
  },
  {
    name: 'delete_decision',
    description: 'Delete one decision log entry by id, for example to correct a mistaken entry. Ask for confirmation before calling this.',
    argsSchema: deleteDecisionArgs,
    buildRequest: (args: z.infer<typeof deleteDecisionArgs>) => ({ method: 'DELETE', path: `/api/decisions/${args.decisionId}` }),
  },
]

export function findTool(name: string) {
  return tools.find((tool) => tool.name === name)
}
