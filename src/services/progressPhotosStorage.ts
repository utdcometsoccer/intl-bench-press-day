// Progress Photos Storage Service
// Stores and manages progress photos with metadata

export interface ProgressPhoto {
  id: string;
  imageData: string; // base64 encoded image or Blob URL
  dateTaken: Date;
  notes?: string;
  bodyWeight?: number; // Optional body weight at time of photo
  measurements?: {
    // Optional body measurements
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DB_NAME = 'ProgressPhotosDB';
const DB_VERSION = 1;
const STORE_NAME = 'progressPhotos';

class ProgressPhotosStorage {
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open progress photos database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });

          // Create indices for efficient querying
          objectStore.createIndex('dateTaken', 'dateTaken', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // Save a progress photo
  async savePhoto(photo: Omit<ProgressPhoto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgressPhoto> {
    const db = await this.initDB();

    const newPhoto: ProgressPhoto = {
      ...photo,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newPhoto);

      request.onsuccess = () => {
        resolve(newPhoto);
      };

      request.onerror = () => {
        reject(new Error('Failed to save progress photo'));
      };
    });
  }

  // Get all progress photos
  async getAllPhotos(): Promise<ProgressPhoto[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const photos = request.result as ProgressPhoto[];
        // Convert date strings to Date objects
        const parsedPhotos = photos.map((photo) => ({
          ...photo,
          dateTaken: new Date(photo.dateTaken),
          createdAt: new Date(photo.createdAt),
          updatedAt: new Date(photo.updatedAt),
        }));
        // Sort by date taken (newest first)
        parsedPhotos.sort((a, b) => b.dateTaken.getTime() - a.dateTaken.getTime());
        resolve(parsedPhotos);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve progress photos'));
      };
    });
  }

  // Get a single photo by ID
  async getPhoto(id: string): Promise<ProgressPhoto | null> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const photo = request.result as ProgressPhoto | undefined;
        if (photo) {
          resolve({
            ...photo,
            dateTaken: new Date(photo.dateTaken),
            createdAt: new Date(photo.createdAt),
            updatedAt: new Date(photo.updatedAt),
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve progress photo'));
      };
    });
  }

  // Update a progress photo
  async updatePhoto(id: string, updates: Partial<Omit<ProgressPhoto, 'id' | 'createdAt'>>): Promise<ProgressPhoto> {
    const db = await this.initDB();
    const existingPhoto = await this.getPhoto(id);

    if (!existingPhoto) {
      throw new Error('Progress photo not found');
    }

    const updatedPhoto: ProgressPhoto = {
      ...existingPhoto,
      ...updates,
      id,
      createdAt: existingPhoto.createdAt,
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(updatedPhoto);

      request.onsuccess = () => {
        resolve(updatedPhoto);
      };

      request.onerror = () => {
        reject(new Error('Failed to update progress photo'));
      };
    });
  }

  // Delete a progress photo
  async deletePhoto(id: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete progress photo'));
      };
    });
  }

  // Get photos within a date range
  async getPhotosByDateRange(startDate: Date, endDate: Date): Promise<ProgressPhoto[]> {
    const allPhotos = await this.getAllPhotos();
    return allPhotos.filter((photo) => {
      const photoDate = new Date(photo.dateTaken);
      return photoDate >= startDate && photoDate <= endDate;
    });
  }

  // Clear all photos (use with caution)
  async clearAllPhotos(): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear progress photos'));
      };
    });
  }

  // Get total photo count
  async getPhotoCount(): Promise<number> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to count progress photos'));
      };
    });
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const progressPhotosStorage = new ProgressPhotosStorage();
