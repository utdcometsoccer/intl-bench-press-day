// User Preferences Storage Service
// Tracks user status (first-time vs returning) and preferences

import type { DefaultWorkoutTimes, TabType } from '../types';

export interface UserPreferences {
  isFirstTimeUser: boolean;
  profileCompleted: boolean;
  onboardingCompleted: boolean;
  lastVisitDate: string | null;
  notificationsEnabled: boolean;
  preferredRestTime: number; // in seconds
  autoStartRestTimer: boolean; // Auto-start rest timer after completing a set
  autoSaveEnabled: boolean; // Auto-save workout sessions
  autoSaveInterval: number; // Auto-save interval in seconds (default: 30)
  defaultWorkoutTimes?: DefaultWorkoutTimes; // Default workout times for each day of the week
  notificationLeadTime?: number; // Minutes before workout to send notification (default: 30)
  defaultView?: TabType; // Default tab to show on app start
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  isFirstTimeUser: true,
  profileCompleted: false,
  onboardingCompleted: false,
  lastVisitDate: null,
  notificationsEnabled: false,
  preferredRestTime: 90,
  autoStartRestTimer: false,
  autoSaveEnabled: true,
  autoSaveInterval: 30,
  defaultWorkoutTimes: {
    day1: '09:00', // Monday
    day2: '09:00', // Tuesday
    day4: '09:00', // Thursday
    day5: '09:00', // Friday
  },
  notificationLeadTime: 30, // 30 minutes before workout
  defaultView: 'dashboard', // Default to dashboard view
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = 'userPreferences';

class UserPreferencesStorage {
  // Get user preferences from localStorage
  getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserPreferences;
        // Update last visit date
        parsed.lastVisitDate = new Date().toISOString();
        this.savePreferences(parsed);
        return parsed;
      }
      // First time user - create default preferences
      const newPreferences = {
        ...DEFAULT_PREFERENCES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.savePreferences(newPreferences);
      return newPreferences;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  // Save user preferences to localStorage
  savePreferences(preferences: UserPreferences): void {
    try {
      const updated = {
        ...preferences,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  // Check if user is first-time user
  isFirstTimeUser(): boolean {
    const preferences = this.getPreferences();
    return preferences.isFirstTimeUser && !preferences.onboardingCompleted;
  }

  // Mark onboarding as completed
  completeOnboarding(): void {
    const preferences = this.getPreferences();
    preferences.isFirstTimeUser = false;
    preferences.onboardingCompleted = true;
    this.savePreferences(preferences);
  }

  // Mark profile as completed
  completeProfile(): void {
    const preferences = this.getPreferences();
    preferences.profileCompleted = true;
    this.savePreferences(preferences);
  }

  // Update notification preference
  setNotificationsEnabled(enabled: boolean): void {
    const preferences = this.getPreferences();
    preferences.notificationsEnabled = enabled;
    this.savePreferences(preferences);
  }

  // Update preferred rest time
  setPreferredRestTime(seconds: number): void {
    const preferences = this.getPreferences();
    preferences.preferredRestTime = seconds;
    this.savePreferences(preferences);
  }

  // Update auto-start rest timer preference
  setAutoStartRestTimer(enabled: boolean): void {
    const preferences = this.getPreferences();
    preferences.autoStartRestTimer = enabled;
    this.savePreferences(preferences);
  }

  // Update auto-save enabled preference
  setAutoSaveEnabled(enabled: boolean): void {
    const preferences = this.getPreferences();
    preferences.autoSaveEnabled = enabled;
    this.savePreferences(preferences);
  }

  // Update auto-save interval
  setAutoSaveInterval(seconds: number): void {
    const preferences = this.getPreferences();
    preferences.autoSaveInterval = seconds;
    this.savePreferences(preferences);
  }

  // Update default workout times
  setDefaultWorkoutTimes(times: DefaultWorkoutTimes): void {
    const preferences = this.getPreferences();
    preferences.defaultWorkoutTimes = times;
    this.savePreferences(preferences);
  }

  // Update notification lead time
  setNotificationLeadTime(minutes: number): void {
    const preferences = this.getPreferences();
    preferences.notificationLeadTime = minutes;
    this.savePreferences(preferences);
  }

  // Update default view preference
  setDefaultView(view: TabType): void {
    const preferences = this.getPreferences();
    preferences.defaultView = view;
    this.savePreferences(preferences);
  }

  // Get default view preference
  getDefaultView(): TabType {
    const preferences = this.getPreferences();
    return preferences.defaultView || 'dashboard';
  }

  // Reset to first-time user state (for testing)
  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Create and export singleton instance
export const userPreferencesStorage = new UserPreferencesStorage();

// Export class for testing
export { UserPreferencesStorage };
