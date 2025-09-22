import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exerciseRecordsStorage } from '../exerciseRecordsStorage'
import type { Exercise } from '../exercises'
import type { WorkoutSet } from '../types'
import { simulateIDBSuccess, simulateIDBUpgradeNeeded } from './setup'

describe('ExerciseRecordsStorage', () => {
  const mockExercise: Exercise = {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'Chest',
    description: 'Classic horizontal pressing movement',
    muscleGroups: ['Chest', 'Triceps', 'Front Delts']
  }

  const mockWorkoutSet: WorkoutSet = {
    Repetions: 5,
    Weight: 225
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize the database successfully', async () => {
      const initPromise = exerciseRecordsStorage.initialize()
      simulateIDBUpgradeNeeded()
      await expect(initPromise).resolves.toBeUndefined()
    })
  })

  describe('record management', () => {
    beforeEach(async () => {
      const initPromise = exerciseRecordsStorage.initialize()
      simulateIDBUpgradeNeeded()
      await initPromise
    })

    it('should save a record successfully', async () => {
      const savePromise = exerciseRecordsStorage.saveRecord(
        mockExercise,
        mockWorkoutSet,
        253.5,
        'Epley',
        'epley_123',
        'Felt strong today'
      )
      
      simulateIDBSuccess('bench-press_123456789')
      const result = await savePromise
      
      expect(result).toMatch(/^bench-press_\d+$/)
    })

    it('should get records by exercise', async () => {
      const mockRecords = [
        {
          id: 'record_1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          workoutSet: mockWorkoutSet,
          oneRepMax: 253.5,
          formulaUsed: 'Epley',
          formulaId: 'epley_123',
          dateRecorded: new Date('2025-01-01'),
          notes: 'Great session'
        },
        {
          id: 'record_2',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          workoutSet: { Repetions: 3, Weight: 235 },
          oneRepMax: 256.5,
          formulaUsed: 'Brzycki',
          formulaId: 'brzycki_123',
          dateRecorded: new Date('2025-01-05'),
          notes: 'Even better'
        }
      ]

      const getPromise = exerciseRecordsStorage.getRecordsByExercise('bench-press')
      simulateIDBSuccess(mockRecords)
      
      const result = await getPromise
      expect(result).toHaveLength(2)
      expect(result[0].dateRecorded).toEqual(new Date('2025-01-05')) // Should be sorted by date desc
    })

    it('should get best record for exercise', async () => {
      const mockRecords = [
        {
          id: 'record_1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          workoutSet: mockWorkoutSet,
          oneRepMax: 253.5,
          formulaUsed: 'Epley',
          formulaId: 'epley_123',
          dateRecorded: new Date('2025-01-01')
        },
        {
          id: 'record_2',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          workoutSet: { Repetions: 3, Weight: 235 },
          oneRepMax: 256.5,
          formulaUsed: 'Brzycki',
          formulaId: 'brzycki_123',
          dateRecorded: new Date('2025-01-05')
        }
      ]

      // Mock the getRecordsByExercise call
      vi.spyOn(exerciseRecordsStorage, 'getRecordsByExercise').mockResolvedValue(mockRecords)
      
      const result = await exerciseRecordsStorage.getBestRecordForExercise('bench-press')
      expect(result?.oneRepMax).toBe(256.5)
    })

    it('should get all records', async () => {
      const mockRecords = [
        {
          id: 'record_1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          workoutSet: mockWorkoutSet,
          oneRepMax: 253.5,
          formulaUsed: 'Epley',
          formulaId: 'epley_123',
          dateRecorded: new Date('2025-01-01')
        }
      ]

      const getAllPromise = exerciseRecordsStorage.getAllRecords()
      simulateIDBSuccess(mockRecords)
      
      const result = await getAllPromise
      expect(result).toHaveLength(1)
    })

    it('should get recent records', async () => {
      const mockRecords = Array.from({ length: 15 }, (_, i) => ({
        id: `record_${i}`,
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        workoutSet: mockWorkoutSet,
        oneRepMax: 250 + i,
        formulaUsed: 'Epley',
        formulaId: 'epley_123',
        dateRecorded: new Date(`2025-01-${String(i + 1).padStart(2, '0')}`)
      }))

      vi.spyOn(exerciseRecordsStorage, 'getAllRecords').mockResolvedValue(mockRecords)
      
      const result = await exerciseRecordsStorage.getRecentRecords(5)
      expect(result).toHaveLength(5)
    })

    it('should delete a record', async () => {
      const deletePromise = exerciseRecordsStorage.deleteRecord('record_123')
      simulateIDBSuccess()
      
      await expect(deletePromise).resolves.toBeUndefined()
    })

    it('should get personal records', async () => {
      const mockRecords = [
        {
          id: 'record_1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          workoutSet: mockWorkoutSet,
          oneRepMax: 253.5,
          formulaUsed: 'Epley',
          formulaId: 'epley_123',
          dateRecorded: new Date('2025-01-01')
        },
        {
          id: 'record_2',
          exerciseId: 'back-squat',
          exerciseName: 'Back Squat',
          workoutSet: { Repetions: 5, Weight: 315 },
          oneRepMax: 354.5,
          formulaUsed: 'Epley',
          formulaId: 'epley_123',
          dateRecorded: new Date('2025-01-02')
        }
      ]

      vi.spyOn(exerciseRecordsStorage, 'getAllRecords').mockResolvedValue(mockRecords)
      
      const result = await exerciseRecordsStorage.getPersonalRecords()
      expect(result.size).toBe(2)
      expect(result.get('bench-press')?.oneRepMax).toBe(253.5)
      expect(result.get('back-squat')?.oneRepMax).toBe(354.5)
    })

    it('should get exercise statistics', async () => {
      const mockRecords = [
        {
          id: 'record_1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          workoutSet: { Repetions: 5, Weight: 225 },
          oneRepMax: 253.5,
          formulaUsed: 'Epley',
          formulaId: 'epley_123',
          dateRecorded: new Date('2025-01-01')
        },
        {
          id: 'record_2',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          workoutSet: { Repetions: 3, Weight: 235 },
          oneRepMax: 256.5,
          formulaUsed: 'Brzycki',
          formulaId: 'brzycki_123',
          dateRecorded: new Date('2025-01-05')
        }
      ]

      vi.spyOn(exerciseRecordsStorage, 'getRecordsByExercise').mockResolvedValue(mockRecords)
      
      const result = await exerciseRecordsStorage.getExerciseStats('bench-press')
      expect(result.totalRecords).toBe(2)
      expect(result.bestOneRepMax).toBe(256.5)
      expect(result.averageOneRepMax).toBe(255)
      expect(result.latestRecord?.id).toMatch(/^record_[12]$/)
    })
  })
})
