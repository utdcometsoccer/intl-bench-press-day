/**
 * Workout Template Storage Service
 * 
 * Manages workout program templates in IndexedDB, including built-in templates
 * for popular programs like StrongLifts 5x5, Starting Strength, etc.
 */

import type {
  WorkoutTemplate,
  ProgramType,
  WorkoutSplit,
  TrainingFrequency,
} from '../types';

class WorkoutTemplateStorage {
  private dbName = 'WorkoutTemplateDB';
  private dbVersion = 1;
  private storeName = 'templates';
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create templates object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'id',
          });

          // Create indexes for filtering
          objectStore.createIndex('programType', 'programType', { unique: false });
          objectStore.createIndex('split', 'split', { unique: false });
          objectStore.createIndex('frequency', 'frequency', { unique: false });
          objectStore.createIndex('isBuiltIn', 'isBuiltIn', { unique: false });
        }
      };
    });
  }

  /**
   * Get all workout templates
   */
  async getAllTemplates(): Promise<WorkoutTemplate[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get templates by program type
   */
  async getTemplatesByProgramType(programType: ProgramType): Promise<WorkoutTemplate[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('programType');
      const request = index.getAll(programType);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get templates by split type
   */
  async getTemplatesBySplit(split: WorkoutSplit): Promise<WorkoutTemplate[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('split');
      const request = index.getAll(split);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get templates by training frequency
   */
  async getTemplatesByFrequency(frequency: TrainingFrequency): Promise<WorkoutTemplate[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('frequency');
      const request = index.getAll(frequency);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all built-in templates
   */
  async getBuiltInTemplates(): Promise<WorkoutTemplate[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      
      // Get all templates and filter in code since boolean indexing has TypeScript issues
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const allTemplates = request.result as WorkoutTemplate[] | undefined;
        if (!allTemplates) {
          resolve([]);
          return;
        }
        const builtInTemplates = allTemplates.filter(t => t.isBuiltIn === true);
        resolve(builtInTemplates);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save a workout template
   */
  async saveTemplate(template: WorkoutTemplate): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(template);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a workout template
   */
  async deleteTemplate(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Initialize built-in templates if they don't exist
   */
  async initializeBuiltInTemplates(): Promise<void> {
    const existingTemplates = await this.getBuiltInTemplates();
    
    // Only initialize if no built-in templates exist
    if (existingTemplates.length > 0) {
      return;
    }

    const builtInTemplates = [
      this.createFiveThreeOneTemplate(),
      this.createStrongLifts5x5Template(),
      this.createStartingStrengthTemplate(),
      this.createJuggernautTemplate(),
      this.createTexasMethodTemplate(),
      this.createMadcow5x5Template(),
      this.createWestsideBarbellTemplate(),
    ];

    for (const template of builtInTemplates) {
      await this.saveTemplate(template);
    }
  }

  /**
   * Create 5/3/1 template
   */
  private createFiveThreeOneTemplate(): WorkoutTemplate {
    return {
      id: 'builtin-531',
      name: '5/3/1 for Beginners',
      programType: '531',
      description: 'Jim Wendler\'s 5/3/1 methodology focused on progressive overload with wave periodization. Four-week cycles with prescribed percentages and AMRAP sets.',
      split: 'upper-lower',
      frequency: 4,
      weekCount: 4,
      weeks: [
        {
          weekNumber: 1,
          weekName: 'Week 1: 5s',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Day 1: Squat',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 3, reps: '5/5/5+', percentage: 65 },
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Day 2: Bench Press',
              exercises: [
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 1,
                  setScheme: { sets: 3, reps: '5/5/5+', percentage: 65 },
                },
              ],
            },
            {
              dayNumber: 3,
              dayName: 'Day 3: Deadlift',
              exercises: [
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 1,
                  setScheme: { sets: 3, reps: '5/5/5+', percentage: 65 },
                },
              ],
            },
            {
              dayNumber: 4,
              dayName: 'Day 4: Overhead Press',
              exercises: [
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 1,
                  setScheme: { sets: 3, reps: '5/5/5+', percentage: 65 },
                },
              ],
            },
          ],
        },
        {
          weekNumber: 2,
          weekName: 'Week 2: 3s',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Day 1: Squat',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 3, reps: '3/3/3+', percentage: 70 },
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Day 2: Bench Press',
              exercises: [
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 1,
                  setScheme: { sets: 3, reps: '3/3/3+', percentage: 70 },
                },
              ],
            },
            {
              dayNumber: 3,
              dayName: 'Day 3: Deadlift',
              exercises: [
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 1,
                  setScheme: { sets: 3, reps: '3/3/3+', percentage: 70 },
                },
              ],
            },
            {
              dayNumber: 4,
              dayName: 'Day 4: Overhead Press',
              exercises: [
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 1,
                  setScheme: { sets: 3, reps: '3/3/3+', percentage: 70 },
                },
              ],
            },
          ],
        },
        {
          weekNumber: 3,
          weekName: 'Week 3: 5/3/1',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Day 1: Squat',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 3, reps: '5/3/1+', percentage: 75 },
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Day 2: Bench Press',
              exercises: [
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 1,
                  setScheme: { sets: 3, reps: '5/3/1+', percentage: 75 },
                },
              ],
            },
            {
              dayNumber: 3,
              dayName: 'Day 3: Deadlift',
              exercises: [
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 1,
                  setScheme: { sets: 3, reps: '5/3/1+', percentage: 75 },
                },
              ],
            },
            {
              dayNumber: 4,
              dayName: 'Day 4: Overhead Press',
              exercises: [
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 1,
                  setScheme: { sets: 3, reps: '5/3/1+', percentage: 75 },
                },
              ],
            },
          ],
        },
        {
          weekNumber: 4,
          weekName: 'Week 4: Deload',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Day 1: Squat (Deload)',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 3, reps: 5, percentage: 40 },
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Day 2: Bench Press (Deload)',
              exercises: [
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 1,
                  setScheme: { sets: 3, reps: 5, percentage: 40 },
                },
              ],
            },
            {
              dayNumber: 3,
              dayName: 'Day 3: Deadlift (Deload)',
              exercises: [
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 1,
                  setScheme: { sets: 3, reps: 5, percentage: 40 },
                },
              ],
            },
            {
              dayNumber: 4,
              dayName: 'Day 4: Overhead Press (Deload)',
              exercises: [
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 1,
                  setScheme: { sets: 3, reps: 5, percentage: 40 },
                },
              ],
            },
          ],
        },
      ],
      requiresOneRepMax: true,
      isBuiltIn: true,
      createdDate: new Date(),
      createdBy: 'system',
      tags: ['beginner', 'intermediate', 'powerlifting', 'strength'],
      notes: 'Classic 5/3/1 program. Recommended for lifters with at least 1 year of training experience.',
    };
  }

  /**
   * Create StrongLifts 5x5 template
   */
  private createStrongLifts5x5Template(): WorkoutTemplate {
    return {
      id: 'builtin-stronglifts5x5',
      name: 'StrongLifts 5x5',
      programType: 'stronglifts5x5',
      description: 'Simple and effective full-body routine. Two alternating workouts, three times per week. Linear progression with 5 sets of 5 reps on all exercises except deadlifts (1x5).',
      split: 'full-body',
      frequency: 3,
      weekCount: 1,
      weeks: [
        {
          weekNumber: 1,
          weekName: 'Weekly Rotation',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Workout A',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 5, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 2,
                  setScheme: { sets: 5, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'barbell-row',
                  exerciseName: 'Barbell Row',
                  order: 3,
                  setScheme: { sets: 5, reps: 5, restSeconds: 180 },
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Workout B',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 5, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 2,
                  setScheme: { sets: 5, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 3,
                  setScheme: { sets: 1, reps: 5, restSeconds: 300 },
                },
              ],
            },
            {
              dayNumber: 3,
              dayName: 'Workout A',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 5, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 2,
                  setScheme: { sets: 5, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'barbell-row',
                  exerciseName: 'Barbell Row',
                  order: 3,
                  setScheme: { sets: 5, reps: 5, restSeconds: 180 },
                },
              ],
            },
          ],
          notes: 'Alternate workouts A and B. Add 5 lbs to upper body lifts and 10 lbs to lower body lifts each successful workout.',
        },
      ],
      requiresOneRepMax: false,
      isBuiltIn: true,
      createdDate: new Date(),
      createdBy: 'system',
      tags: ['beginner', 'strength', 'full-body', 'linear-progression'],
      notes: 'Perfect for beginners. Start with bar weight and add weight each session. Deload by 10% when you fail three times in a row.',
    };
  }

  /**
   * Create Starting Strength template
   */
  private createStartingStrengthTemplate(): WorkoutTemplate {
    return {
      id: 'builtin-starting-strength',
      name: 'Starting Strength',
      programType: 'starting-strength',
      description: 'Mark Rippetoe\'s classic program for novice lifters. Focus on compound movements with linear progression. Three workouts per week with alternating patterns.',
      split: 'full-body',
      frequency: 3,
      weekCount: 1,
      weeks: [
        {
          weekNumber: 1,
          weekName: 'Weekly Rotation',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Workout A',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 3, reps: 5, restSeconds: 180 },
                  notes: 'Warm up with bar, then 2 sets at lighter weights',
                },
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 2,
                  setScheme: { sets: 3, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 3,
                  setScheme: { sets: 1, reps: 5, restSeconds: 300 },
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Workout B',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 3, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 2,
                  setScheme: { sets: 3, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 3,
                  setScheme: { sets: 1, reps: 5, restSeconds: 300 },
                },
              ],
            },
            {
              dayNumber: 3,
              dayName: 'Workout A',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 3, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 2,
                  setScheme: { sets: 3, reps: 5, restSeconds: 180 },
                },
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 3,
                  setScheme: { sets: 1, reps: 5, restSeconds: 300 },
                },
              ],
            },
          ],
          notes: 'Alternate A and B workouts. Add 5-10 lbs per session to squat/deadlift, 2.5-5 lbs to press/bench.',
        },
      ],
      requiresOneRepMax: false,
      isBuiltIn: true,
      createdDate: new Date(),
      createdBy: 'system',
      tags: ['beginner', 'strength', 'full-body', 'linear-progression'],
      notes: 'Designed for absolute beginners. Focus on form and progressive overload. Switch to intermediate program when linear gains stall.',
    };
  }

  /**
   * Create Juggernaut Method template (simplified version)
   */
  private createJuggernautTemplate(): WorkoutTemplate {
    return {
      id: 'builtin-juggernaut',
      name: 'Juggernaut Method 2.0 (Simplified)',
      programType: 'juggernaut',
      description: 'Simplified version of Chad Wesley Smith\'s block periodization program showing the 10s accumulation wave. The full program consists of four 4-week phases (10s, 8s, 5s, 3s waves), each with accumulation, intensification, and realization weeks. This template shows the foundational pattern - users should manually progress through phases.',
      split: 'upper-lower',
      frequency: 4,
      weekCount: 1,
      weeks: [
        {
          weekNumber: 1,
          weekName: '10s Wave - Accumulation Week',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Lower Body',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 5, reps: 10, percentage: 60 },
                },
              ],
              notes: 'After main lift: Add 3-5 sets of assistance work (leg press, lunges, etc.)',
            },
            {
              dayNumber: 2,
              dayName: 'Upper Body',
              exercises: [
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 1,
                  setScheme: { sets: 5, reps: 10, percentage: 60 },
                },
              ],
              notes: 'After main lift: Add 3-5 sets of assistance work (rows, dips, etc.)',
            },
            {
              dayNumber: 3,
              dayName: 'Lower Body',
              exercises: [
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 1,
                  setScheme: { sets: 5, reps: 10, percentage: 60 },
                },
              ],
              notes: 'After main lift: Add 3-5 sets of assistance work (RDLs, back extensions, etc.)',
            },
            {
              dayNumber: 4,
              dayName: 'Upper Body',
              exercises: [
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 1,
                  setScheme: { sets: 5, reps: 10, percentage: 60 },
                },
              ],
              notes: 'After main lift: Add 3-5 sets of assistance work (lat raises, face pulls, etc.)',
            },
          ],
          notes: 'This is Week 1 (Accumulation) of the 10s phase. Full program progression: 10s phase (Weeks 1-4), 8s phase (Weeks 5-8), 5s phase (Weeks 9-12), 3s phase (Weeks 13-16). Each phase has accumulation, intensification, and realization weeks with increasing intensity.',
        },
      ],
      requiresOneRepMax: true,
      isBuiltIn: true,
      createdDate: new Date(),
      createdBy: 'system',
      tags: ['intermediate', 'advanced', 'powerlifting', 'block-periodization'],
      notes: 'This is a simplified template showing the foundational 10s accumulation week pattern. The full Juggernaut Method 2.0 is a 16-week program with four mesocycles (10s, 8s, 5s, 3s). Users should manually progress through the phases by adjusting reps and percentages each month. Best for experienced lifters who understand periodization.',
    };
  }

  /**
   * Create Texas Method template
   */
  private createTexasMethodTemplate(): WorkoutTemplate {
    return {
      id: 'builtin-texas-method',
      name: 'Texas Method',
      programType: 'texas-method',
      description: 'Weekly periodization program for intermediate lifters. Volume day on Monday, light recovery day Wednesday, intensity day Friday. Linear weekly progression.',
      split: 'full-body',
      frequency: 3,
      weekCount: 1,
      weeks: [
        {
          weekNumber: 1,
          weekName: 'Weekly Cycle',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Volume Day (Monday)',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 5, reps: 5, percentage: 90 },
                  notes: '5x5 at 90% of 5RM',
                },
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 2,
                  setScheme: { sets: 5, reps: 5, percentage: 90 },
                },
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 3,
                  setScheme: { sets: 1, reps: 5, percentage: 90 },
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Recovery Day (Wednesday)',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 2, reps: 5, percentage: 70 },
                  notes: 'Light squats for recovery',
                },
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 2,
                  setScheme: { sets: 3, reps: 5, percentage: 90 },
                },
                {
                  exerciseId: 'chin-ups',
                  exerciseName: 'Chin-Ups',
                  order: 3,
                  setScheme: { sets: 3, reps: '8-12' },
                },
              ],
            },
            {
              dayNumber: 3,
              dayName: 'Intensity Day (Friday)',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 1, reps: 5, percentage: 100 },
                  notes: 'New 5RM PR attempt',
                },
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 2,
                  setScheme: { sets: 1, reps: 5, percentage: 100 },
                },
                {
                  exerciseId: 'power-clean',
                  exerciseName: 'Power Clean',
                  order: 3,
                  setScheme: { sets: 5, reps: 3, percentage: 85 },
                },
              ],
            },
          ],
          notes: 'Volume day fatigues, recovery day allows healing, intensity day pushes new PRs.',
        },
      ],
      requiresOneRepMax: true,
      isBuiltIn: true,
      createdDate: new Date(),
      createdBy: 'system',
      tags: ['intermediate', 'strength', 'weekly-periodization'],
      notes: 'For lifters who have exhausted linear progression. Requires good recovery and nutrition.',
    };
  }

  /**
   * Create Madcow 5x5 template
   */
  private createMadcow5x5Template(): WorkoutTemplate {
    return {
      id: 'builtin-madcow5x5',
      name: 'Madcow 5x5',
      programType: 'madcow5x5',
      description: 'Bill Starr\'s 5x5 with ramping sets. Weekly progression with volume on Monday, light Wednesday, and PR attempts Friday. Intermediate program.',
      split: 'full-body',
      frequency: 3,
      weekCount: 1,
      weeks: [
        {
          weekNumber: 1,
          weekName: 'Weekly Cycle',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Monday (Volume)',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 5, reps: '12/10/8/5/5', percentage: 70 },
                  notes: 'Ramping sets: 70%, 75%, 80%, 90%, 90%',
                },
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 2,
                  setScheme: { sets: 5, reps: '12/10/8/5/5', percentage: 70 },
                },
                {
                  exerciseId: 'barbell-row',
                  exerciseName: 'Barbell Row',
                  order: 3,
                  setScheme: { sets: 5, reps: '12/10/8/5/5', percentage: 70 },
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Wednesday (Light)',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 4, reps: 5, percentage: 70 },
                  notes: 'All sets at 70%',
                },
                {
                  exerciseId: 'overhead-press',
                  exerciseName: 'Overhead Press',
                  order: 2,
                  setScheme: { sets: 4, reps: 5, percentage: 70 },
                },
                {
                  exerciseId: 'deadlift',
                  exerciseName: 'Deadlift',
                  order: 3,
                  setScheme: { sets: 4, reps: 5, percentage: 70 },
                },
              ],
            },
            {
              dayNumber: 3,
              dayName: 'Friday (Intensity)',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Back Squat',
                  order: 1,
                  setScheme: { sets: 4, reps: '12/10/8/5', percentage: 75 },
                  notes: 'Ramping to new 5RM: 75%, 80%, 90%, 100%+',
                },
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  order: 2,
                  setScheme: { sets: 4, reps: '12/10/8/5', percentage: 75 },
                },
                {
                  exerciseId: 'barbell-row',
                  exerciseName: 'Barbell Row',
                  order: 3,
                  setScheme: { sets: 4, reps: '12/10/8/5', percentage: 75 },
                },
              ],
            },
          ],
          notes: 'Increase weights by 2.5% each week. Deload after 4-6 weeks.',
        },
      ],
      requiresOneRepMax: true,
      isBuiltIn: true,
      createdDate: new Date(),
      createdBy: 'system',
      tags: ['intermediate', 'strength', 'weekly-periodization', 'ramping-sets'],
      notes: 'Excellent for intermediate lifters. Natural progression from linear programs.',
    };
  }

  /**
   * Create Westside Barbell template (simplified single-week pattern)
   */
  private createWestsideBarbellTemplate(): WorkoutTemplate {
    return {
      id: 'builtin-westside-barbell',
      name: 'Westside Barbell (Conjugate)',
      programType: 'westside-barbell',
      description: 'Louie Simmons\' conjugate method with four training days per week. This template shows the weekly structure with sample max effort exercises. Users should rotate max effort exercises every 1-3 weeks to avoid accommodation and continue making progress.',
      split: 'upper-lower',
      frequency: 4,
      weekCount: 1,
      weeks: [
        {
          weekNumber: 1,
          weekName: 'Weekly Rotation',
          workouts: [
            {
              dayNumber: 1,
              dayName: 'Max Effort Lower',
              exercises: [
                {
                  exerciseId: 'box-squat',
                  exerciseName: 'Box Squat (Wide Stance)',
                  order: 1,
                  setScheme: { sets: 1, reps: 1, percentage: 100 },
                  notes: 'Work up to 1RM for the day. Rotate exercises: Box Squat, Good Mornings, Deficit Deadlifts, Safety Squat Bar Squats, etc.',
                },
              ],
              notes: 'After max effort: 3-4 supplemental exercises for posterior chain and abs (3-4 sets each)',
            },
            {
              dayNumber: 2,
              dayName: 'Max Effort Upper',
              exercises: [
                {
                  exerciseId: 'floor-press',
                  exerciseName: 'Floor Press',
                  order: 1,
                  setScheme: { sets: 1, reps: 1, percentage: 100 },
                  notes: 'Work up to 1RM for the day. Rotate exercises: Floor Press, Board Press, Incline Press, Close-Grip Bench, etc.',
                },
              ],
              notes: 'After max effort: 3-4 supplemental exercises for triceps, lats, and shoulders (3-4 sets each)',
            },
            {
              dayNumber: 3,
              dayName: 'Dynamic Effort Lower',
              exercises: [
                {
                  exerciseId: 'back-squat',
                  exerciseName: 'Speed Squats',
                  order: 1,
                  setScheme: { sets: 10, reps: 2, percentage: 50 },
                  notes: 'Explosive reps with 60 seconds rest. Use bands or chains for accommodating resistance if available.',
                },
              ],
              notes: 'After speed work: 3-4 supplemental exercises for hamstrings, glutes, and core (3-4 sets each)',
            },
            {
              dayNumber: 4,
              dayName: 'Dynamic Effort Upper',
              exercises: [
                {
                  exerciseId: 'bench-press',
                  exerciseName: 'Speed Bench',
                  order: 1,
                  setScheme: { sets: 9, reps: 3, percentage: 50 },
                  notes: 'Explosive reps with 60 seconds rest. Vary grip width every 3 weeks. Use bands or chains if available.',
                },
              ],
              notes: 'After speed work: 3-4 supplemental exercises for upper back, rear delts, and arms (3-4 sets each)',
            },
          ],
          notes: 'The conjugate method uses concurrent training of max effort (heavy singles), dynamic effort (speed work), and repetition method (accessory work). Rotate max effort exercises every 1-3 weeks to prevent accommodation. This is a repeating weekly pattern.',
        },
      ],
      requiresOneRepMax: true,
      isBuiltIn: true,
      createdDate: new Date(),
      createdBy: 'system',
      tags: ['advanced', 'powerlifting', 'conjugate', 'max-effort', 'dynamic-effort'],
      notes: 'Advanced program requiring extensive experience with the main lifts. The key to success is frequent rotation of max effort exercises (every 1-3 weeks) and proper selection of supplemental work targeting individual weaknesses. Not recommended for beginners.',
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const workoutTemplateStorage = new WorkoutTemplateStorage();
