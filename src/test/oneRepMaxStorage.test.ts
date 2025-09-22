import { describe, it, expect, beforeEach, vi } from 'vitest'
import { oneRepMaxStorage, predefinedFormulas } from '../oneRepMaxStorage'
import type { WorkoutSet } from '../types'
import { simulateIDBSuccess, simulateIDBUpgradeNeeded } from './setup'

describe('OneRepMaxStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize the database successfully', async () => {
      const initPromise = oneRepMaxStorage.initialize()
      simulateIDBUpgradeNeeded()
      await expect(initPromise).resolves.toBeUndefined()
    })
  })

  describe('function storage', () => {
    beforeEach(async () => {
      const initPromise = oneRepMaxStorage.initialize()
      simulateIDBUpgradeNeeded()
      await initPromise
    })

    it('should store a function successfully', async () => {
      const testFunction = (workoutSet: WorkoutSet) => workoutSet.Weight * 1.1
      const storePromise = oneRepMaxStorage.storeFunction('test', testFunction, 'Test function')
      
      simulateIDBSuccess('test_123456789')
      const result = await storePromise
      
      expect(result).toMatch(/^test_\d+$/)
    })

    it('should retrieve a function by ID', async () => {
      const mockFunction = {
        id: 'test_123',
        name: 'test',
        functionBody: '(workoutSet) => workoutSet.Weight * 1.1',
        description: 'Test function',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const getPromise = oneRepMaxStorage.getFunctionById('test_123')
      simulateIDBSuccess(mockFunction)
      
      const result = await getPromise
      expect(result).toBeDefined()
      expect(typeof result).toBe('function')
    })

    it('should retrieve a function by name', async () => {
      const mockFunctions = [{
        id: 'test_123',
        name: 'test',
        functionBody: '(workoutSet) => workoutSet.Weight * 1.1',
        description: 'Test function',
        createdAt: new Date(),
        updatedAt: new Date()
      }]
      
      const getPromise = oneRepMaxStorage.getFunctionByName('test')
      simulateIDBSuccess(mockFunctions)
      
      const result = await getPromise
      expect(result).toBeDefined()
      expect(typeof result).toBe('function')
    })

    it('should list all functions', async () => {
      const mockFunctions = [
        {
          id: 'test_1',
          name: 'test1',
          description: 'Test function 1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test_2',
          name: 'test2',
          description: 'Test function 2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      const listPromise = oneRepMaxStorage.listFunctions()
      simulateIDBSuccess(mockFunctions)
      
      const result = await listPromise
      expect(result).toHaveLength(2)
      expect(result[0]).not.toHaveProperty('functionBody')
    })

    it('should update an existing function', async () => {
      const existingFunction = {
        id: 'test_123',
        name: 'test',
        functionBody: '(workoutSet) => workoutSet.Weight * 1.1',
        description: 'Test function',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const newFunction = (workoutSet: WorkoutSet) => workoutSet.Weight * 1.2
      
      const updatePromise = oneRepMaxStorage.updateFunction('test_123', newFunction, 'Updated function')
      
      // First simulate getting the existing function
      setTimeout(() => simulateIDBSuccess(existingFunction), 0)
      // Then simulate successful update
      setTimeout(() => simulateIDBSuccess(), 10)
      
      await expect(updatePromise).resolves.toBeUndefined()
    })

    it('should delete a function', async () => {
      const deletePromise = oneRepMaxStorage.deleteFunction('test_123')
      simulateIDBSuccess()
      
      await expect(deletePromise).resolves.toBeUndefined()
    })
  })
})

describe('Predefined Formulas', () => {
  const testWorkoutSet: WorkoutSet = {
    Repetions: 5,
    Weight: 225
  }

  it('should calculate Epley formula correctly', () => {
    const result = predefinedFormulas.epley(testWorkoutSet)
    const expected = 225 * (1 + 0.0333 * 5)
    expect(result).toBeCloseTo(expected, 2)
  })

  it('should calculate Brzycki formula correctly', () => {
    const result = predefinedFormulas.brzycki(testWorkoutSet)
    const expected = 225 * (36 / (37 - 5))
    expect(result).toBeCloseTo(expected, 2)
  })

  it('should calculate Lander formula correctly', () => {
    const result = predefinedFormulas.lander(testWorkoutSet)
    const expected = 225 * (100 / (101.3 - 2.67123 * 5))
    expect(result).toBeCloseTo(expected, 2)
  })

  it('should calculate Lombardi formula correctly', () => {
    const result = predefinedFormulas.lombardi(testWorkoutSet)
    const expected = 225 * Math.pow(5, 0.1)
    expect(result).toBeCloseTo(expected, 2)
  })

  it('should throw error for Brzycki formula with 37+ reps', () => {
    const invalidWorkoutSet: WorkoutSet = {
      Repetions: 37,
      Weight: 225
    }
    
    expect(() => predefinedFormulas.brzycki(invalidWorkoutSet)).toThrow()
  })
})
