import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Exercise } from '../types';
import { customExercisesStorage } from '../services/customExercisesStorage';
import { BARBELL_EXERCISES } from '../exercises';
import SuccessMessage from './SuccessMessage';
import ErrorMessage from './ErrorMessage';

const ExerciseManager: React.FC = () => {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  
  // Ref to store timeout IDs for cleanup
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    description: '',
    muscleGroups: ''
  });

  // Load custom exercises
  const loadCustomExercises = useCallback(async () => {
    try {
      setIsLoading(true);
      await customExercisesStorage.initialize();
      const exercises = await customExercisesStorage.getAllExercises();
      setCustomExercises(exercises);
      setError('');
    } catch (err) {
      setError(`Failed to load custom exercises: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomExercises();
    
    // Cleanup timeout on unmount
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [loadCustomExercises]);

  // Reset form
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      category: '',
      description: '',
      muscleGroups: ''
    });
    setEditingExercise(null);
    setIsFormVisible(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Generate ID from name if creating new exercise
      const exerciseId = editingExercise 
        ? formData.id 
        : formData.id || `custom-${formData.name.toLowerCase().replace(/\s+/g, '-')}`;

      // Check if ID conflicts with built-in exercises
      const builtInExercise = BARBELL_EXERCISES.find(ex => ex.id === exerciseId);
      if (builtInExercise && !editingExercise) {
        setError('Exercise ID conflicts with a built-in exercise. Please use a different name.');
        return;
      }

      // Check if ID conflicts with existing custom exercises (only when creating)
      if (!editingExercise) {
        const existingCustomExercise = customExercises.find(ex => ex.id === exerciseId);
        if (existingCustomExercise) {
          setError('Exercise ID conflicts with an existing custom exercise. Please use a different name.');
          return;
        }
      }

      // Parse muscle groups
      const muscleGroups = formData.muscleGroups
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      // Validate that at least one muscle group is provided
      if (muscleGroups.length === 0) {
        setError('Please provide at least one muscle group.');
        return;
      }

      const exercise: Exercise = {
        id: exerciseId,
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim() || undefined,
        muscleGroups
      };

      if (editingExercise) {
        await customExercisesStorage.updateExercise(exercise);
        setSuccess('Exercise updated successfully!');
      } else {
        await customExercisesStorage.saveExercise(exercise);
        setSuccess('Exercise added successfully!');
      }

      await loadCustomExercises();
      resetForm();

      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      // Clear success message after 3 seconds
      successTimeoutRef.current = setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to save exercise: ${err}`);
    }
  };

  // Handle edit
  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      description: exercise.description || '',
      muscleGroups: exercise.muscleGroups.join(', ')
    });
    setIsFormVisible(true);
    setError('');
    setSuccess('');
  };

  // Handle delete
  const handleDelete = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    try {
      await customExercisesStorage.deleteExercise(exerciseId);
      setSuccess('Exercise deleted successfully!');
      await loadCustomExercises();
      
      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      // Clear success message after 3 seconds
      successTimeoutRef.current = setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete exercise: ${err}`);
    }
  };

  // Get all unique categories from both built-in and custom exercises
  const allCategories = useMemo(() => {
    return Array.from(
      new Set([
        ...BARBELL_EXERCISES.map(ex => ex.category),
        ...customExercises.map(ex => ex.category)
      ])
    ).sort();
  }, [customExercises]);

  if (isLoading) {
    return <div role="status" aria-live="polite">Loading exercises...</div>;
  }

  return (
    <div className="exercise-manager">
      <h2>Exercise Library Manager</h2>
      
      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      <div style={{ marginBottom: '2rem' }}>
        <h3>Built-in Exercises</h3>
        <p>
          The app includes {BARBELL_EXERCISES.length} built-in exercises across{' '}
          {new Set(BARBELL_EXERCISES.map(ex => ex.category)).size} categories.
          You can add your own custom exercises below.
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => {
            resetForm();
            setIsFormVisible(!isFormVisible);
          }}
          className="btn-primary"
          aria-expanded={isFormVisible}
          aria-controls="exercise-form"
        >
          {isFormVisible ? 'Cancel' : 'Add New Exercise'}
        </button>
      </div>

      {isFormVisible && (
        <form 
          id="exercise-form"
          onSubmit={handleSubmit} 
          style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}
          aria-label={editingExercise ? 'Edit exercise form' : 'Add new exercise form'}
        >
          <h3>{editingExercise ? 'Edit Exercise' : 'Add New Exercise'}</h3>

          <div className="form-section">
            <label htmlFor="exercise-name" className="form-label">
              <span>Exercise Name:</span> <span className="sr-only">(required)</span>
            </label>
            <input
              id="exercise-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Bulgarian Split Squat"
              className="form-input"
              required
              aria-required="true"
            />
          </div>

          <div className="form-section">
            <label htmlFor="exercise-category" className="form-label">
              <span>Category:</span> <span className="sr-only">(required)</span>
            </label>
            <input
              id="exercise-category"
              type="text"
              list="category-suggestions"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Legs, Chest, Back"
              className="form-input"
              required
              aria-required="true"
              aria-describedby="category-help"
            />
            <datalist id="category-suggestions">
              {allCategories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <small id="category-help" className="form-help">
              Select an existing category or create a new one
            </small>
          </div>

          <div className="form-section">
            <label htmlFor="exercise-description" className="form-label">
              Description (optional):
            </label>
            <textarea
              id="exercise-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the exercise"
              className="form-textarea"
              rows={2}
            />
          </div>

          <div className="form-section">
            <label htmlFor="exercise-muscles" className="form-label">
              <span>Muscle Groups:</span> <span className="sr-only">(required)</span>
            </label>
            <input
              id="exercise-muscles"
              type="text"
              value={formData.muscleGroups}
              onChange={(e) => setFormData({ ...formData, muscleGroups: e.target.value })}
              placeholder="e.g., Quadriceps, Glutes, Hamstrings"
              className="form-input"
              required
              aria-required="true"
              aria-describedby="muscles-help"
            />
            <small id="muscles-help" className="form-help">
              Separate multiple muscle groups with commas
            </small>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn-primary">
              {editingExercise ? 'Update Exercise' : 'Add Exercise'}
            </button>
            <button 
              type="button" 
              onClick={resetForm}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div>
        <h3>Your Custom Exercises ({customExercises.length})</h3>
        {customExercises.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#666' }}>
            No custom exercises yet. Click "Add New Exercise" to create one.
          </p>
        ) : (
          <div role="list" aria-label="Custom exercises list">
            {customExercises.map((exercise) => (
              <div
                key={exercise.id}
                role="listitem"
                style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{exercise.name}</h4>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                      <strong>Category:</strong> {exercise.category}
                    </p>
                    {exercise.description && (
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                        {exercise.description}
                      </p>
                    )}
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                      <strong>Muscles:</strong> {exercise.muscleGroups.join(', ')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      aria-label={`Edit ${exercise.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exercise.id)}
                      className="btn-danger"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      aria-label={`Delete ${exercise.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseManager;
