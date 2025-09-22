import { describe, it, expect, beforeEach, vi } from 'vitest'
import { workoutResultsStorage } from '../workoutResultsStorage'

// Mock IndexedDB
const mockDB = {
  transaction: vi.fn(),
  close: vi.fn()
}

const mockTransaction = {
  objectStore: vi.fn(),
  oncomplete: null as any,
  onerror: null as any
}

const mockStore = {
  add: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  createIndex: vi.fn(),
  index: vi.fn()
}

const mockRequest = {
  onsuccess: null as any,
  onerror: null as any,
  result: null as any
}

const mockOpenRequest = {
  onsuccess: null as any,
  onerror: null as any,
  onupgradeneeded: null as any,
  result: mockDB
}

// Mock IndexedDB
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(() => mockOpenRequest),
    deleteDatabase: vi.fn(() => mockOpenRequest)
  }
})

describe('WorkoutResultsStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock implementations
    mockDB.transaction.mockReturnValue(mockTransaction)
    mockTransaction.objectStore.mockReturnValue(mockStore)
    mockStore.add.mockReturnValue(mockRequest)
    mockStore.get.mockReturnValue(mockRequest)
    mockStore.getAll.mockReturnValue(mockRequest)
    mockStore.put.mockReturnValue(mockRequest)
    mockStore.delete.mockReturnValue(mockRequest)
    mockStore.clear.mockReturnValue(mockRequest)
  })

  describe('initialization', () => {
    it('should initialize the database successfully', async () => {
      // Simulate successful database opening
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess({ target: { result: mockDB } } as any)
        }
      }, 0)

      const initPromise = workoutResultsStorage.initialize()
      await initPromise
      expect(window.indexedDB.open).toHaveBeenCalled()
    })
  })

  describe('workout results management', () => {
    beforeEach(() => {
      // Mock successful DB initialization
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess({ target: { result: mockDB } } as any)
        }
      }, 0)
    })

    it('should save a workout result successfully', async () => {
      const workoutResult = {
        id: 'workout_123456789',
        cycleId: 'cycle1',
        cycleName: '5/3/1 Cycle 1',
        workoutId: 'workout1',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        week: 1,
        day: 1,
        datePerformed: new Date('2024-01-01'),
        warmupResults: [],
        mainSetResults: [
          {
            plannedReps: 5,
            plannedWeight: 100,
            actualReps: 5,
            actualWeight: 100,
            percentage: 85,
            isAmrap: false
          }
        ]
      }

      // Mock successful save
      setTimeout(() => {
        mockRequest.result = workoutResult.id
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: workoutResult.id } } as any)
        }
      }, 0)

      const result = await workoutResultsStorage.saveWorkoutResult(workoutResult)
      expect(result).toBe('workout_123456789')
    })

    it('should get workout results by cycle', async () => {
      const mockResults = [
        {
          id: 'workout1',
          cycleId: 'cycle1',
          cycleName: '5/3/1 Cycle 1',
          workoutId: 'workout1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          week: 1,
          day: 1,
          datePerformed: new Date('2024-01-01'),
          warmupResults: [],
          mainSetResults: []
        }
      ]

      // Mock successful retrieval
      setTimeout(() => {
        mockRequest.result = mockResults
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: mockResults } } as any)
        }
      }, 0)

      const results = await workoutResultsStorage.getWorkoutResultsByCycle('cycle1')
      expect(results).toEqual(mockResults)
    })

    it('should get all workout results', async () => {
      const mockResults = [
        {
          id: 'workout1',
          cycleId: 'cycle1',
          cycleName: '5/3/1 Cycle 1',
          workoutId: 'workout1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          week: 1,
          day: 1,
          datePerformed: new Date('2024-01-01'),
          warmupResults: [],
          mainSetResults: []
        }
      ]

      // Mock successful retrieval
      setTimeout(() => {
        mockRequest.result = mockResults
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: mockResults } } as any)
        }
      }, 0)

      const results = await workoutResultsStorage.getAllWorkoutResults()
      expect(results).toEqual(mockResults)
    })

    it('should delete a workout result', async () => {
      // Mock successful deletion
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: undefined } } as any)
        }
      }, 0)

      await workoutResultsStorage.deleteWorkoutResult('workout1')
      expect(mockStore.delete).toHaveBeenCalledWith('workout1')
    })

    it('should get workout results by exercise', async () => {
      const mockResults = [
        {
          id: 'workout1',
          cycleId: 'cycle1',
          cycleName: '5/3/1 Cycle 1',
          workoutId: 'workout1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          week: 1,
          day: 1,
          datePerformed: new Date('2024-01-01'),
          warmupResults: [],
          mainSetResults: []
        }
      ]

      // Mock successful retrieval
      setTimeout(() => {
        mockRequest.result = mockResults
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: mockResults } } as any)
        }
      }, 0)

      const results = await workoutResultsStorage.getWorkoutResultsByExercise('bench-press')
      expect(results).toEqual(mockResults)
    })
  })

  describe('workout statistics', () => {
    it('should get exercise workout stats', async () => {
      const mockStats = {
        totalWorkouts: 5,
        averageRpe: 8.2,
        bestPerformance: {
          weight: 225,
          reps: 5,
          date: new Date('2024-01-15')
        },
        progressTrend: 'improving' as const
      }

      // Mock successful retrieval
      setTimeout(() => {
        mockRequest.result = mockStats
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: mockStats } } as any)
        }
      }, 0)

      const stats = await workoutResultsStorage.getExerciseWorkoutStats('bench-press')
      expect(stats.totalWorkouts).toBe(5)
    })
  })
})
