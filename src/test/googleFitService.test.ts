import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleFitService, createGoogleFitService } from '../services/googleFitService';
import { GoogleFitClient } from '../services/googleFitClient';
import type { WorkoutResult } from '../types';

// Mock the GoogleFitClient
vi.mock('../services/googleFitClient', () => ({
  GoogleFitClient: vi.fn().mockImplementation(() => ({
    isAuthenticated: vi.fn().mockReturnValue(false),
    authenticate: vi.fn().mockResolvedValue({ accessToken: 'test', expiresAt: Date.now() + 3600000 }),
    clearAuth: vi.fn(),
    sessions: {
      create: vi.fn().mockResolvedValue(undefined),
    },
  })),
}));

describe('GoogleFitService', () => {
  let service: GoogleFitService;
  let mockClient: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    authenticate: ReturnType<typeof vi.fn>;
    clearAuth: ReturnType<typeof vi.fn>;
    sessions: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  const mockWorkoutResult: WorkoutResult = {
    id: 'workout-1',
    cycleId: 'cycle-1',
    cycleName: 'Winter 2024',
    workoutId: 'planned-1',
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    week: 1,
    day: 1,
    datePerformed: new Date('2024-01-15T18:00:00Z'),
    warmupResults: [],
    mainSetResults: [
      {
        plannedReps: 5,
        plannedWeight: 225,
        actualReps: 5,
        actualWeight: 225,
        percentage: 85,
        isAmrap: false,
      },
    ],
    duration: 45,
    workoutNotes: 'Good session',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockClient = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      authenticate: vi.fn().mockResolvedValue({ accessToken: 'test', expiresAt: Date.now() + 3600000 }),
      clearAuth: vi.fn(),
      sessions: {
        create: vi.fn().mockResolvedValue(undefined),
      },
    };
    
    (GoogleFitClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockClient);
    service = new GoogleFitService();
  });

  describe('isConnected', () => {
    it('should return false when client is not authenticated', () => {
      mockClient.isAuthenticated.mockReturnValue(false);
      expect(service.isConnected()).toBe(false);
    });

    it('should return true when client is authenticated', () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('connect', () => {
    it('should call client authenticate', async () => {
      await service.connect();
      expect(mockClient.authenticate).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should call client clearAuth', () => {
      service.disconnect();
      expect(mockClient.clearAuth).toHaveBeenCalled();
    });
  });

  describe('syncWorkout', () => {
    it('should create session with correct parameters', async () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      
      await service.syncWorkout(mockWorkoutResult);

      expect(mockClient.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Bench Press - Winter 2024',
          description: 'Good session',
          activityType: 97, // Weight training
        })
      );
    });

    it('should handle string date format', async () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      
      const workoutWithStringDate = {
        ...mockWorkoutResult,
        datePerformed: '2024-01-15T18:00:00Z' as unknown as Date,
      };

      await service.syncWorkout(workoutWithStringDate);

      expect(mockClient.sessions.create).toHaveBeenCalled();
    });

    it('should throw error for invalid date', async () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      
      const workoutWithInvalidDate = {
        ...mockWorkoutResult,
        datePerformed: 'invalid-date' as unknown as Date,
      };

      await expect(service.syncWorkout(workoutWithInvalidDate)).rejects.toThrow('Invalid date for workout');
    });

    it('should use default duration when not provided', async () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      
      const workoutWithoutDuration = {
        ...mockWorkoutResult,
        duration: undefined,
      };

      await service.syncWorkout(workoutWithoutDuration);

      const createCall = mockClient.sessions.create.mock.calls[0][0];
      const expectedEndTime = new Date('2024-01-15T18:00:00Z').getTime() + 60 * 60000; // 60 minutes default
      expect(createCall.endTimeMillis).toBe(expectedEndTime);
    });

    it('should calculate end time based on duration', async () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      
      await service.syncWorkout(mockWorkoutResult);

      const createCall = mockClient.sessions.create.mock.calls[0][0];
      const expectedEndTime = new Date('2024-01-15T18:00:00Z').getTime() + 45 * 60000;
      expect(createCall.endTimeMillis).toBe(expectedEndTime);
    });
  });

  describe('syncWorkouts', () => {
    it('should sync all workouts successfully', async () => {
      mockClient.isAuthenticated.mockReturnValue(true);

      const workouts = [mockWorkoutResult, { ...mockWorkoutResult, id: 'workout-2' }];
      const result = await service.syncWorkouts(workouts);

      expect(result.success).toBe(true);
      expect(result.syncedWorkouts).toBe(2);
      expect(result.failedWorkouts).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      mockClient.sessions.create
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('API error'));

      const workouts = [mockWorkoutResult, { ...mockWorkoutResult, id: 'workout-2' }];
      const result = await service.syncWorkouts(workouts);

      expect(result.success).toBe(false);
      expect(result.syncedWorkouts).toBe(1);
      expect(result.failedWorkouts).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('workout-2');
    });

    it('should handle empty workouts array', async () => {
      const result = await service.syncWorkouts([]);

      expect(result.success).toBe(true);
      expect(result.syncedWorkouts).toBe(0);
      expect(result.failedWorkouts).toBe(0);
    });
  });

  describe('createGoogleFitService factory', () => {
    it('should create a new service instance', () => {
      const newService = createGoogleFitService();
      expect(newService).toBeInstanceOf(GoogleFitService);
    });

    it('should accept custom client', () => {
      const customClient = new GoogleFitClient();
      const newService = createGoogleFitService(customClient);
      expect(newService).toBeDefined();
    });
  });
});
