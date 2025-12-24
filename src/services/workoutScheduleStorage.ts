// Workout Schedule Storage Service
// Manages scheduled workouts and custom workout plans

import type { WorkoutSchedule, CustomWorkout } from '../types';

const SCHEDULE_DB_NAME = 'WorkoutScheduleDB';
const SCHEDULE_DB_VERSION = 1;
const SCHEDULES_STORE = 'schedules';
const CUSTOM_WORKOUTS_STORE = 'customWorkouts';

class WorkoutScheduleStorage {
  private db: IDBDatabase | null = null;

  // Initialize the database
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(SCHEDULE_DB_NAME, SCHEDULE_DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open workout schedule database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create schedules store
        if (!db.objectStoreNames.contains(SCHEDULES_STORE)) {
          const scheduleStore = db.createObjectStore(SCHEDULES_STORE, { keyPath: 'id' });
          scheduleStore.createIndex('cycleId', 'cycleId', { unique: false });
          scheduleStore.createIndex('scheduledDate', 'scheduledDate', { unique: false });
          scheduleStore.createIndex('isCompleted', 'isCompleted', { unique: false });
        }

        // Create custom workouts store
        if (!db.objectStoreNames.contains(CUSTOM_WORKOUTS_STORE)) {
          const customStore = db.createObjectStore(CUSTOM_WORKOUTS_STORE, { keyPath: 'id' });
          customStore.createIndex('createdBy', 'createdBy', { unique: false });
          customStore.createIndex('exerciseId', 'exerciseId', { unique: false });
        }
      };
    });
  }

  // Get database instance
  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ============================================================================
  // WORKOUT SCHEDULES
  // ============================================================================

  // Add a new workout schedule
  async addSchedule(schedule: WorkoutSchedule): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHEDULES_STORE], 'readwrite');
      const store = transaction.objectStore(SCHEDULES_STORE);
      const request = store.add(schedule);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add workout schedule'));
    });
  }

  // Update an existing workout schedule
  async updateSchedule(schedule: WorkoutSchedule): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHEDULES_STORE], 'readwrite');
      const store = transaction.objectStore(SCHEDULES_STORE);
      const request = store.put(schedule);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to update workout schedule'));
    });
  }

  // Get a schedule by ID
  async getSchedule(id: string): Promise<WorkoutSchedule | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHEDULES_STORE], 'readonly');
      const store = transaction.objectStore(SCHEDULES_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as WorkoutSchedule | undefined;
        if (result) {
          // Convert date strings back to Date objects
          result.scheduledDate = new Date(result.scheduledDate);
          if (result.completedDate) {
            result.completedDate = new Date(result.completedDate);
          }
        }
        resolve(result || null);
      };
      request.onerror = () => reject(new Error('Failed to get workout schedule'));
    });
  }

  // Get all schedules for a cycle
  async getSchedulesForCycle(cycleId: string): Promise<WorkoutSchedule[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHEDULES_STORE], 'readonly');
      const store = transaction.objectStore(SCHEDULES_STORE);
      const index = store.index('cycleId');
      const request = index.getAll(cycleId);

      request.onsuccess = () => {
        const results = request.result as WorkoutSchedule[];
        // Convert date strings back to Date objects
        results.forEach(schedule => {
          schedule.scheduledDate = new Date(schedule.scheduledDate);
          if (schedule.completedDate) {
            schedule.completedDate = new Date(schedule.completedDate);
          }
        });
        resolve(results);
      };
      request.onerror = () => reject(new Error('Failed to get schedules for cycle'));
    });
  }

  // Get all schedules
  async getAllSchedules(): Promise<WorkoutSchedule[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHEDULES_STORE], 'readonly');
      const store = transaction.objectStore(SCHEDULES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as WorkoutSchedule[];
        // Convert date strings back to Date objects
        results.forEach(schedule => {
          schedule.scheduledDate = new Date(schedule.scheduledDate);
          if (schedule.completedDate) {
            schedule.completedDate = new Date(schedule.completedDate);
          }
        });
        resolve(results);
      };
      request.onerror = () => reject(new Error('Failed to get all schedules'));
    });
  }

  // Get upcoming schedules (not completed, sorted by date)
  async getUpcomingSchedules(): Promise<WorkoutSchedule[]> {
    const schedules = await this.getAllSchedules();
    const now = new Date();
    return schedules
      .filter(s => !s.isCompleted && s.scheduledDate >= now)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  // Get schedules for a specific date
  async getSchedulesForDate(date: Date): Promise<WorkoutSchedule[]> {
    const schedules = await this.getAllSchedules();
    const targetDateString = date.toDateString();
    
    return schedules.filter(s => {
      // s.scheduledDate is already a Date (normalized in getAllSchedules)
      return s.scheduledDate.toDateString() === targetDateString;
    });
  }

  // Mark a schedule as completed
  async completeSchedule(id: string): Promise<boolean> {
    const schedule = await this.getSchedule(id);
    if (!schedule) {
      return false;
    }

    if (schedule.isCompleted) {
      return true;
    }

    schedule.isCompleted = true;
    schedule.completedDate = new Date();
    await this.updateSchedule(schedule);
    return true;
  }

  // Delete a schedule
  async deleteSchedule(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHEDULES_STORE], 'readwrite');
      const store = transaction.objectStore(SCHEDULES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete workout schedule'));
    });
  }

  // ============================================================================
  // CUSTOM WORKOUTS
  // ============================================================================

  // Add a custom workout
  async addCustomWorkout(workout: CustomWorkout): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_WORKOUTS_STORE], 'readwrite');
      const store = transaction.objectStore(CUSTOM_WORKOUTS_STORE);
      const request = store.add(workout);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add custom workout'));
    });
  }

  // Update a custom workout
  async updateCustomWorkout(workout: CustomWorkout): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_WORKOUTS_STORE], 'readwrite');
      const store = transaction.objectStore(CUSTOM_WORKOUTS_STORE);
      const request = store.put(workout);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to update custom workout'));
    });
  }

  // Get a custom workout by ID
  async getCustomWorkout(id: string): Promise<CustomWorkout | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_WORKOUTS_STORE], 'readonly');
      const store = transaction.objectStore(CUSTOM_WORKOUTS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as CustomWorkout | undefined;
        if (result) {
          result.createdDate = new Date(result.createdDate);
        }
        resolve(result || null);
      };
      request.onerror = () => reject(new Error('Failed to get custom workout'));
    });
  }

  // Get all custom workouts
  async getAllCustomWorkouts(): Promise<CustomWorkout[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_WORKOUTS_STORE], 'readonly');
      const store = transaction.objectStore(CUSTOM_WORKOUTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CustomWorkout[];
        results.forEach(workout => {
          workout.createdDate = new Date(workout.createdDate);
        });
        resolve(results);
      };
      request.onerror = () => reject(new Error('Failed to get all custom workouts'));
    });
  }

  // Get custom workouts by creator
  async getCustomWorkoutsByCreator(createdBy: 'user' | 'coach' | 'auto'): Promise<CustomWorkout[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_WORKOUTS_STORE], 'readonly');
      const store = transaction.objectStore(CUSTOM_WORKOUTS_STORE);
      const index = store.index('createdBy');
      const request = index.getAll(createdBy);

      request.onsuccess = () => {
        const results = request.result as CustomWorkout[];
        results.forEach(workout => {
          workout.createdDate = new Date(workout.createdDate);
        });
        resolve(results);
      };
      request.onerror = () => reject(new Error('Failed to get custom workouts by creator'));
    });
  }

  // Delete a custom workout
  async deleteCustomWorkout(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CUSTOM_WORKOUTS_STORE], 'readwrite');
      const store = transaction.objectStore(CUSTOM_WORKOUTS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete custom workout'));
    });
  }

  // Close the database
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create and export singleton instance
export const workoutScheduleStorage = new WorkoutScheduleStorage();

// Export class for testing
export { WorkoutScheduleStorage };
