import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import FiveThreeOnePlanner from '../components/FiveThreeOnePlanner/index'

// Mock the storage modules
vi.mock('../services/fiveThreeOneStorage', () => ({
  fiveThreeOneStorage: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllCycles: vi.fn().mockResolvedValue([]),
    getActiveCycle: vi.fn().mockResolvedValue(null),
    saveCycle: vi.fn().mockResolvedValue('cycle-id'),
    setActiveCycle: vi.fn().mockResolvedValue(undefined),
    deleteCycle: vi.fn().mockResolvedValue(undefined),
  },
  FIVE_THREE_ONE_MAIN_EXERCISES: [
    { id: 'bench-press', name: 'Bench Press' },
    { id: 'overhead-press', name: 'Overhead Press' },
    { id: 'squat', name: 'Squat' },
    { id: 'deadlift', name: 'Deadlift' }
  ],
  calculateTrainingMax: vi.fn((oneRepMax: number) => Math.round(oneRepMax * 0.9)),
  generateWorkouts: vi.fn().mockReturnValue([
    {
      id: 'workout-1',
      week: 1,
      day: 1,
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      mainSets: [
        { reps: 5, percentage: 65, weight: 195, isAmrap: false },
        { reps: 5, percentage: 75, weight: 225, isAmrap: false },
        { reps: 5, percentage: 85, weight: 255, isAmrap: true }
      ],
      warmupSets: [
        { reps: 5, percentage: 40, weight: 120, isAmrap: false },
        { reps: 5, percentage: 50, weight: 150, isAmrap: false },
        { reps: 3, percentage: 60, weight: 180, isAmrap: false }
      ],
      assistanceExercises: ['Incline Dumbbell Press', 'Dips', 'Tricep Extensions']
    }
  ])
}))

vi.mock('../services/exerciseRecordsStorage', () => ({
  exerciseRecordsStorage: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getPersonalRecords: vi.fn().mockResolvedValue(new Map([
      ['bench-press', { id: 'pr1', exerciseId: 'bench-press', oneRepMax: 300 }],
      ['squat', { id: 'pr2', exerciseId: 'squat', oneRepMax: 400 }],
      ['deadlift', { id: 'pr3', exerciseId: 'deadlift', oneRepMax: 500 }],
      ['overhead-press', { id: 'pr4', exerciseId: 'overhead-press', oneRepMax: 200 }]
    ]))
  }
}))

// Import the mocked modules
import { fiveThreeOneStorage } from '../services/fiveThreeOneStorage'

const mockedFiveThreeOneStorage = vi.mocked(fiveThreeOneStorage)

