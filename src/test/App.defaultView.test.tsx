import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';
import { userPreferencesStorage } from '../services/userPreferencesStorage';

// Mock the userPreferencesStorage
vi.mock('../services/userPreferencesStorage', () => {
  const actualStorage = {
    getPreferences: vi.fn(() => ({
      isFirstTimeUser: false,
      profileCompleted: true,
      onboardingCompleted: true,
      lastVisitDate: new Date().toISOString(),
      notificationsEnabled: false,
      preferredRestTime: 90,
      autoSaveEnabled: true,
      autoSaveInterval: 30,
      defaultView: 'dashboard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    getDefaultView: vi.fn(() => 'dashboard'),
    isFirstTimeUser: vi.fn(() => false),
    savePreferences: vi.fn(),
    completeOnboarding: vi.fn(),
    completeProfile: vi.fn(),
    setNotificationsEnabled: vi.fn(),
    setPreferredRestTime: vi.fn(),
    setAutoSaveEnabled: vi.fn(),
    setAutoSaveInterval: vi.fn(),
    setDefaultWorkoutTimes: vi.fn(),
    setNotificationLeadTime: vi.fn(),
    setDefaultView: vi.fn(),
    reset: vi.fn(),
  };

  return {
    userPreferencesStorage: actualStorage,
    UserPreferencesStorage: vi.fn(() => actualStorage),
  };
});

describe('App - Default View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should use dashboard as default view when user preference is dashboard', async () => {
    (userPreferencesStorage.getDefaultView as ReturnType<typeof vi.fn>).mockReturnValue('dashboard');
    (userPreferencesStorage.isFirstTimeUser as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<App />);

    // Wait for app to load (not showing first time wizard or app loading screen)
    await waitFor(() => {
      expect(screen.getByText('International Bench Press Day')).toBeInTheDocument();
    });

    // Should call getDefaultView
    expect(userPreferencesStorage.getDefaultView).toHaveBeenCalled();

    // Dashboard button should be active
    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardButton).toHaveClass('active');
  });

  it('should use tracker view when user preference is set to tracker', async () => {
    (userPreferencesStorage.getDefaultView as ReturnType<typeof vi.fn>).mockReturnValue('tracker');
    (userPreferencesStorage.isFirstTimeUser as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<App />);

    // Wait for app to finish initial loading
    await waitFor(() => {
      expect(screen.getByText('International Bench Press Day')).toBeInTheDocument();
    });

    expect(userPreferencesStorage.getDefaultView).toHaveBeenCalled();

    // Exercise Tracker button should be active
    const trackerButton = screen.getByRole('button', { name: /exercise tracker/i });
    expect(trackerButton).toHaveClass('active');
  });

  it('should use progress view when user preference is set to progress', async () => {
    (userPreferencesStorage.getDefaultView as ReturnType<typeof vi.fn>).mockReturnValue('progress');
    (userPreferencesStorage.isFirstTimeUser as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('International Bench Press Day')).toBeInTheDocument();
    });

    expect(userPreferencesStorage.getDefaultView).toHaveBeenCalled();

    // Progress Chart button should be active
    const progressButton = screen.getByRole('button', { name: /progress chart/i });
    expect(progressButton).toHaveClass('active');
  });

  it('should default to dashboard when no preference is set', async () => {
    (userPreferencesStorage.getDefaultView as ReturnType<typeof vi.fn>).mockReturnValue('dashboard');
    (userPreferencesStorage.isFirstTimeUser as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('International Bench Press Day')).toBeInTheDocument();
    });

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardButton).toHaveClass('active');
  });
});
