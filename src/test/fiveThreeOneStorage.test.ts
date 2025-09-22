import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  fiveThreeOneStorage, 
  calculateTrainingMax, 
  calculateWeight, 
  generateWorkouts,
  FIVE_THREE_ONE_PERCENTAGES
} from '../fiveThreeOneStorage'
import type { FiveThreeOneCycle, FiveThreeOneMax } from '../fiveThreeOneStorage'
import { simulateIDBSuccess, simulateIDBUpgradeNeeded } from './setup'

describe('FiveThreeOneStorage', () => {
  const mockMaxes: FiveThreeOneMax[] = [
    {
      exerciseId: 'back-squat',
      exerciseName: 'Back Squat',
      oneRepMax: 400,
      trainingMax: 360
    },
    {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      oneRepMax: 300,
      trainingMax: 270
    },
    {
      exerciseId: 'deadlift',
      exerciseName: 'Deadlift',
      oneRepMax: 500,
      trainingMax: 450
    },
    {
      exerciseId: 'overhead-press',
      exerciseName: 'Overhead Press',
      oneRepMax: 200,
      trainingMax: 180
    }
  ]

  const mockCycle: FiveThreeOneCycle = {
    id: 'cycle_123',
    name: 'Test Cycle',
    startDate: new Date('2025-01-01'),
    createdDate: new Date('2025-01-01'),
    maxes: mockMaxes,
    workouts: [],
    notes: 'Test cycle for unit tests',
    isActive: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize the database successfully', async () => {
      const initPromise = fiveThreeOneStorage.initialize()
      simulateIDBUpgradeNeeded()
      await expect(initPromise).resolves.toBeUndefined()
    })
  })

  describe('cycle management', () => {
    beforeEach(async () => {
      const initPromise = fiveThreeOneStorage.initialize()
      simulateIDBUpgradeNeeded()
      await initPromise
    })

    it('should save a cycle successfully', async () => {
      const savePromise = fiveThreeOneStorage.saveCycle(mockCycle)
      simulateIDBSuccess('cycle_123')
      
      const result = await savePromise
      expect(result).toBe('cycle_123')
    })

    it('should get all cycles', async () => {
      const mockCycles = [mockCycle]
      
      const getAllPromise = fiveThreeOneStorage.getAllCycles()
      simulateIDBSuccess(mockCycles)
      
      const result = await getAllPromise
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Cycle')
    })

    it('should get active cycle', async () => {
      const mockActiveCycles = [mockCycle]
      
      const getActivePromise = fiveThreeOneStorage.getActiveCycle()
      simulateIDBSuccess(mockActiveCycles)
      
      const result = await getActivePromise
      expect(result?.name).toBe('Test Cycle')
      expect(result?.isActive).toBe(true)
    })

    it('should get cycle by ID', async () => {
      const getCyclePromise = fiveThreeOneStorage.getCycleById('cycle_123')
      simulateIDBSuccess(mockCycle)
      
      const result = await getCyclePromise
      expect(result?.id).toBe('cycle_123')
    })

    it('should set active cycle', async () => {
      const mockCycles = [
        { ...mockCycle, id: 'cycle_1', isActive: false },
        { ...mockCycle, id: 'cycle_2', isActive: true }
      ]
      
      const setActivePromise = fiveThreeOneStorage.setActiveCycle('cycle_1')
      
      // Simulate getting all cycles first
      setTimeout(() => simulateIDBSuccess(mockCycles), 0)
      // Then simulate successful updates
      setTimeout(() => simulateIDBSuccess(), 10)
      setTimeout(() => simulateIDBSuccess(), 20)
      
      await expect(setActivePromise).resolves.toBeUndefined()
    })

    it('should delete a cycle', async () => {
      const deletePromise = fiveThreeOneStorage.deleteCycle('cycle_123')
      simulateIDBSuccess()
      
      await expect(deletePromise).resolves.toBeUndefined()
    })
  })
})

