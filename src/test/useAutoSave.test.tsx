import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutoSave, useSessionCleanup } from '../hooks/useAutoSave';
import type { WorkoutSession } from '../types';
import { workoutResultsStorage } from '../services/workoutResultsStorage';
import { userPreferencesStorage } from '../services/userPreferencesStorage';

// Mock the storage services
vi.mock('../services/workoutResultsStorage', () => ({
  workoutResultsStorage: {
    initialize: vi.fn(),
    saveWorkoutSession: vi.fn(),
    cleanupOldIncompleteSessions: vi.fn(),
  },
}));

vi.mock('../services/userPreferencesStorage', () => ({
  userPreferencesStorage: {
    getPreferences: vi.fn(),
    setAutoSaveEnabled: vi.fn(),
    setAutoSaveInterval: vi.fn(),
  },
}));

// Helper to create mock user preferences
const createMockPreferences = (overrides = {}) => ({
  autoSaveEnabled: true,
  autoSaveInterval: 30,
  isFirstTimeUser: false,
  profileCompleted: true,
  onboardingCompleted: true,
  lastVisitDate: new Date().toISOString(),
  notificationsEnabled: false,
  preferredRestTime: 90,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('useAutoSave', () => {
  let mockSession: WorkoutSession;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to their default implementations
    vi.mocked(workoutResultsStorage.initialize).mockResolvedValue(undefined);
    vi.mocked(workoutResultsStorage.saveWorkoutSession).mockResolvedValue('session-id');
    vi.mocked(workoutResultsStorage.cleanupOldIncompleteSessions).mockResolvedValue(0);
    
    vi.mocked(userPreferencesStorage.getPreferences).mockReturnValue(createMockPreferences());

    mockSession = {
      id: 'session-1',
      cycleId: 'cycle-1',
      week: 1,
      day: 1,
      dateStarted: new Date(),
      isCompleted: false,
      workoutResults: [],
    };
  });

  it('should initialize auto-save when enabled with active session', async () => {
    const { result } = renderHook(() => useAutoSave(mockSession));

    await waitFor(() => {
      expect(workoutResultsStorage.initialize).toHaveBeenCalled();
    }, { timeout: 1000 });

    expect(result.current.isAutoSaveEnabled).toBe(true);
    expect(result.current.autoSaveInterval).toBe(30);
  });

  it('should not auto-save when session is null', async () => {
    renderHook(() => useAutoSave(null));

    // Wait a bit to ensure no save happens
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(workoutResultsStorage.saveWorkoutSession).not.toHaveBeenCalled();
  });

  it('should not auto-save when session is completed', async () => {
    const completedSession = { ...mockSession, isCompleted: true };
    renderHook(() => useAutoSave(completedSession));

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(workoutResultsStorage.saveWorkoutSession).not.toHaveBeenCalled();
  });

  it('should perform initial save immediately', async () => {
    renderHook(() => useAutoSave(mockSession));

    await waitFor(() => {
      expect(workoutResultsStorage.saveWorkoutSession).toHaveBeenCalledWith(mockSession);
    }, { timeout: 1000 });
  });

  it('should respect user preference for auto-save enabled', async () => {
    vi.mocked(userPreferencesStorage.getPreferences).mockReturnValue(
      createMockPreferences({ autoSaveEnabled: false })
    );

    const { result } = renderHook(() => useAutoSave(mockSession));

    expect(result.current.isAutoSaveEnabled).toBe(false);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(workoutResultsStorage.saveWorkoutSession).not.toHaveBeenCalled();
  });

  it('should allow options to override user preferences', async () => {
    vi.mocked(userPreferencesStorage.getPreferences).mockReturnValue(
      createMockPreferences({ autoSaveEnabled: false, autoSaveInterval: 30 })
    );

    const { result } = renderHook(() => 
      useAutoSave(mockSession, { enabled: true, interval: 5 })
    );

    expect(result.current.isAutoSaveEnabled).toBe(true);
    expect(result.current.autoSaveInterval).toBe(5);

    await waitFor(() => {
      expect(workoutResultsStorage.saveWorkoutSession).toHaveBeenCalledWith(mockSession);
    }, { timeout: 1000 });
  });

  it('should call onSave callback after successful save', async () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave(mockSession, { onSave }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mockSession);
    }, { timeout: 1000 });
  });

  it('should call onError callback on save failure', async () => {
    const error = new Error('Save failed');
    // Override mock to reject on first call
    vi.mocked(workoutResultsStorage.saveWorkoutSession).mockRejectedValueOnce(error);

    const onError = vi.fn();
    renderHook(() => useAutoSave(mockSession, { onError }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    }, { timeout: 1000 });
  });

  it('should support manual save', async () => {
    const { result } = renderHook(() => useAutoSave(mockSession));

    await waitFor(() => {
      expect(result.current.manualSave).toBeDefined();
    }, { timeout: 1000 });

    // Clear previous calls
    vi.mocked(workoutResultsStorage.saveWorkoutSession).mockClear();

    // Trigger manual save
    await result.current.manualSave();

    expect(workoutResultsStorage.saveWorkoutSession).toHaveBeenCalledWith(mockSession);
  });

  it('should cleanup interval on unmount', async () => {
    const { unmount } = renderHook(() => useAutoSave(mockSession, { interval: 1 }));

    await waitFor(() => {
      expect(workoutResultsStorage.saveWorkoutSession).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });

    // Unmount the hook
    unmount();

    // Clear mock
    const initialCallCount = vi.mocked(workoutResultsStorage.saveWorkoutSession).mock.calls.length;

    // Wait for what would be the next interval
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Should not have additional saves after unmount
    expect(workoutResultsStorage.saveWorkoutSession).toHaveBeenCalledTimes(initialCallCount);
  });
});

describe('useSessionCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cleanup old incomplete sessions on mount', async () => {
    renderHook(() => useSessionCleanup(3));

    await waitFor(() => {
      expect(workoutResultsStorage.initialize).toHaveBeenCalled();
      expect(workoutResultsStorage.cleanupOldIncompleteSessions).toHaveBeenCalledWith(3);
    });
  });

  it('should use default max age of 3 hours', async () => {
    renderHook(() => useSessionCleanup());

    await waitFor(() => {
      expect(workoutResultsStorage.cleanupOldIncompleteSessions).toHaveBeenCalledWith(3);
    });
  });

  it('should respect custom max age', async () => {
    renderHook(() => useSessionCleanup(5));

    await waitFor(() => {
      expect(workoutResultsStorage.cleanupOldIncompleteSessions).toHaveBeenCalledWith(5);
    });
  });

  it('should only cleanup once', async () => {
    const { rerender } = renderHook(() => useSessionCleanup(3));

    await waitFor(() => {
      expect(workoutResultsStorage.cleanupOldIncompleteSessions).toHaveBeenCalledTimes(1);
    });

    // Clear mock and rerender
    vi.mocked(workoutResultsStorage.cleanupOldIncompleteSessions).mockClear();
    rerender();

    // Should not cleanup again
    expect(workoutResultsStorage.cleanupOldIncompleteSessions).not.toHaveBeenCalled();
  });

  it('should handle cleanup errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Cleanup failed');
    vi.mocked(workoutResultsStorage.cleanupOldIncompleteSessions).mockRejectedValueOnce(error);

    renderHook(() => useSessionCleanup(3));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to cleanup old sessions:', error);
    });

    consoleSpy.mockRestore();
  });
});
