// 5-3-1 Workout Plan Data Structures and Storage
import type { 
  FiveThreeOneMax, 
  FiveThreeOneSet, 
  FiveThreeOneWorkout, 
  FiveThreeOneCycle 
} from '../types';

// Re-export types for backward compatibility
export { 
  type FiveThreeOneMax, 
  type FiveThreeOneSet, 
  type FiveThreeOneWorkout, 
  type FiveThreeOneCycle 
} from '../types';

// 5-3-1 Program Templates
export const FIVE_THREE_ONE_PERCENTAGES = {
  week1: [
    { reps: 5, percentage: 65 },
    { reps: 5, percentage: 75 },
    { reps: 5, percentage: 85, isAmrap: true }
  ],
  week2: [
    { reps: 3, percentage: 70 },
    { reps: 3, percentage: 80 },
    { reps: 3, percentage: 90, isAmrap: true }
  ],
  week3: [
    { reps: 5, percentage: 75 },
    { reps: 3, percentage: 85 },
    { reps: 1, percentage: 95, isAmrap: true }
  ],
  week4: [ // Deload week
    { reps: 5, percentage: 40 },
    { reps: 5, percentage: 50 },
    { reps: 5, percentage: 60 }
  ]
};

export const WARMUP_PERCENTAGES = [
  { reps: 5, percentage: 40 },
  { reps: 5, percentage: 50 },
  { reps: 3, percentage: 60 }
];

// Main exercises for 5-3-1 (the "big 4")
export const FIVE_THREE_ONE_MAIN_EXERCISES = [
  { id: 'back-squat', name: 'Back Squat', day: 1 },
  { id: 'bench-press', name: 'Bench Press', day: 2 },
  { id: 'deadlift', name: 'Deadlift', day: 3 },
  { id: 'overhead-press', name: 'Overhead Press', day: 4 }
];

// Assistance exercise suggestions
export const ASSISTANCE_EXERCISES = {
  'back-squat': [
    'Romanian Deadlift',
    'Bulgarian Split Squats',
    'Leg Press',
    'Walking Lunges',
    'Leg Curls'
  ],
  'bench-press': [
    'Dumbbell Bench Press',
    'Incline Dumbbell Press',
    'Dips',
    'Push-ups',
    'Close Grip Bench Press'
  ],
  'deadlift': [
    'Romanian Deadlift',
    'Deficit Deadlifts',
    'Rack Pulls',
    'Good Mornings',
    'Hyperextensions'
  ],
  'overhead-press': [
    'Dumbbell Shoulder Press',
    'Lateral Raises',
    'Face Pulls',
    'Arnold Press',
    'Pike Push-ups'
  ]
};

class FiveThreeOneStorage {
  private dbName = 'FiveThreeOneDB';
  private dbVersion = 1;
  private storeName = 'fiveThreeOneCycles';
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
          store.createIndex('startDate', 'startDate', { unique: false });
          store.createIndex('isActive', 'isActive', { unique: false });
          store.createIndex('createdDate', 'createdDate', { unique: false });
        }
      };
    });
  }

  // Save a 5-3-1 cycle
  async saveCycle(cycle: FiveThreeOneCycle): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(cycle);
      
      request.onsuccess = () => resolve(cycle.id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all cycles
  async getAllCycles(): Promise<FiveThreeOneCycle[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const cycles = request.result as FiveThreeOneCycle[];
        // Sort by created date descending (newest first)
        cycles.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        resolve(cycles);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get active cycle
  async getActiveCycle(): Promise<FiveThreeOneCycle | null> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      // Alternative: Get all and filter manually (more explicit)
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allCycles = request.result as FiveThreeOneCycle[];
        const activeCycles = allCycles.filter(cycle => cycle.isActive === true);
        
        // Should only be one active cycle, return the most recent
        if (activeCycles.length > 0) {
          const mostRecent = activeCycles.reduce((latest, current) => 
            new Date(current.startDate).getTime() > new Date(latest.startDate).getTime() ? current : latest
          );
          resolve(mostRecent);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get cycle by ID
  async getCycleById(id: string): Promise<FiveThreeOneCycle | null> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Set a cycle as active (deactivates all others)
  async setActiveCycle(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // First, get all cycles and deactivate them
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        const cycles = getAllRequest.result as FiveThreeOneCycle[];
        let updateCount = 0;
        
        cycles.forEach(cycle => {
          cycle.isActive = cycle.id === id;
          const updateRequest = store.put(cycle);
          updateRequest.onsuccess = () => {
            updateCount++;
            if (updateCount === cycles.length) {
              resolve();
            }
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        });
        
        if (cycles.length === 0) resolve();
      };
      
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  // Delete a cycle
  async deleteCycle(id: string): Promise<void> {
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

  // Close the database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Utility functions for 5-3-1 calculations
export const calculateTrainingMax = (oneRepMax: number): number => {
  return Math.round(oneRepMax * 0.9);
};

export const calculateWeight = (trainingMax: number, percentage: number): number => {
  const weight = (trainingMax * percentage) / 100;
  // Round to nearest 2.5 lbs (or 5 lbs if over 200)
  if (weight > 200) {
    return Math.round(weight / 5) * 5;
  } else {
    return Math.round(weight / 2.5) * 2.5;
  }
};

export const generateWorkouts = (maxes: FiveThreeOneMax[]): FiveThreeOneWorkout[] => {
  const workouts: FiveThreeOneWorkout[] = [];
  
  FIVE_THREE_ONE_MAIN_EXERCISES.forEach(exercise => {
    const exerciseMax = maxes.find(m => m.exerciseId === exercise.id);
    if (!exerciseMax) return;

    for (let week = 1; week <= 4; week++) {
      const weekKey = `week${week}` as keyof typeof FIVE_THREE_ONE_PERCENTAGES;
      const percentages = FIVE_THREE_ONE_PERCENTAGES[weekKey];
      
      // Generate main sets
      const mainSets: FiveThreeOneSet[] = percentages.map(p => ({
        reps: p.reps,
        percentage: p.percentage,
        weight: calculateWeight(exerciseMax.trainingMax, p.percentage),
        isAmrap: 'isAmrap' in p ? p.isAmrap : false
      }));

      // Generate warmup sets
      const warmupSets: FiveThreeOneSet[] = WARMUP_PERCENTAGES.map(p => ({
        reps: p.reps,
        percentage: p.percentage,
        weight: calculateWeight(exerciseMax.trainingMax, p.percentage)
      }));

      workouts.push({
        id: `${exercise.id}_week${week}`,
        week,
        day: exercise.day,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        mainSets,
        warmupSets,
        assistanceExercises: ASSISTANCE_EXERCISES[exercise.id as keyof typeof ASSISTANCE_EXERCISES]
      });
    }
  });

  return workouts;
};

// Create a singleton instance
export const fiveThreeOneStorage = new FiveThreeOneStorage();
