import { describe, it, expect, beforeEach, vi } from 'vitest'
import { customExercisesStorage } from '../services/customExercisesStorage'
import type { Exercise } from '../types'
import { simulateIDBSuccess, simulateIDBUpgradeNeeded } from './setup'

describe('CustomExercisesStorage', () => {
  const mockExercise: Exercise = {
    id: 'custom-exercise-1',
    name: 'Custom Exercise',
    category: 'Custom',
    description: 'A custom exercise',
    muscleGroups: ['Chest', 'Arms']
  }

  const mockExercise2: Exercise = {
    id: 'custom-exercise-2',
    name: 'Another Custom Exercise',
    category: 'Custom',
    description: 'Another custom exercise',
    muscleGroups: ['Back']
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize the database successfully', async () => {
      const initPromise = customExercisesStorage.initialize()
      simulateIDBUpgradeNeeded()
      await expect(initPromise).resolves.toBeUndefined()
    })
  })

  describe('exercise management', () => {
    beforeEach(async () => {
      const initPromise = customExercisesStorage.initialize()
      simulateIDBUpgradeNeeded()
      await initPromise
    })

    it('should save an exercise successfully', async () => {
      const savePromise = customExercisesStorage.saveExercise(mockExercise)
      simulateIDBSuccess()
      await expect(savePromise).resolves.toBeUndefined()
    })

    it('should throw error when saving exercise without required fields', async () => {
      const invalidExercise = {
        id: '',
        name: '',
        category: '',
        muscleGroups: []
      } as Exercise

      await expect(customExercisesStorage.saveExercise(invalidExercise))
        .rejects.toThrow('Exercise must have id, name, and category')
    })

    it('should get all exercises', async () => {
      const mockExercises = [mockExercise, mockExercise2]
      const getAllPromise = customExercisesStorage.getAllExercises()
      simulateIDBSuccess(mockExercises)
      
      const result = await getAllPromise
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('custom-exercise-1')
    })

    it('should get exercises by category', async () => {
      const mockExercises = [mockExercise]
      const getPromise = customExercisesStorage.getExercisesByCategory('Custom')
      simulateIDBSuccess(mockExercises)
      
      const result = await getPromise
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('Custom')
    })

    it('should get exercise by ID', async () => {
      const getPromise = customExercisesStorage.getExerciseById('custom-exercise-1')
      simulateIDBSuccess(mockExercise)
      
      const result = await getPromise
      expect(result?.id).toBe('custom-exercise-1')
    })

    it('should delete an exercise', async () => {
      const deletePromise = customExercisesStorage.deleteExercise('custom-exercise-1')
      simulateIDBSuccess()
      
      await expect(deletePromise).resolves.toBeUndefined()
    })

    it('should update an exercise', async () => {
      const updatedExercise = {
        ...mockExercise,
        name: 'Updated Exercise Name'
      }
      const updatePromise = customExercisesStorage.updateExercise(updatedExercise)
      simulateIDBSuccess()
      
      await expect(updatePromise).resolves.toBeUndefined()
    })

    it('should check if exercise exists', async () => {
      const getPromise = customExercisesStorage.exerciseExists('custom-exercise-1')
      simulateIDBSuccess(mockExercise)
      
      const result = await getPromise
      expect(result).toBe(true)
    })

    it('should return false if exercise does not exist', async () => {
      const getPromise = customExercisesStorage.exerciseExists('non-existent')
      simulateIDBSuccess(undefined)
      
      const result = await getPromise
      expect(result).toBe(false)
    })

    it('should get all unique categories', async () => {
      const mockExercises = [
        mockExercise,
        mockExercise2,
        { ...mockExercise, id: 'ex3', category: 'Another' }
      ]
      
      vi.spyOn(customExercisesStorage, 'getAllExercises').mockResolvedValue(mockExercises)
      
      const result = await customExercisesStorage.getAllCategories()
      expect(result).toContain('Custom')
      expect(result).toContain('Another')
      expect(result.length).toBe(2)
    })
  })
})
