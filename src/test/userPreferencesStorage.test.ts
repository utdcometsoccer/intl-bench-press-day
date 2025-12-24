import { describe, it, expect, beforeEach } from 'vitest';
import { 
  userPreferencesStorage, 
  UserPreferencesStorage 
} from '../services/userPreferencesStorage';

describe('UserPreferencesStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getPreferences', () => {
    it('should return default preferences for first-time users', () => {
      const preferences = userPreferencesStorage.getPreferences();
      
      expect(preferences.isFirstTimeUser).toBe(true);
      expect(preferences.profileCompleted).toBe(false);
      expect(preferences.onboardingCompleted).toBe(false);
      expect(preferences.notificationsEnabled).toBe(false);
      expect(preferences.preferredRestTime).toBe(90);
    });

    it('should return saved preferences for returning users', () => {
      // Save preferences first
      const prefs = userPreferencesStorage.getPreferences();
      prefs.isFirstTimeUser = false;
      prefs.profileCompleted = true;
      prefs.preferredRestTime = 120;
      userPreferencesStorage.savePreferences(prefs);

      // Get preferences again
      const preferences = userPreferencesStorage.getPreferences();
      
      expect(preferences.isFirstTimeUser).toBe(false);
      expect(preferences.profileCompleted).toBe(true);
      expect(preferences.preferredRestTime).toBe(120);
    });
  });

  describe('isFirstTimeUser', () => {
    it('should return true for new users', () => {
      expect(userPreferencesStorage.isFirstTimeUser()).toBe(true);
    });

    it('should return false after onboarding is completed', () => {
      userPreferencesStorage.completeOnboarding();
      expect(userPreferencesStorage.isFirstTimeUser()).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    it('should mark onboarding as completed', () => {
      userPreferencesStorage.completeOnboarding();
      
      const preferences = userPreferencesStorage.getPreferences();
      expect(preferences.isFirstTimeUser).toBe(false);
      expect(preferences.onboardingCompleted).toBe(true);
    });
  });

  describe('completeProfile', () => {
    it('should mark profile as completed', () => {
      userPreferencesStorage.completeProfile();
      
      const preferences = userPreferencesStorage.getPreferences();
      expect(preferences.profileCompleted).toBe(true);
    });
  });

  describe('setNotificationsEnabled', () => {
    it('should update notification preference', () => {
      userPreferencesStorage.setNotificationsEnabled(true);
      
      const preferences = userPreferencesStorage.getPreferences();
      expect(preferences.notificationsEnabled).toBe(true);
    });
  });

  describe('setPreferredRestTime', () => {
    it('should update preferred rest time', () => {
      userPreferencesStorage.setPreferredRestTime(180);
      
      const preferences = userPreferencesStorage.getPreferences();
      expect(preferences.preferredRestTime).toBe(180);
    });
  });

  describe('setAutoSaveEnabled', () => {
    it('should update auto-save enabled preference', () => {
      userPreferencesStorage.setAutoSaveEnabled(false);
      
      const preferences = userPreferencesStorage.getPreferences();
      expect(preferences.autoSaveEnabled).toBe(false);
    });

    it('should default to true for new users', () => {
      const preferences = userPreferencesStorage.getPreferences();
      expect(preferences.autoSaveEnabled).toBe(true);
    });
  });

  describe('setAutoSaveInterval', () => {
    it('should update auto-save interval', () => {
      userPreferencesStorage.setAutoSaveInterval(60);
      
      const preferences = userPreferencesStorage.getPreferences();
      expect(preferences.autoSaveInterval).toBe(60);
    });

    it('should default to 30 seconds for new users', () => {
      const preferences = userPreferencesStorage.getPreferences();
      expect(preferences.autoSaveInterval).toBe(30);
    });
  });

  describe('reset', () => {
    it('should clear all preferences', () => {
      // Set some preferences
      userPreferencesStorage.completeOnboarding();
      userPreferencesStorage.setPreferredRestTime(120);
      
      // Reset
      userPreferencesStorage.reset();
      
      // Should be first-time user again
      expect(userPreferencesStorage.isFirstTimeUser()).toBe(true);
    });
  });

  describe('default workout times', () => {
    it('should set and get default workout times', () => {
      const defaultTimes = {
        day1: '09:00',
        day2: '09:00',
        day4: '10:00',
        day5: '10:00',
      };

      userPreferencesStorage.setDefaultWorkoutTimes(defaultTimes);
      const preferences = userPreferencesStorage.getPreferences();

      expect(preferences.defaultWorkoutTimes).toEqual(defaultTimes);
    });

    it('should have default workout times when first initialized', () => {
      const preferences = userPreferencesStorage.getPreferences();
      
      expect(preferences.defaultWorkoutTimes).toBeDefined();
      expect(preferences.defaultWorkoutTimes?.day1).toBe('09:00');
    });
  });

  describe('notification lead time', () => {
    it('should set and get notification lead time', () => {
      userPreferencesStorage.setNotificationLeadTime(60);
      const preferences = userPreferencesStorage.getPreferences();

      expect(preferences.notificationLeadTime).toBe(60);
    });

    it('should have default notification lead time of 30 minutes', () => {
      const preferences = userPreferencesStorage.getPreferences();
      
      expect(preferences.notificationLeadTime).toBe(30);
    });
  });

  describe('UserPreferencesStorage class', () => {
    it('should create instance', () => {
      const storage = new UserPreferencesStorage();
      expect(storage).toBeDefined();
    });
  });
});
