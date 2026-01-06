import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workoutTemplateStorage } from '../services/workoutTemplateStorage';
import type { WorkoutTemplate } from '../types';
import { simulateIDBSuccess, simulateIDBUpgradeNeeded } from './setup';

describe('workoutTemplateStorage', () => {
  const mockTemplate: WorkoutTemplate = {
    id: 'test-template-1',
    name: 'Test Program',
    programType: 'custom',
    description: 'A test program',
    split: 'full-body',
    frequency: 3,
    weekCount: 1,
    weeks: [
      {
        weekNumber: 1,
        weekName: 'Week 1',
        workouts: [
          {
            dayNumber: 1,
            dayName: 'Day 1',
            exercises: [
              {
                exerciseId: 'squat',
                exerciseName: 'Squat',
                order: 1,
                setScheme: {
                  sets: 5,
                  reps: 5,
                  restSeconds: 180,
                },
              },
            ],
          },
        ],
      },
    ],
    requiresOneRepMax: false,
    isBuiltIn: false,
    createdDate: new Date(),
    createdBy: 'user',
    tags: ['beginner', 'strength'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize the database successfully', async () => {
      const initPromise = workoutTemplateStorage.initialize();
      simulateIDBUpgradeNeeded();
      await expect(initPromise).resolves.toBeUndefined();
    });
  });

  describe('template management', () => {
    beforeEach(async () => {
      const initPromise = workoutTemplateStorage.initialize();
      simulateIDBUpgradeNeeded();
      await initPromise;
    });

    it('should save a template successfully', async () => {
      const savePromise = workoutTemplateStorage.saveTemplate(mockTemplate);
      simulateIDBSuccess();
      await expect(savePromise).resolves.toBeUndefined();
    });

    it('should get all templates', async () => {
      const mockTemplates = [mockTemplate];
      const getAllPromise = workoutTemplateStorage.getAllTemplates();
      simulateIDBSuccess(mockTemplates);
      
      const result = await getAllPromise;
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-template-1');
    });

    it('should get template by ID', async () => {
      const getPromise = workoutTemplateStorage.getTemplate('test-template-1');
      simulateIDBSuccess(mockTemplate);
      
      const result = await getPromise;
      expect(result?.id).toBe('test-template-1');
      expect(result?.name).toBe('Test Program');
    });

    it('should return undefined for non-existent template', async () => {
      const getPromise = workoutTemplateStorage.getTemplate('non-existent');
      simulateIDBSuccess(undefined);
      
      const result = await getPromise;
      expect(result).toBeUndefined();
    });

    it('should delete a template', async () => {
      const deletePromise = workoutTemplateStorage.deleteTemplate('test-template-1');
      simulateIDBSuccess();
      
      await expect(deletePromise).resolves.toBeUndefined();
    });

    it('should get templates by program type', async () => {
      const mockTemplates = [mockTemplate];
      const getPromise = workoutTemplateStorage.getTemplatesByProgramType('custom');
      simulateIDBSuccess(mockTemplates);
      
      const result = await getPromise;
      expect(result).toHaveLength(1);
      expect(result[0].programType).toBe('custom');
    });

    it('should get templates by split', async () => {
      const mockTemplates = [mockTemplate];
      const getPromise = workoutTemplateStorage.getTemplatesBySplit('full-body');
      simulateIDBSuccess(mockTemplates);
      
      const result = await getPromise;
      expect(result).toHaveLength(1);
      expect(result[0].split).toBe('full-body');
    });

    it('should get templates by frequency', async () => {
      const mockTemplates = [mockTemplate];
      const getPromise = workoutTemplateStorage.getTemplatesByFrequency(3);
      simulateIDBSuccess(mockTemplates);
      
      const result = await getPromise;
      expect(result).toHaveLength(1);
      expect(result[0].frequency).toBe(3);
    });

    it('should get built-in templates only', async () => {
      const builtInTemplate: WorkoutTemplate = {
        ...mockTemplate,
        id: 'builtin-test',
        isBuiltIn: true,
        createdBy: 'system',
      };
      const mockTemplates = [builtInTemplate];
      
      const getPromise = workoutTemplateStorage.getBuiltInTemplates();
      simulateIDBSuccess(mockTemplates);
      
      const result = await getPromise;
      expect(result).toHaveLength(1);
      expect(result[0].isBuiltIn).toBe(true);
    });

    it('should filter built-in templates from mixed results', async () => {
      const builtInTemplate: WorkoutTemplate = {
        ...mockTemplate,
        id: 'builtin-test',
        isBuiltIn: true,
        createdBy: 'system',
      };
      const customTemplate: WorkoutTemplate = {
        ...mockTemplate,
        id: 'custom-test',
        isBuiltIn: false,
      };
      const mockTemplates = [builtInTemplate, customTemplate];
      
      const getPromise = workoutTemplateStorage.getBuiltInTemplates();
      simulateIDBSuccess(mockTemplates);
      
      const result = await getPromise;
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('builtin-test');
      expect(result[0].isBuiltIn).toBe(true);
    });
  });

  describe('template structure validation', () => {
    it('should create a valid template with all required fields', () => {
      expect(mockTemplate.id).toBe('test-template-1');
      expect(mockTemplate.name).toBe('Test Program');
      expect(mockTemplate.programType).toBe('custom');
      expect(mockTemplate.split).toBe('full-body');
      expect(mockTemplate.frequency).toBe(3);
      expect(mockTemplate.weekCount).toBe(1);
      expect(mockTemplate.weeks).toHaveLength(1);
      expect(mockTemplate.weeks[0].workouts).toHaveLength(1);
      expect(mockTemplate.weeks[0].workouts[0].exercises).toHaveLength(1);
    });

    it('should support optional fields', () => {
      const templateWithOptionals: WorkoutTemplate = {
        ...mockTemplate,
        notes: 'Test notes',
        tags: ['test', 'optional'],
      };
      
      expect(templateWithOptionals.notes).toBe('Test notes');
      expect(templateWithOptionals.tags).toContain('test');
      expect(templateWithOptionals.tags).toContain('optional');
    });

    it('should support set scheme with percentage', () => {
      const exerciseWithPercentage = {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        order: 1,
        setScheme: {
          sets: 3,
          reps: 5,
          percentage: 85,
          restSeconds: 180,
        },
      };
      
      expect(exerciseWithPercentage.setScheme.percentage).toBe(85);
    });

    it('should support set scheme with RPE', () => {
      const exerciseWithRPE = {
        exerciseId: 'deadlift',
        exerciseName: 'Deadlift',
        order: 1,
        setScheme: {
          sets: 1,
          reps: 5,
          rpe: 9,
          restSeconds: 300,
        },
      };
      
      expect(exerciseWithRPE.setScheme.rpe).toBe(9);
    });
  });
});
