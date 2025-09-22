import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createWorkoutResultsStorage, WorkoutResultsStorage } from '../workoutResultsStorage'
import type { DatabaseConnection, DatabaseConfig } from '../workoutResultsStorage'

// Mock Database Connection
class MockDatabaseConnection implements DatabaseConnection {
  private mockDb = {
    transaction: vi.fn(),
    close: vi.fn()
  }

  private mockTransaction = {
    objectStore: vi.fn(),
    oncomplete: null as any,
    onerror: null as any
  }

  private mockStore = {
    add: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    createIndex: vi.fn(),
    index: vi.fn()
  }

  private mockRequest = {
    onsuccess: null as any,
    onerror: null as any,
    result: null as any
  }

  constructor() {
    this.setupMockChain()
  }

  private setupMockChain() {
    this.mockDb.transaction.mockReturnValue(this.mockTransaction)
    this.mockTransaction.objectStore.mockReturnValue(this.mockStore)
    this.mockStore.add.mockReturnValue(this.mockRequest)
    this.mockStore.get.mockReturnValue(this.mockRequest)
    this.mockStore.getAll.mockReturnValue(this.mockRequest)
    this.mockStore.put.mockReturnValue(this.mockRequest)
    this.mockStore.delete.mockReturnValue(this.mockRequest)
    this.mockStore.clear.mockReturnValue(this.mockRequest)
  }

  getDatabase(): IDBDatabase | null {
    return this.mockDb as any
  }

  async initialize(_config: DatabaseConfig): Promise<void> {
    // Mock initialization - always succeeds
    return Promise.resolve()
  }

  close(): void {
    // Mock close
  }

  // Test helper methods
  getMockStore() {
    return this.mockStore
  }

  getMockRequest() {
    return this.mockRequest
  }

  getMockTransaction() {
    return this.mockTransaction
  }

  resetMocks() {
    vi.clearAllMocks()
    this.setupMockChain()
  }
}

describe('WorkoutResultsStorage', () => {
  let mockDbConnection: MockDatabaseConnection
  let storage: WorkoutResultsStorage
  
  beforeEach(() => {
    mockDbConnection = new MockDatabaseConnection()
    storage = createWorkoutResultsStorage(mockDbConnection, {
      dbName: 'TestWorkoutResultsDB',
      dbVersion: 1,
      storeName: 'testWorkoutResults',
      sessionsStoreName: 'testWorkoutSessions'
    })
  })

  describe('initialization', () => {
    it('should initialize the database successfully', async () => {
      await storage.initialize()
      expect(storage.isStorageInitialized()).toBe(true)
    })
  })

  describe('workout results management', () => {
    beforeEach(async () => {
      // Initialize storage for each test
      await storage.initialize()
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
      const mockRequest = mockDbConnection.getMockRequest()
      const mockStore = mockDbConnection.getMockStore()

      setTimeout(() => {
        mockRequest.result = workoutResult.id
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: workoutResult.id } } as any)
        }
      }, 0)

      const result = await storage.saveWorkoutResult(workoutResult)
      expect(result).toBe('workout_123456789')
      expect(mockStore.put).toHaveBeenCalledWith(workoutResult)
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

      // Setup mock to return our test data
      const mockRequest = mockDbConnection.getMockRequest()
      const mockStore = mockDbConnection.getMockStore()
      
      // Mock getAll to return our results when called with cycleId index
      mockStore.index.mockReturnValue({
        getAll: vi.fn().mockReturnValue(mockRequest)
      })

      // Simulate successful database response
      setTimeout(() => {
        mockRequest.result = mockResults
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: mockResults } } as any)
        }
      }, 0)

      const results = await storage.getWorkoutResultsByCycle('cycle1')
      
      expect(results).toEqual(mockResults)
      expect(mockStore.index).toHaveBeenCalledWith('cycleId')
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

      // Setup mock to return all results
      const mockRequest = mockDbConnection.getMockRequest()
      const mockStore = mockDbConnection.getMockStore()

      // Mock successful retrieval
      setTimeout(() => {
        mockRequest.result = mockResults
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: mockResults } } as any)
        }
      }, 0)

      const results = await storage.getAllWorkoutResults()
      expect(results).toEqual(mockResults)
      expect(mockStore.getAll).toHaveBeenCalled()
    })

    it('should delete a workout result', async () => {
      // Setup mock for deletion
      const mockRequest = mockDbConnection.getMockRequest()
      const mockStore = mockDbConnection.getMockStore()

      // Mock successful deletion
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: undefined } } as any)
        }
      }, 0)

      await storage.deleteWorkoutResult('workout1')
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

      // Setup mock to return results by exercise
      const mockRequest = mockDbConnection.getMockRequest()
      const mockStore = mockDbConnection.getMockStore()

      // Mock exercise index query
      mockStore.index.mockReturnValue({
        getAll: vi.fn().mockReturnValue(mockRequest)
      })

      // Mock successful retrieval
      setTimeout(() => {
        mockRequest.result = mockResults
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: mockResults } } as any)
        }
      }, 0)

      const results = await storage.getWorkoutResultsByExercise('bench-press')
      expect(results).toEqual(mockResults)
      expect(mockStore.index).toHaveBeenCalledWith('exerciseId')
    })
  })

  describe('workout statistics', () => {
    beforeEach(async () => {
      // Initialize storage for each test
      await storage.initialize()
    })

    it('should get exercise workout stats', async () => {
      // Mock workout results that will be used to calculate stats
      const mockWorkoutResults = [
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
          mainSetResults: [
            {
              plannedReps: 5,
              plannedWeight: 135,
              actualReps: 7,
              actualWeight: 135,
              percentage: 65,
              isAmrap: true,
              rpe: 8
            }
          ]
        },
        {
          id: 'workout2',
          cycleId: 'cycle1',
          cycleName: '5/3/1 Cycle 1',
          workoutId: 'workout2',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          week: 2,
          day: 1,
          datePerformed: new Date('2024-01-08'),
          warmupResults: [],
          mainSetResults: [
            {
              plannedReps: 3,
              plannedWeight: 155,
              actualReps: 5,
              actualWeight: 155,
              percentage: 75,
              isAmrap: true,
              rpe: 9
            }
          ]
        }
      ]

      // Setup mock for exercise results retrieval
      const mockRequest = mockDbConnection.getMockRequest()
      const mockStore = mockDbConnection.getMockStore()

      // Mock exercise index query to return workout results
      mockStore.index.mockReturnValue({
        getAll: vi.fn().mockReturnValue(mockRequest)
      })

      // Mock successful retrieval - return actual workout results, not stats
      setTimeout(() => {
        mockRequest.result = mockWorkoutResults
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: mockWorkoutResults } } as any)
        }
      }, 0)

      const stats = await storage.getExerciseWorkoutStats('bench-press')
      
      expect(stats.totalWorkouts).toBe(2)
      expect(stats.averageAmrapReps).toBe(6) // (7 + 5) / 2 = 6
      expect(mockStore.index).toHaveBeenCalledWith('exerciseId')
    })
  })
})
