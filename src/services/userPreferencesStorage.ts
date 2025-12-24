// User Preferences Storage Service
// Tracks user status (first-time vs returning) and preferences

export interface UserPreferences {
  isFirstTimeUser: boolean;
  profileCompleted: boolean;
  onboardingCompleted: boolean;
  lastVisitDate: string | null;
  notificationsEnabled: boolean;
  preferredRestTime: number; // in seconds
  autoSaveEnabled: boolean; // Auto-save workout sessions
  autoSaveInterval: number; // Auto-save interval in seconds (default: 30)
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
  autoSaveEnabled: true,
  autoSaveInterval: 30,
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

  // Reset to first-time user state (for testing)
  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Create and export singleton instance
export const userPreferencesStorage = new UserPreferencesStorage();

// Export class for testing
export { UserPreferencesStorage };
