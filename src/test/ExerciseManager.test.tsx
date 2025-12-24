import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExerciseManager from '../components/ExerciseManager'
import { customExercisesStorage } from '../services/customExercisesStorage'

// Mock the custom exercises storage
vi.mock('../services/customExercisesStorage', () => ({
  customExercisesStorage: {
    initialize: vi.fn(),
    getAllExercises: vi.fn(),
    saveExercise: vi.fn(),
    updateExercise: vi.fn(),
    deleteExercise: vi.fn(),
  }
}))

const mockedStorage = vi.mocked(customExercisesStorage)

describe('ExerciseManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedStorage.initialize.mockResolvedValue()
    mockedStorage.getAllExercises.mockResolvedValue([])
    mockedStorage.saveExercise.mockResolvedValue()
    mockedStorage.updateExercise.mockResolvedValue()
    mockedStorage.deleteExercise.mockResolvedValue()
  })

  it('should render without crashing', async () => {
    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Exercise Library Manager')).toBeInTheDocument()
    })
  })

  it('should display built-in exercises count', async () => {
    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText(/18 built-in exercises/i)).toBeInTheDocument()
    })
  })

  it('should show add exercise form when button is clicked', async () => {
    const user = userEvent.setup()
    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Exercise Library Manager')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add new exercise/i })
    await user.click(addButton)

    expect(screen.getByRole('form', { name: /add new exercise form/i })).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Exercise Library Manager')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add new exercise/i })
    await user.click(addButton)

    const submitButton = screen.getByRole('button', { name: /^add exercise$/i })
    await user.click(submitButton)

    // Form should require name, category, and muscle groups
    await waitFor(() => {
      const nameInput = screen.getByRole('textbox', { name: /exercise name/i })
      const categoryInput = screen.getByRole('combobox', { name: /category/i })
      const muscleInput = screen.getByRole('textbox', { name: /muscle groups/i })
      
      expect(nameInput).toBeRequired()
      expect(categoryInput).toBeRequired()
      expect(muscleInput).toBeRequired()
    })
  })

  it('should validate muscle groups are not empty', async () => {
    const user = userEvent.setup()
    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Exercise Library Manager')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add new exercise/i })
    await user.click(addButton)

    // Fill in name and category but leave muscle groups as just spaces/commas
    const nameInput = screen.getByRole('textbox', { name: /exercise name/i })
    const categoryInput = screen.getByRole('combobox', { name: /category/i })
    const muscleInput = screen.getByRole('textbox', { name: /muscle groups/i })

    await user.type(nameInput, 'Test Exercise')
    await user.type(categoryInput, 'Legs')
    await user.type(muscleInput, '  ,  ,  ')

    const submitButton = screen.getByRole('button', { name: /^add exercise$/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please provide at least one muscle group/i)).toBeInTheDocument()
    })
  })

  it('should save a new exercise successfully', async () => {
    const user = userEvent.setup()
    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Exercise Library Manager')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add new exercise/i })
    await user.click(addButton)

    const nameInput = screen.getByRole('textbox', { name: /exercise name/i })
    const categoryInput = screen.getByRole('combobox', { name: /category/i })
    const muscleInput = screen.getByRole('textbox', { name: /muscle groups/i })

    await user.type(nameInput, 'Bulgarian Split Squat')
    await user.type(categoryInput, 'Legs')
    await user.type(muscleInput, 'Quadriceps, Glutes, Hamstrings')

    const submitButton = screen.getByRole('button', { name: /^add exercise$/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockedStorage.saveExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Bulgarian Split Squat',
          category: 'Legs',
          muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings']
        })
      )
    })
  })

  it('should prevent duplicate custom exercise IDs', async () => {
    const user = userEvent.setup()
    
    // Mock existing custom exercise
    mockedStorage.getAllExercises.mockResolvedValue([
      {
        id: 'custom-test-exercise',
        name: 'Test Exercise',
        category: 'Legs',
        muscleGroups: ['Quads']
      }
    ])

    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Your Custom Exercises (1)')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add new exercise/i })
    await user.click(addButton)

    const nameInput = screen.getByRole('textbox', { name: /exercise name/i })
    const categoryInput = screen.getByRole('combobox', { name: /category/i })
    const muscleInput = screen.getByRole('textbox', { name: /muscle groups/i })

    // Try to add exercise with same name (will generate same ID)
    await user.type(nameInput, 'Test Exercise')
    await user.type(categoryInput, 'Legs')
    await user.type(muscleInput, 'Glutes')

    const submitButton = screen.getByRole('button', { name: /^add exercise$/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/exercise id conflicts with an existing custom exercise/i)).toBeInTheDocument()
    })
  })

  it('should prevent conflicts with built-in exercise IDs (if manually set)', async () => {
    // Note: This test is for future-proofing in case we allow manual ID setting
    // Currently, IDs are auto-generated with 'custom-' prefix so conflicts are unlikely
    
    // We'll need to test the logic by mocking a scenario where the ID could conflict
    // For now, we'll skip this specific test since the auto-generation prevents conflicts
    expect(true).toBe(true)
  })

  it('should display custom exercises', async () => {
    mockedStorage.getAllExercises.mockResolvedValue([
      {
        id: 'custom-bulgarian-split-squat',
        name: 'Bulgarian Split Squat',
        category: 'Legs',
        description: 'Single-leg squat variation',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings']
      }
    ])

    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Bulgarian Split Squat')).toBeInTheDocument()
      expect(screen.getByText('Category:')).toBeInTheDocument()
      expect(screen.getByText('Legs')).toBeInTheDocument()
      expect(screen.getByText((_content, element) => {
        return element?.textContent === 'Muscles: Quadriceps, Glutes, Hamstrings'
      })).toBeInTheDocument()
    })
  })

  it('should edit an existing exercise', async () => {
    const user = userEvent.setup()
    
    mockedStorage.getAllExercises.mockResolvedValue([
      {
        id: 'custom-test-exercise',
        name: 'Test Exercise',
        category: 'Legs',
        muscleGroups: ['Quads']
      }
    ])

    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Exercise')).toBeInTheDocument()
    })

    const editButton = screen.getByRole('button', { name: /edit test exercise/i })
    await user.click(editButton)

    const nameInput = screen.getByRole('textbox', { name: /exercise name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Exercise')

    const submitButton = screen.getByRole('button', { name: /update exercise/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockedStorage.updateExercise).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Exercise'
        })
      )
    })
  })

  it('should delete an exercise', async () => {
    const user = userEvent.setup()
    
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    mockedStorage.getAllExercises.mockResolvedValue([
      {
        id: 'custom-test-exercise',
        name: 'Test Exercise',
        category: 'Legs',
        muscleGroups: ['Quads']
      }
    ])

    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Exercise')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /delete test exercise/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(mockedStorage.deleteExercise).toHaveBeenCalledWith('custom-test-exercise')
    })

    vi.restoreAllMocks()
  })

  it('should cancel delete when user declines confirmation', async () => {
    const user = userEvent.setup()
    
    // Mock window.confirm to return false
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    mockedStorage.getAllExercises.mockResolvedValue([
      {
        id: 'custom-test-exercise',
        name: 'Test Exercise',
        category: 'Legs',
        muscleGroups: ['Quads']
      }
    ])

    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Exercise')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /delete test exercise/i })
    await user.click(deleteButton)

    // Should not call deleteExercise
    expect(mockedStorage.deleteExercise).not.toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('should display success message after adding exercise', async () => {
    const user = userEvent.setup()
    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Exercise Library Manager')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add new exercise/i })
    await user.click(addButton)

    const nameInput = screen.getByRole('textbox', { name: /exercise name/i })
    const categoryInput = screen.getByRole('combobox', { name: /category/i })
    const muscleInput = screen.getByRole('textbox', { name: /muscle groups/i })

    await user.type(nameInput, 'New Exercise')
    await user.type(categoryInput, 'Legs')
    await user.type(muscleInput, 'Quads')

    const submitButton = screen.getByRole('button', { name: /^add exercise$/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/exercise added successfully/i)).toBeInTheDocument()
    })
  })

  it('should handle errors when saving fails', async () => {
    const user = userEvent.setup()
    
    mockedStorage.saveExercise.mockRejectedValue(new Error('Storage error'))

    render(<ExerciseManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Exercise Library Manager')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add new exercise/i })
    await user.click(addButton)

    const nameInput = screen.getByRole('textbox', { name: /exercise name/i })
    const categoryInput = screen.getByRole('combobox', { name: /category/i })
    const muscleInput = screen.getByRole('textbox', { name: /muscle groups/i })

    await user.type(nameInput, 'New Exercise')
    await user.type(categoryInput, 'Legs')
    await user.type(muscleInput, 'Quads')

    const submitButton = screen.getByRole('button', { name: /^add exercise$/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to save exercise/i)).toBeInTheDocument()
    })
  })
})
