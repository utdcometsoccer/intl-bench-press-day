// Workout Results Recording System

export interface WorkoutSetResult {
  plannedReps: number;
  plannedWeight: number;
  actualReps: number;
  actualWeight: number;
  percentage: number;
  isAmrap: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export interface WorkoutResult {
  id: string;
  cycleId: string;
  cycleName: string;
  workoutId: string; // Reference to the planned workout
  exerciseId: string;
  exerciseName: string;
  week: number;
  day: number;
  datePerformed: Date;
  warmupResults: WorkoutSetResult[];
  mainSetResults: WorkoutSetResult[];
  assistanceWork?: AssistanceExerciseResult[];
  overallRpe?: number; // Overall workout RPE
  workoutNotes?: string;
  duration?: number; // Workout duration in minutes
  bodyWeight?: number; // Optional body weight tracking
}

export interface AssistanceExerciseResult {
  exerciseName: string;
  sets: {
    reps: number;
    weight?: number;
    rpe?: number;
    notes?: string;
  }[];
}

export interface WorkoutSession {
  id: string;
  cycleId: string;
  week: number;
  day: number;
  dateStarted: Date;
  dateCompleted?: Date;
  isCompleted: boolean;
  workoutResults: WorkoutResult[];
}

class WorkoutResultsStorage {
  private dbName = 'WorkoutResultsDB';
  private dbVersion = 1;
  private storeName = 'workoutResults';
  private sessionsStoreName = 'workoutSessions';
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
        
        // Workout results store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('cycleId', 'cycleId', { unique: false });
          store.createIndex('exerciseId', 'exerciseId', { unique: false });
          store.createIndex('datePerformed', 'datePerformed', { unique: false });
          store.createIndex('week', 'week', { unique: false });
          store.createIndex('day', 'day', { unique: false });
        }