describe('FiveThreeOnePlanner', () => {
  const mockCycles = [
    {
      id: 'cycle-1',
      name: 'Winter 2024',
      startDate: new Date('2024-01-01'),
      createdDate: new Date('2024-01-01'),
      maxes: [
        { exerciseId: 'bench-press', exerciseName: 'Bench Press', oneRepMax: 300, trainingMax: 270 },
        { exerciseId: 'squat', exerciseName: 'Squat', oneRepMax: 400, trainingMax: 360 },
        { exerciseId: 'deadlift', exerciseName: 'Deadlift', oneRepMax: 500, trainingMax: 450 },
        { exerciseId: 'overhead-press', exerciseName: 'Overhead Press', oneRepMax: 200, trainingMax: 180 }
      ],
      workouts: [
        {
          id: 'workout-1-1',
          week: 1,
          day: 1,
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          mainSets: [
            { reps: 5, percentage: 65, weight: 175, isAmrap: false },
            { reps: 5, percentage: 75, weight: 203, isAmrap: false },
            { reps: 5, percentage: 85, weight: 230, isAmrap: true }
          ],
          warmupSets: [
            { reps: 5, percentage: 40, weight: 108, isAmrap: false },
            { reps: 5, percentage: 50, weight: 135, isAmrap: false },
            { reps: 3, percentage: 60, weight: 162, isAmrap: false }
          ],
          assistanceExercises: ['Incline Dumbbell Press', 'Dips', 'Tricep Extensions']
        },
        {
          id: 'workout-1-2',
          week: 2,
          day: 1,
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          mainSets: [
            { reps: 3, percentage: 70, weight: 189, isAmrap: false },
            { reps: 3, percentage: 80, weight: 216, isAmrap: false },
            { reps: 3, percentage: 90, weight: 243, isAmrap: true }
          ],
          warmupSets: [
            { reps: 5, percentage: 40, weight: 108, isAmrap: false },
            { reps: 5, percentage: 50, weight: 135, isAmrap: false },
            { reps: 3, percentage: 60, weight: 162, isAmrap: false }
          ],
          assistanceExercises: ['Incline Dumbbell Press', 'Dips', 'Tricep Extensions']
        }
      ],
      notes: 'First cycle of the year',
      isActive: false
    },
    {
      id: 'cycle-2',
      name: 'Spring 2024',
      startDate: new Date('2024-04-01'),
      createdDate: new Date('2024-04-01'),
      maxes: [
        { exerciseId: 'bench-press', exerciseName: 'Bench Press', oneRepMax: 315, trainingMax: 284 },
        { exerciseId: 'squat', exerciseName: 'Squat', oneRepMax: 420, trainingMax: 378 },
        { exerciseId: 'deadlift', exerciseName: 'Deadlift', oneRepMax: 525, trainingMax: 473 },
        { exerciseId: 'overhead-press', exerciseName: 'Overhead Press', oneRepMax: 210, trainingMax: 189 }
      ],
      workouts: [
        {
          id: 'workout-2-1',
          week: 1,
          day: 1,
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          mainSets: [
            { reps: 5, percentage: 65, weight: 185, isAmrap: false },
            { reps: 5, percentage: 75, weight: 213, isAmrap: false },
            { reps: 5, percentage: 85, weight: 241, isAmrap: true }
          ],
          warmupSets: [
            { reps: 5, percentage: 40, weight: 114, isAmrap: false },
            { reps: 5, percentage: 50, weight: 142, isAmrap: false },
            { reps: 3, percentage: 60, weight: 170, isAmrap: false }
          ],
          assistanceExercises: ['Incline Dumbbell Press', 'Dips', 'Tricep Extensions']
        }
      ],
      notes: 'Progressive overload cycle',
      isActive: true
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockedFiveThreeOneStorage.getAllCycles.mockResolvedValue(mockCycles)
    mockedFiveThreeOneStorage.getActiveCycle.mockResolvedValue(mockCycles[1]) // Spring 2024 is active
  })

  describe('View button functionality', () => {
    it('should set selected cycle when clicking View button and show cycle workouts in View tab', async () => {
      render(<FiveThreeOnePlanner />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('5-3-1 Workout Planner')).toBeInTheDocument()
      })

      // Navigate to "Manage Cycles" tab to see the cycles
      const manageCyclesTab = screen.getByText('Manage Cycles')
      fireEvent.click(manageCyclesTab)

      // Wait for cycles to load
      await waitFor(() => {
        expect(screen.getByText('Winter 2024')).toBeInTheDocument()
        expect(screen.getByText('Spring 2024')).toBeInTheDocument()
      })

      // Find the "View" button for the Winter 2024 cycle (the first non-active cycle)
      const winterCycleCard = screen.getByText('Winter 2024').closest('.cycle-card')
      expect(winterCycleCard).toBeInTheDocument()

      const viewButton = winterCycleCard?.querySelector('.cycle-action-button.view')
      expect(viewButton).toBeInTheDocument()
      expect(viewButton?.textContent).toBe('View')

      // Click the View button
      fireEvent.click(viewButton!)

      // Navigate to "View Workouts" tab
      const viewWorkoutsTab = screen.getByText('View Workouts')
      fireEvent.click(viewWorkoutsTab)

      // Wait for the selected cycle to be displayed
      await waitFor(() => {
        expect(screen.getByText('Showing workouts for:')).toBeInTheDocument()
        expect(screen.getByText('Winter 2024')).toBeInTheDocument()
      })

      // Verify that workouts are displayed for the selected cycle
      expect(screen.getByText('Week 1')).toBeInTheDocument()
      expect(screen.getByText('Week 2')).toBeInTheDocument()

      // Verify specific workout details from the Winter 2024 cycle
      const dayOneWorkouts = screen.getAllByText('Day 1: Bench Press')
      expect(dayOneWorkouts).toHaveLength(2) // Should appear in week 1 and week 2
      
      // Check for main set details (Winter 2024 cycle has different weights than Spring 2024)
      expect(screen.getByText('5+ × 230 lbs (85%)')).toBeInTheDocument() // AMRAP set from Winter 2024
      const amrapElements = screen.getAllByText('(AMRAP)')
      expect(amrapElements.length).toBeGreaterThan(0)

      // Verify warmup sets (appear in both week 1 and week 2)
      expect(screen.getAllByText('5 × 108 lbs (40%)')).toHaveLength(2)
      expect(screen.getAllByText('5 × 135 lbs (50%)')).toHaveLength(2)
      expect(screen.getAllByText('3 × 162 lbs (60%)')).toHaveLength(2)

      // Verify assistance exercises (appears in both weeks)
      const assistanceElements = screen.getAllByText('Incline Dumbbell Press, Dips, Tricep Extensions')
      expect(assistanceElements.length).toBeGreaterThan(0)

      // Verify "Back to Active Cycle" button is present
      expect(screen.getByText('Back to Active Cycle')).toBeInTheDocument()
    })

    it('should return to active cycle view when clicking "Back to Active Cycle"', async () => {
      render(<FiveThreeOnePlanner />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('5-3-1 Workout Planner')).toBeInTheDocument()
      })

      // Navigate to "Manage Cycles" tab
      const manageCyclesTab = screen.getByText('Manage Cycles')
      fireEvent.click(manageCyclesTab)

      // Wait for cycles to load and click View on Winter 2024
      await waitFor(() => {
        expect(screen.getByText('Winter 2024')).toBeInTheDocument()
      })

      const winterCycleCard = screen.getByText('Winter 2024').closest('.cycle-card')
      const viewButton = winterCycleCard?.querySelector('.cycle-action-button.view')
      fireEvent.click(viewButton!)

      // Navigate to "View Workouts" tab
      const viewWorkoutsTab = screen.getByText('View Workouts')
      fireEvent.click(viewWorkoutsTab)

      // Wait for selected cycle to be shown
      await waitFor(() => {
        expect(screen.getByText('Showing workouts for:')).toBeInTheDocument()
        expect(screen.getByText('Winter 2024')).toBeInTheDocument()
      })

      // Click "Back to Active Cycle"
      const backButton = screen.getByText('Back to Active Cycle')
      fireEvent.click(backButton)

      // Should now show the active cycle (Spring 2024)
      await waitFor(() => {
        expect(screen.getByText('Showing workouts for active cycle:')).toBeInTheDocument()
        expect(screen.getByText('Spring 2024')).toBeInTheDocument()
      })

      // Verify it's showing the active cycle's workouts (different weights)
      expect(screen.getByText('5+ × 241 lbs (85%)')).toBeInTheDocument() // AMRAP set from Spring 2024 (higher weights)
    })

    it('should display cycle name and workout structure correctly when cycle is selected', async () => {
      render(<FiveThreeOnePlanner />)

      // Navigate to manage cycles and select a cycle
      await waitFor(() => {
        expect(screen.getByText('5-3-1 Workout Planner')).toBeInTheDocument()
      })

      const manageCyclesTab = screen.getByText('Manage Cycles')
      fireEvent.click(manageCyclesTab)

      await waitFor(() => {
        expect(screen.getByText('Winter 2024')).toBeInTheDocument()
      })

      const winterCycleCard = screen.getByText('Winter 2024').closest('.cycle-card')
      const viewButton = winterCycleCard?.querySelector('.cycle-action-button.view')
      fireEvent.click(viewButton!)

      // Navigate to view workouts
      const viewWorkoutsTab = screen.getByText('View Workouts')
      fireEvent.click(viewWorkoutsTab)

      await waitFor(() => {
        expect(screen.getByText('Showing workouts for:')).toBeInTheDocument()
      })

      // Verify workout structure elements (using getAllBy since they appear multiple times)
      const mainSetsElements = screen.getAllByText('Main Sets:')
      expect(mainSetsElements.length).toBeGreaterThan(0)
      
      const warmupElements = screen.getAllByText('Warmup:')
      expect(warmupElements.length).toBeGreaterThan(0)
      
      const assistanceElements = screen.getAllByText('Suggested Assistance:')
      expect(assistanceElements.length).toBeGreaterThan(0)
      
      // Verify AMRAP indicator
      const amrapElements = screen.getAllByText('(AMRAP)')
      expect(amrapElements.length).toBeGreaterThan(0)

      // Verify percentage displays
      expect(screen.getByText('5 × 175 lbs (65%)')).toBeInTheDocument()
      expect(screen.getByText('5 × 203 lbs (75%)')).toBeInTheDocument()
      expect(screen.getByText('5+ × 230 lbs (85%)')).toBeInTheDocument()
    })
  })
})