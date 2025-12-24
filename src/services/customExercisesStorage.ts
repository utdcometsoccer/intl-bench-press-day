import type { Exercise } from '../types';

// Re-export the Exercise type for backward compatibility
export { type Exercise } from '../types';

class CustomExercisesStorage {
  private dbName = 'CustomExercisesDB';
  private dbVersion = 1;
  private storeName = 'customExercises';
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
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  // Save a new custom exercise
  async saveExercise(exercise: Exercise): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    // Validate exercise data
    if (!exercise.id || !exercise.name || !exercise.category) {
      throw new Error('Exercise must have id, name, and category');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(exercise);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all custom exercises
  async getAllExercises(): Promise<Exercise[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get exercises by category
  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('category');
      
      const request = index.getAll(category);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get a specific exercise by ID
  async getExerciseById(id: string): Promise<Exercise | undefined> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete a custom exercise
  async deleteExercise(id: string): Promise<void> {
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

  // Update an existing custom exercise
  async updateExercise(exercise: Exercise): Promise<void> {
    // Same as saveExercise since we use put() which handles both insert and update
    return this.saveExercise(exercise);
  }

  // Check if an exercise ID already exists
  async exerciseExists(id: string): Promise<boolean> {
    const exercise = await this.getExerciseById(id);
    return exercise !== undefined;
  }

  // Get all unique categories (including custom exercises)
  async getAllCategories(): Promise<string[]> {
    const exercises = await this.getAllExercises();
    const categories = exercises.map(ex => ex.category);
    return [...new Set(categories)];
  }

  // Close the database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export a singleton instance
export const customExercisesStorage = new CustomExercisesStorage();
