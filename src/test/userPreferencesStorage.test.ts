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

  describe('UserPreferencesStorage class', () => {
    it('should create instance', () => {
      const storage = new UserPreferencesStorage();
      expect(storage).toBeDefined();
    });
  });
});