describe('5-3-1 Calculation Functions', () => {
  describe('calculateTrainingMax', () => {
    it('should calculate 90% of 1RM correctly', () => {
      expect(calculateTrainingMax(400)).toBe(360)
      expect(calculateTrainingMax(300)).toBe(270)
      expect(calculateTrainingMax(315)).toBe(284) // 283.5 rounded to 284
    })
  })

  describe('calculateWeight', () => {
    it('should calculate weights and round to nearest 2.5 lbs for weights under 200', () => {
      expect(calculateWeight(180, 65)).toBe(117.5) // 117 rounded to 117.5
      expect(calculateWeight(150, 75)).toBe(112.5) // 112.5 exactly
    })

    it('should calculate weights and round to nearest 5 lbs for weights over 200', () => {
      expect(calculateWeight(450, 85)).toBe(385) // 382.5 rounded to 385
      expect(calculateWeight(360, 90)).toBe(325) // 324 rounded to 325
    })
  })

  describe('generateWorkouts', () => {
    const mockMaxes: FiveThreeOneMax[] = [
      {
        exerciseId: 'back-squat',
        exerciseName: 'Back Squat',
        oneRepMax: 400,
        trainingMax: 360
      },
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        oneRepMax: 300,
        trainingMax: 270
      }
    ]

    it('should generate correct number of workouts', () => {
      const workouts = generateWorkouts(mockMaxes)
      expect(workouts).toHaveLength(8) // 2 exercises × 4 weeks
    })

    it('should generate workouts with correct structure', () => {
      const workouts = generateWorkouts(mockMaxes)
      const firstWorkout = workouts[0]
      
      expect(firstWorkout).toHaveProperty('id')
      expect(firstWorkout).toHaveProperty('week')
      expect(firstWorkout).toHaveProperty('day')
      expect(firstWorkout).toHaveProperty('exerciseId')
      expect(firstWorkout).toHaveProperty('exerciseName')
      expect(firstWorkout).toHaveProperty('mainSets')
      expect(firstWorkout).toHaveProperty('warmupSets')
      expect(firstWorkout).toHaveProperty('assistanceExercises')
    })

    it('should generate correct sets for each week', () => {
      const workouts = generateWorkouts(mockMaxes)
      
      // Week 1 workout
      const week1Workout = workouts.find(w => w.week === 1)!
      expect(week1Workout.mainSets).toHaveLength(3)
      expect(week1Workout.mainSets[2].isAmrap).toBe(true)
      
      // Week 4 (deload) workout
      const week4Workout = workouts.find(w => w.week === 4)!
      expect(week4Workout.mainSets).toHaveLength(3)
      expect(week4Workout.mainSets.every(set => !set.isAmrap)).toBe(true)
    })

    it('should calculate correct weights for sets', () => {
      const workouts = generateWorkouts(mockMaxes)
      const squatWeek1 = workouts.find(w => w.exerciseId === 'back-squat' && w.week === 1)!
      
      // Week 1: 65%, 75%, 85% of training max (360)
      expect(squatWeek1.mainSets[0].weight).toBe(calculateWeight(360, 65))
      expect(squatWeek1.mainSets[1].weight).toBe(calculateWeight(360, 75))
      expect(squatWeek1.mainSets[2].weight).toBe(calculateWeight(360, 85))
    })

    it('should include warmup sets', () => {
      const workouts = generateWorkouts(mockMaxes)
      const firstWorkout = workouts[0]
      
      expect(firstWorkout.warmupSets).toHaveLength(3)
      expect(firstWorkout.warmupSets[0].percentage).toBe(40)
      expect(firstWorkout.warmupSets[1].percentage).toBe(50)
      expect(firstWorkout.warmupSets[2].percentage).toBe(60)
    })
  })
})

describe('5-3-1 Percentages', () => {
  it('should have correct percentages for each week', () => {
    expect(FIVE_THREE_ONE_PERCENTAGES.week1).toEqual([
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 75 },
      { reps: 5, percentage: 85, isAmrap: true }
    ])

    expect(FIVE_THREE_ONE_PERCENTAGES.week2).toEqual([
      { reps: 3, percentage: 70 },
      { reps: 3, percentage: 80 },
      { reps: 3, percentage: 90, isAmrap: true }
    ])

    expect(FIVE_THREE_ONE_PERCENTAGES.week3).toEqual([
      { reps: 5, percentage: 75 },
      { reps: 3, percentage: 85 },
      { reps: 1, percentage: 95, isAmrap: true }
    ])

    expect(FIVE_THREE_ONE_PERCENTAGES.week4).toEqual([
      { reps: 5, percentage: 40 },
      { reps: 5, percentage: 50 },
      { reps: 5, percentage: 60 }
    ])
  })
})
