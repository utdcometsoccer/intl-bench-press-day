// Hook for auto-saving workout sessions
import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { WorkoutSession } from '../types';
import { workoutResultsStorage } from '../services/workoutResultsStorage';
import { userPreferencesStorage } from '../services/userPreferencesStorage';

export interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number; // in seconds
  onSave?: (session: WorkoutSession) => void;
  onError?: (error: Error) => void;
}

export const useAutoSave = (
  session: WorkoutSession | null,
  options: UseAutoSaveOptions = {}
) => {
  const { 
    enabled: optionsEnabled, 
    interval: optionsInterval,
    onSave,
    onError 
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  // Get user preferences for auto-save settings (memoized to avoid unnecessary calls)
  const { autoSaveEnabled: prefAutoSaveEnabled, autoSaveInterval: prefAutoSaveInterval } = useMemo(
    () => userPreferencesStorage.getPreferences(),
    [] // Only get preferences once on mount
  );
  
  const enabled = optionsEnabled !== undefined ? optionsEnabled : prefAutoSaveEnabled;
  const interval = optionsInterval !== undefined ? optionsInterval : prefAutoSaveInterval;

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!session || session.isCompleted) {
      return;
    }

    try {
      // Only save if the session has changed
      const sessionStr = JSON.stringify(session);
      if (lastSavedRef.current === sessionStr) {
        return;
      }

      await workoutResultsStorage.saveWorkoutSession(session);
      lastSavedRef.current = sessionStr;
      
      if (onSave) {
        onSave(session);
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        console.error('Auto-save failed:', error);
      }
    }
  }, [session, onSave, onError]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !session || session.isCompleted) {
      // Clear interval if auto-save is disabled or no active session
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initialize storage if needed
    const initAndStartAutoSave = async () => {
      try {
        await workoutResultsStorage.initialize();
        
        // Perform initial save
        await autoSave();

        // Set up interval for periodic saves
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
          autoSave();
        }, interval * 1000);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          console.error('Failed to initialize auto-save:', error);
        }
      }
    };

    initAndStartAutoSave();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, session, autoSave, onError]);

  // Manual save function
  const manualSave = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      await workoutResultsStorage.initialize();
      await workoutResultsStorage.saveWorkoutSession(session);
      lastSavedRef.current = JSON.stringify(session);
      
      if (onSave) {
        onSave(session);
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        console.error('Manual save failed:', error);
      }
      throw error;
    }
  }, [session, onSave, onError]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    manualSave,
    isAutoSaveEnabled: enabled,
    autoSaveInterval: interval,
  }), [manualSave, enabled, interval]);
};

// Hook for cleaning up old incomplete sessions
export const useSessionCleanup = (maxAgeHours: number = 3) => {
  const hasCleanedRef = useRef(false);

  useEffect(() => {
    if (hasCleanedRef.current) {
      return;
    }

    const cleanup = async () => {
      try {
        await workoutResultsStorage.initialize();
        const deletedCount = await workoutResultsStorage.cleanupOldIncompleteSessions(maxAgeHours);
        
        if (deletedCount > 0) {
          console.log(`Cleaned up ${deletedCount} old incomplete workout session(s)`);
        }
        
        hasCleanedRef.current = true;
      } catch (error) {
        console.error('Failed to cleanup old sessions:', error);
      }
    };

    cleanup();
  }, [maxAgeHours]);
};
