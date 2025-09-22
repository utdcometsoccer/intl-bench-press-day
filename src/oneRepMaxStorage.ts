import type { OneRepetitionMaximum, WorkoutSet } from './types';

// Interface for storing function metadata in IndexedDB
interface StoredOneRepMaxFunction {
  id: string;
  name: string;
  description?: string;
  functionBody: string; // Serialized function body
  createdAt: Date;
  updatedAt: Date;
}

class OneRepMaxStorageSystem {
  private dbName = 'OneRepMaxDB';
  private dbVersion = 1;
  private storeName = 'oneRepMaxFunctions';
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
          store.createIndex('name', 'name', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // Store a function in IndexedDB
  async storeFunction(
    name: string,
    functionImpl: OneRepetitionMaximum,
    description?: string
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const functionBody = functionImpl.toString();
    const id = `${name}_${Date.now()}`;
    const now = new Date();

    const storedFunction: StoredOneRepMaxFunction = {
      id,
      name,
      description,
      functionBody,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.add(storedFunction);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // Retrieve a function by ID
  async getFunctionById(id: string): Promise<OneRepetitionMaximum | null> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result as StoredOneRepMaxFunction;
        if (result) {
          try {
            const func = this.deserializeFunction(result.functionBody);
            resolve(func);
          } catch (error) {
            reject(new Error(`Failed to deserialize function: ${error}`));
          }
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Retrieve a function by name (gets the most recent one if multiple exist)
  async getFunctionByName(name: string): Promise<OneRepetitionMaximum | null> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('name');
      
      const request = index.getAll(name);
      
      request.onsuccess = () => {
        const results = request.result as StoredOneRepMaxFunction[];
        if (results.length > 0) {
          // Get the most recent one
          const mostRecent = results.reduce((latest, current) => 
            current.updatedAt > latest.updatedAt ? current : latest
          );
          
          try {
            const func = this.deserializeFunction(mostRecent.functionBody);
            resolve(func);
          } catch (error) {
            reject(new Error(`Failed to deserialize function: ${error}`));
          }
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // List all stored functions with metadata
  async listFunctions(): Promise<Array<Omit<StoredOneRepMaxFunction, 'functionBody'>>> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result as StoredOneRepMaxFunction[];
        const metadata = results.map((result) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { functionBody, ...meta } = result;
          return meta;
        });
        resolve(metadata);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Update an existing function
  async updateFunction(
    id: string,
    functionImpl: OneRepetitionMaximum,
    description?: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result as StoredOneRepMaxFunction;
        if (!existing) {
          reject(new Error(`Function with id ${id} not found`));
          return;
        }

        const updated: StoredOneRepMaxFunction = {
          ...existing,
          functionBody: functionImpl.toString(),
          description: description ?? existing.description,
          updatedAt: new Date()
        };

        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Delete a function by ID
  async deleteFunction(id: string): Promise<void> {
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

  // Private method to deserialize function from string
  private deserializeFunction(functionBody: string): OneRepetitionMaximum {
    try {
      // Remove function wrapper if present and extract the function logic
      const funcMatch = functionBody.match(/function.*?\{([\s\S]*)\}$/) || 
                       functionBody.match(/\(.*?\)\s*=>\s*\{([\s\S]*)\}$/) ||
                       functionBody.match(/\(.*?\)\s*=>\s*(.+)$/);
      
      if (funcMatch) {
        const body = funcMatch[1] || funcMatch[0];
        // Create a new function that matches the OneRepetitionMaximum interface
        return new Function('workoutSet', body) as OneRepetitionMaximum;
      } else {
        // Fallback: try to evaluate the entire string as a function
        // eslint-disable-next-line no-eval
        return eval(`(${functionBody})`) as OneRepetitionMaximum;
      }
    } catch (error) {
      throw new Error(`Cannot deserialize function: ${error}`);
    }
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
export const oneRepMaxStorage = new OneRepMaxStorageSystem();

// Predefined one-rep max calculation functions
export const predefinedFormulas = {
  // Epley formula: Weight × (1 + 0.0333 × reps)
  epley: ((workoutSet: WorkoutSet): number => {
    return workoutSet.Weight * (1 + 0.0333 * workoutSet.Repetions);
  }) as OneRepetitionMaximum,

  // Brzycki formula: Weight × (36 / (37 - reps))
  brzycki: ((workoutSet: WorkoutSet): number => {
    if (workoutSet.Repetions >= 37) {
      throw new Error('Brzycki formula not valid for 37+ repetitions');
    }
    return workoutSet.Weight * (36 / (37 - workoutSet.Repetions));
  }) as OneRepetitionMaximum,

  // Lander formula: Weight × (100 / (101.3 - 2.67123 × reps))
  lander: ((workoutSet: WorkoutSet): number => {
    return workoutSet.Weight * (100 / (101.3 - 2.67123 * workoutSet.Repetions));
  }) as OneRepetitionMaximum,

  // Lombardi formula: Weight × reps^0.1
  lombardi: ((workoutSet: WorkoutSet): number => {
    return workoutSet.Weight * Math.pow(workoutSet.Repetions, 0.1);
  }) as OneRepetitionMaximum,
};

// Helper function to initialize the storage system with predefined formulas
export async function initializeWithPredefinedFormulas(): Promise<void> {
  await oneRepMaxStorage.initialize();
  
  // Store predefined formulas
  for (const [name, formula] of Object.entries(predefinedFormulas)) {
    try {
      await oneRepMaxStorage.storeFunction(
        name,
        formula,
        `Predefined ${name} one-rep max calculation formula`
      );
    } catch (error) {
      // Function might already exist, which is fine
      console.warn(`Could not store predefined formula ${name}:`, error);
    }
  }
}