        // Workout sessions store
        if (!db.objectStoreNames.contains(this.sessionsStoreName)) {
          const sessionsStore = db.createObjectStore(this.sessionsStoreName, { keyPath: 'id' });
          sessionsStore.createIndex('cycleId', 'cycleId', { unique: false });
          sessionsStore.createIndex('dateStarted', 'dateStarted', { unique: false });
          sessionsStore.createIndex('isCompleted', 'isCompleted', { unique: false });
        }
      };
    });
  }

  // Save workout result
  async saveWorkoutResult(result: WorkoutResult): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(result);
      
      request.onsuccess = () => resolve(result.id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get workout results for a specific cycle
  async getWorkoutResultsByCycle(cycleId: string): Promise<WorkoutResult[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('cycleId');
      
      const request = index.getAll(cycleId);
      
      request.onsuccess = () => {
        const results = request.result as WorkoutResult[];
        // Sort by week, then day
        results.sort((a, b) => {
          if (a.week !== b.week) return a.week - b.week;
          return a.day - b.day;
        });
        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get workout results for a specific exercise
  async getWorkoutResultsByExercise(exerciseId: string): Promise<WorkoutResult[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('exerciseId');
      
      const request = index.getAll(exerciseId);
      
      request.onsuccess = () => {
        const results = request.result as WorkoutResult[];
        // Sort by date performed descending (newest first)
        results.sort((a, b) => new Date(b.datePerformed).getTime() - new Date(a.datePerformed).getTime());
        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get all workout results
  async getAllWorkoutResults(): Promise<WorkoutResult[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result as WorkoutResult[];
        // Sort by date performed descending (newest first)
        results.sort((a, b) => new Date(b.datePerformed).getTime() - new Date(a.datePerformed).getTime());
        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Save workout session
  async saveWorkoutSession(session: WorkoutSession): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.sessionsStoreName], 'readwrite');
      const store = transaction.objectStore(this.sessionsStoreName);
      
      const request = store.put(session);
      
      request.onsuccess = () => resolve(session.id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get workout sessions for a cycle
  async getWorkoutSessionsByCycle(cycleId: string): Promise<WorkoutSession[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.sessionsStoreName], 'readonly');
      const store = transaction.objectStore(this.sessionsStoreName);
      const index = store.index('cycleId');
      
      const request = index.getAll(cycleId);
      
      request.onsuccess = () => {
        const sessions = request.result as WorkoutSession[];
        sessions.sort((a, b) => new Date(b.dateStarted).getTime() - new Date(a.dateStarted).getTime());
        resolve(sessions);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get active (incomplete) workout session
  async getActiveWorkoutSession(): Promise<WorkoutSession | null> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.sessionsStoreName], 'readonly');
      const store = transaction.objectStore(this.sessionsStoreName);
      const index = store.index('isCompleted');
      
      const request = index.getAll(IDBKeyRange.only(false));
      
      request.onsuccess = () => {
        const activeSessions = request.result as WorkoutSession[];
        if (activeSessions.length > 0) {
          // Return the most recent active session
          const mostRecent = activeSessions.reduce((latest, current) => 
            new Date(current.dateStarted).getTime() > new Date(latest.dateStarted).getTime() ? current : latest
          );
          resolve(mostRecent);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Delete workout result
  async deleteWorkoutResult(id: string): Promise<void> {
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

  // Get workout statistics for an exercise
  async getExerciseWorkoutStats(exerciseId: string): Promise<{
    totalWorkouts: number;
    averageAmrapReps: number;
    bestAmrapPerformance: { week: number; reps: number; weight: number; date: Date } | null;
    progressionTrend: Array<{ date: Date; topSetReps: number; topSetWeight: number }>;
  }> {
    const results = await this.getWorkoutResultsByExercise(exerciseId);
    
    if (results.length === 0) {
      return {
        totalWorkouts: 0,
        averageAmrapReps: 0,
        bestAmrapPerformance: null,
        progressionTrend: []
      };
    }

    // Calculate AMRAP statistics
    const amrapSets = results.flatMap(r => 
      r.mainSetResults.filter(set => set.isAmrap)
    );

    const averageAmrapReps = amrapSets.length > 0 
      ? amrapSets.reduce((sum, set) => sum + set.actualReps, 0) / amrapSets.length 
      : 0;

    // Find best AMRAP performance
    let bestAmrapPerformance = null;
    if (amrapSets.length > 0) {
      const bestAmrap = amrapSets.reduce((best, current) => {
        // Compare by reps first, then weight if reps are equal
        if (current.actualReps > best.actualReps || 
            (current.actualReps === best.actualReps && current.actualWeight > best.actualWeight)) {
          return current;
        }
        return best;
      });

      const bestResult = results.find(r => r.mainSetResults.includes(bestAmrap))!;
      bestAmrapPerformance = {
        week: bestResult.week,
        reps: bestAmrap.actualReps,
        weight: bestAmrap.actualWeight,
        date: bestResult.datePerformed
      };
    }

    // Create progression trend (top set of each workout)
    const progressionTrend = results.map(result => {
      const topSet = result.mainSetResults[result.mainSetResults.length - 1]; // Last main set is typically the heaviest
      return {
        date: result.datePerformed,
        topSetReps: topSet.actualReps,
        topSetWeight: topSet.actualWeight
      };
    }).reverse(); // Chronological order

    return {
      totalWorkouts: results.length,
      averageAmrapReps: Math.round(averageAmrapReps * 10) / 10,
      bestAmrapPerformance,
      progressionTrend
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

// Utility functions
export const calculateEstimated1RM = (weight: number, reps: number): number => {
  // Using Epley formula: Weight × (1 + 0.0333 × reps)
  return Math.round(weight * (1 + 0.0333 * reps) * 100) / 100;
};

export const calculateRPEDescription = (rpe: number): string => {
  const descriptions = {
    10: "Maximal exertion",
    9: "Could not do more reps or weight",
    8: "Could do 1 more rep",
    7: "Could do 2-3 more reps",
    6: "Could do 4-6 more reps",
    5: "Could do 7-9 more reps",
    4: "Light to moderate",
    3: "Easy",
    2: "Very easy",
    1: "No exertion"
  };
  return descriptions[rpe as keyof typeof descriptions] || "Unknown";
};

// Create a singleton instance
export const workoutResultsStorage = new WorkoutResultsStorage();
