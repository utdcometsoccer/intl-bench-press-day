import type { WorkoutSet } from './types';
import type { Exercise } from './exercises';

// Interface for storing exercise one-rep max records
export interface ExerciseRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  workoutSet: WorkoutSet; // The actual set performed
  oneRepMax: number; // Calculated 1RM
  formulaUsed: string; // Name of the formula used
  formulaId: string; // ID of the formula used
  dateRecorded: Date;
  notes?: string;
}

class ExerciseRecordsStorage {
  private dbName = 'ExerciseRecordsDB';
  private dbVersion = 1;
  private storeName = 'exerciseRecords';
  private db: IDBDatabase | null = null;

  // Initialize the IndexedDB database
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
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('exerciseId', 'exerciseId', { unique: false });
          store.createIndex('dateRecorded', 'dateRecorded', { unique: false });
          store.createIndex('oneRepMax', 'oneRepMax', { unique: false });
        }
      };
    });
  }

  // Save a new exercise record
  async saveRecord(
    exercise: Exercise,
    workoutSet: WorkoutSet,
    oneRepMax: number,
    formulaUsed: string,
    formulaId: string,
    notes?: string
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const id = `${exercise.id}_${Date.now()}`;
    const record: ExerciseRecord = {
      id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      workoutSet,
      oneRepMax,
      formulaUsed,
      formulaId,
      dateRecorded: new Date(),
      notes
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.add(record);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all records for a specific exercise
  async getRecordsByExercise(exerciseId: string): Promise<ExerciseRecord[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('exerciseId');
      
      const request = index.getAll(exerciseId);
      
      request.onsuccess = () => {
        const records = request.result as ExerciseRecord[];
        // Sort by date descending (newest first)
        records.sort((a, b) => new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime());
        resolve(records);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get the best (highest) one-rep max for a specific exercise
  async getBestRecordForExercise(exerciseId: string): Promise<ExerciseRecord | null> {
    const records = await this.getRecordsByExercise(exerciseId);
    if (records.length === 0) return null;
    
    return records.reduce((best, current) => 
      current.oneRepMax > best.oneRepMax ? current : best
    );
  }

  // Get all records sorted by date
  async getAllRecords(): Promise<ExerciseRecord[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const records = request.result as ExerciseRecord[];
        // Sort by date descending (newest first)
        records.sort((a, b) => new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime());
        resolve(records);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get recent records (last N records)
  async getRecentRecords(limit: number = 10): Promise<ExerciseRecord[]> {
    const allRecords = await this.getAllRecords();
    return allRecords.slice(0, limit);
  }

  // Delete a specific record
  async deleteRecord(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get personal records (best 1RM for each exercise)
  async getPersonalRecords(): Promise<Map<string, ExerciseRecord>> {
    const allRecords = await this.getAllRecords();
    const personalRecords = new Map<string, ExerciseRecord>();

    allRecords.forEach(record => {
      const existing = personalRecords.get(record.exerciseId);
      if (!existing || record.oneRepMax > existing.oneRepMax) {
        personalRecords.set(record.exerciseId, record);
      }
    });

    return personalRecords;
  }

  // Get statistics for an exercise
  async getExerciseStats(exerciseId: string): Promise<{
    totalRecords: number;
    bestOneRepMax: number;
    averageOneRepMax: number;
    latestRecord: ExerciseRecord | null;
  }> {
    const records = await this.getRecordsByExercise(exerciseId);
    
    if (records.length === 0) {
      return {
        totalRecords: 0,
        bestOneRepMax: 0,
        averageOneRepMax: 0,
        latestRecord: null
      };
    }

    const oneRepMaxValues = records.map(r => r.oneRepMax);
    const bestOneRepMax = Math.max(...oneRepMaxValues);
    const averageOneRepMax = oneRepMaxValues.reduce((sum, val) => sum + val, 0) / oneRepMaxValues.length;

    return {
      totalRecords: records.length,
      bestOneRepMax,
      averageOneRepMax: Math.round(averageOneRepMax * 100) / 100,
      latestRecord: records[0] // Already sorted by date descending
    };
  }

  // Close the database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create a singleton instance
export const exerciseRecordsStorage = new ExerciseRecordsStorage();
