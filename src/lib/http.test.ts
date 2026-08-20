import { describe, expect, it } from 'vitest'
import { handleApi } from './http'

describe('API error handling', () => {
  it('returns a validation response for duplicate recipe names', async () => {
    const response = await handleApi(() => {
      throw new Error('D1_ERROR: UNIQUE constraint failed: recipes.name')
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: 'DUPLICATE_RECIPE',
        message: 'A recipe with this name already exists',
        details: {
          fieldErrors: {
            name: ['Use a different recipe name.'],
          },
        },
      },
    })
  })
})
