import { describe, expect, it, vi } from 'vitest'
import { fetchLyftaWorkouts } from './lyfta'

describe('fetchLyftaWorkouts', () => {
  it('fetches detailed workouts with bearer auth and normalized pagination', async () => {
    const fetcher = vi.fn(async () => Response.json({
      status: true,
      count: 1,
      total_records: 1,
      total_pages: 1,
      current_page: 1,
      limit: 100,
      workouts: [{
        id: '42',
        title: 'Upper',
        workout_perform_date: '2026-08-24 08:15:00',
        workout_duration: '00:42:10',
        total_volume: '3450',
        exercises: [{
          exercise_id: '7',
          excercise_name: 'Bench Press',
          exercise_type: 'weight_reps',
          sets: [{
            id: 'set-1',
            weight: '40',
            reps: '8',
            rir: '2',
            is_completed: true,
          }],
        }],
      }],
    }))

    const result = await fetchLyftaWorkouts({
      apiKey: 'secret-key',
      fetcher,
      limit: 250,
      page: 0,
    })

    expect(fetcher).toHaveBeenCalledWith(
      'https://my.lyfta.app/api/v1/workouts?limit=100&page=1',
      { headers: { Authorization: 'Bearer secret-key' } },
    )
    expect(result.workouts).toEqual([{
      id: '42',
      title: 'Upper',
      performedAt: '2026-08-24 08:15:00',
      duration: '00:42:10',
      totalVolume: '3450',
      exercises: [{
        id: '7',
        name: 'Bench Press',
        type: 'weight_reps',
        sets: [{
          id: 'set-1',
          weight: '40',
          reps: '8',
          rir: '2',
          duration: null,
          distance: null,
          completed: true,
          recordType: null,
          recordLevel: null,
          recordValue: null,
        }],
      }],
    }])
  })

  it('returns an unavailable result when the API key is missing', async () => {
    const fetcher = vi.fn()

    const result = await fetchLyftaWorkouts({ apiKey: '', fetcher })

    expect(fetcher).not.toHaveBeenCalled()
    expect(result).toEqual({
      available: false,
      reason: 'LYFTA_API_KEY is not configured',
      workouts: [],
      pagination: null,
    })
  })

  it('fills missing duration from workout summaries', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.includes('/api/v1/workouts/summary')) {
        return Response.json({
          status: true,
          workouts: [{
            id: '42',
            title: 'Upper',
            workout_duration: '00:42:10',
            total_volume: '3450',
            workout_perform_date: '2026-08-24 08:15:00',
          }],
        })
      }

      return Response.json({
        status: true,
        count: 1,
        total_records: 1,
        total_pages: 1,
        current_page: 1,
        limit: 20,
        workouts: [{
          id: '42',
          title: 'Upper',
          workout_perform_date: '2026-08-24 08:15:00',
          exercises: [],
        }],
      })
    })

    const result = await fetchLyftaWorkouts({ apiKey: 'secret-key', fetcher })

    expect(fetcher).toHaveBeenCalledWith(
      'https://my.lyfta.app/api/v1/workouts/summary?limit=20&page=1',
      { headers: { Authorization: 'Bearer secret-key' } },
    )
    expect(result.workouts[0]?.duration).toBe('00:42:10')
  })
})
