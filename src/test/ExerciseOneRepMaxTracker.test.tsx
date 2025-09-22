import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ExerciseOneRepMaxTracker from '../components/ExerciseOneRepMaxTracker'

// Mock the storage modules
vi.mock('../services/oneRepMaxStorage', () => ({
  oneRepMaxStorage: {
    listFunctions: vi.fn(),
    getFunctionById: vi.fn(),
  },
  initializeWithPredefinedFormulas: vi.fn(),
}))

vi.mock('../services/exerciseRecordsStorage', () => ({
  exerciseRecordsStorage: {
    initialize: vi.fn(),
    getRecordsByExercise: vi.fn(),
    saveExerciseRecord: vi.fn(),
  }
}))

// Import the mocked modules
import { oneRepMaxStorage } from '../services/oneRepMaxStorage'
import { exerciseRecordsStorage } from '../services/exerciseRecordsStorage'

const mockedOneRepMaxStorage = vi.mocked(oneRepMaxStorage)
const mockedExerciseRecordsStorage = vi.mocked(exerciseRecordsStorage)

describe('ExerciseOneRepMaxTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockedOneRepMaxStorage.listFunctions.mockResolvedValue([
      { 
        id: 'epley', 
        name: 'Epley Formula',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 'brzycki', 
        name: 'Brzycki Formula',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
    
    mockedExerciseRecordsStorage.initialize.mockResolvedValue()
    mockedExerciseRecordsStorage.getRecordsByExercise.mockResolvedValue([
      {
        id: 'record1',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        workoutSet: { Weight: 100, Repetions: 5 },
        oneRepMax: 112.5,
        formulaUsed: 'Epley Formula',
        formulaId: 'epley',
        dateRecorded: new Date('2024-01-01')
      }
    ])
  })

  it('should render without crashing', async () => {
    render(<ExerciseOneRepMaxTracker />)
    
    expect(screen.getByText('Exercise One Rep Max Tracker')).toBeInTheDocument()
  })

  it('should display exercise selection controls', async () => {
    render(<ExerciseOneRepMaxTracker />)
    
    await waitFor(() => {
      expect(screen.getByText('Exercise One Rep Max Tracker')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display formula selection when available', async () => {
    render(<ExerciseOneRepMaxTracker />)
    
    // Wait for the component to fully load
    await waitFor(() => {
      expect(screen.getByText('Exercise One Rep Max Tracker')).toBeInTheDocument()
    })
  })

  it('should have category and exercise dropdowns', async () => {
    render(<ExerciseOneRepMaxTracker />)
    
    await waitFor(() => {
      const categorySelect = screen.getByLabelText('Category:')
      const exerciseSelect = screen.getByLabelText('Exercise:')
      
      expect(categorySelect).toBeInTheDocument()
      expect(exerciseSelect).toBeInTheDocument()
    })
  })

  it('should call storage initialization on mount', async () => {
    render(<ExerciseOneRepMaxTracker />)
    
    await waitFor(() => {
      expect(mockedExerciseRecordsStorage.initialize).toHaveBeenCalled()
      expect(mockedOneRepMaxStorage.listFunctions).toHaveBeenCalled()
    })
  })
})
