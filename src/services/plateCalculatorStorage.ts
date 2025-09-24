import type { PlateSet, PlateCalculation, PlateUsage, LocationInfo } from '../types/plateCalculator';
import { DEFAULT_OLYMPIC_PLATES, COMMON_BAR_WEIGHTS } from '../types/plateCalculator';

const STORAGE_KEY = 'ibpd_plate_sets';
const CURRENT_LOCATION_KEY = 'ibpd_current_location';
const LOCATION_RADIUS_KM = 1; // Consider locations within 1km as the same

class PlateCalculatorStorage {
  private isInitialized = false;
  private plateSets: PlateSet[] = [];
  private currentLocation: LocationInfo | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing plate sets
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        this.plateSets = parsed.map((ps: any) => ({
          ...ps,
          createdAt: new Date(ps.createdAt),
          lastUsed: ps.lastUsed ? new Date(ps.lastUsed) : undefined
        }));
      } else {
        // Create default Olympic plate set
        await this.createDefaultPlateSet();
      }

      // Load current location
      const locationData = localStorage.getItem(CURRENT_LOCATION_KEY);
      if (locationData) {
        this.currentLocation = JSON.parse(locationData);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize plate calculator storage:', error);
      this.isInitialized = true; // Continue with empty state
    }
  }

  private async createDefaultPlateSet(): Promise<void> {
    const defaultSet: PlateSet = {
      id: 'default-olympic',
      name: 'Default Olympic Plates',
      plates: DEFAULT_OLYMPIC_PLATES,
      barWeight: COMMON_BAR_WEIGHTS.olympic,
      isDefault: true,
      createdAt: new Date()
    };

    this.plateSets = [defaultSet];
    await this.savePlateSets();
  }

  async getAllPlateSets(): Promise<PlateSet[]> {
    await this.initialize();
    return [...this.plateSets];
  }

  async getPlateSetById(id: string): Promise<PlateSet | null> {
    await this.initialize();
    return this.plateSets.find(ps => ps.id === id) || null;
  }

  async getCurrentLocationPlateSet(): Promise<PlateSet | null> {
    await this.initialize();
    
    if (!this.currentLocation) return null;

    // Find plate set closest to current location
    const nearbySet = this.plateSets.find(ps => 
      ps.latitude && ps.longitude &&
      this.calculateDistance(
        this.currentLocation!.latitude, 
        this.currentLocation!.longitude,
        ps.latitude, 
        ps.longitude
      ) <= LOCATION_RADIUS_KM
    );

    return nearbySet || null;
  }

  async getDefaultPlateSet(): Promise<PlateSet | null> {
    await this.initialize();
    return this.plateSets.find(ps => ps.isDefault) || this.plateSets[0] || null;
  }

  async createPlateSet(plateSet: Omit<PlateSet, 'id' | 'createdAt'>): Promise<PlateSet> {
    await this.initialize();

    const newPlateSet: PlateSet = {
      ...plateSet,
      id: `plate_set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.plateSets.push(newPlateSet);
    await this.savePlateSets();
    return newPlateSet;
  }

  async updatePlateSet(id: string, updates: Partial<PlateSet>): Promise<PlateSet | null> {
    await this.initialize();

    const index = this.plateSets.findIndex(ps => ps.id === id);
    if (index === -1) return null;

    this.plateSets[index] = { ...this.plateSets[index], ...updates };
    await this.savePlateSets();
    return this.plateSets[index];
  }

  async deletePlateSet(id: string): Promise<boolean> {
    await this.initialize();

    const index = this.plateSets.findIndex(ps => ps.id === id);
    if (index === -1) return false;

    // Don't delete the last plate set
    if (this.plateSets.length === 1) return false;

    // If deleting default, make another one default
    const isDefault = this.plateSets[index].isDefault;
    this.plateSets.splice(index, 1);

    if (isDefault && this.plateSets.length > 0) {
      this.plateSets[0].isDefault = true;
    }

    await this.savePlateSets();
    return true;
  }

  async setCurrentLocation(location: LocationInfo): Promise<void> {
    this.currentLocation = location;
    localStorage.setItem(CURRENT_LOCATION_KEY, JSON.stringify(location));
  }

  async getCurrentLocation(): Promise<LocationInfo | null> {
    return this.currentLocation;
  }

  async requestLocationPermission(): Promise<LocationInfo | null> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: LocationInfo = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          // Try to get location name using reverse geocoding
          try {
            const name = await this.reverseGeocode(location.latitude, location.longitude);
            location.name = name;
          } catch (error) {
            console.warn('Failed to get location name:', error);
          }

          await this.setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          let message = 'Unknown location error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timeout';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  calculatePlates(targetWeight: number, plateSet: PlateSet): PlateCalculation {
    const availablePlates = plateSet.plates
      .filter(p => p.isActive && p.quantity > 0)
      .sort((a, b) => b.weight - a.weight); // Sort heaviest first

    const weightToLoad = Math.max(0, targetWeight - plateSet.barWeight);
    const weightPerSide = weightToLoad / 2;

    const platesPerSide: PlateUsage[] = [];
    let remainingWeight = weightPerSide;

    for (const plate of availablePlates) {
      const maxUsable = Math.floor(plate.quantity / 2); // Divide by 2 since we need pairs
      const needed = Math.floor(remainingWeight / plate.weight);
      const toUse = Math.min(needed, maxUsable);

      if (toUse > 0) {
        platesPerSide.push({
          plate,
          quantity: toUse
        });
        remainingWeight -= toUse * plate.weight;
      }
    }

    const totalCalculatedWeight = plateSet.barWeight + (2 * platesPerSide.reduce(
      (sum, usage) => sum + (usage.plate.weight * usage.quantity), 0
    ));

    return {
      targetWeight,
      barWeight: plateSet.barWeight,
      totalWeight: totalCalculatedWeight,
      platesPerSide,
      remainingWeight,
      isExact: Math.abs(remainingWeight) < 0.01
    };
  }

  private async reverseGeocode(lat: number, lon: number): Promise<string> {
    // Using a simple approach - in production you might want to use a proper geocoding service
    // For now, we'll just return coordinates as a string
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private async savePlateSets(): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.plateSets));
    } catch (error) {
      console.error('Failed to save plate sets:', error);
      throw new Error('Failed to save plate sets');
    }
  }

  async markPlateSetUsed(id: string): Promise<void> {
    const plateSet = await this.getPlateSetById(id);
    if (plateSet) {
      await this.updatePlateSet(id, { lastUsed: new Date() });
    }
  }
}

export const plateCalculatorStorage = new PlateCalculatorStorage();