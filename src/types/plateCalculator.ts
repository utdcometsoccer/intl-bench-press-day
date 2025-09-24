// ============================================================================
// PLATE CALCULATOR TYPES
// ============================================================================

export interface Plate {
  id: string;
  weight: number;
  quantity: number;
  color?: string;
  material?: 'iron' | 'rubber' | 'bumper' | 'competition';
  isActive: boolean;
}

export interface PlateSet {
  id: string;
  name: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  plates: Plate[];
  barWeight: number;
  isDefault: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface PlateCalculation {
  targetWeight: number;
  barWeight: number;
  totalWeight: number;
  platesPerSide: PlateUsage[];
  remainingWeight: number;
  isExact: boolean;
}

export interface PlateUsage {
  plate: Plate;
  quantity: number;
}

export interface LocationInfo {
  name?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Default plate configurations
export const DEFAULT_OLYMPIC_PLATES: Plate[] = [
  { id: 'plate-45', weight: 45, quantity: 8, color: 'red', material: 'iron', isActive: true },
  { id: 'plate-35', weight: 35, quantity: 2, color: 'blue', material: 'iron', isActive: true },
  { id: 'plate-25', weight: 25, quantity: 4, color: 'green', material: 'iron', isActive: true },
  { id: 'plate-10', weight: 10, quantity: 4, color: 'white', material: 'iron', isActive: true },
  { id: 'plate-5', weight: 5, quantity: 4, color: 'black', material: 'iron', isActive: true },
  { id: 'plate-2.5', weight: 2.5, quantity: 4, color: 'silver', material: 'iron', isActive: true },
];

export const DEFAULT_METRIC_PLATES: Plate[] = [
  { id: 'plate-20kg', weight: 20, quantity: 8, color: 'red', material: 'iron', isActive: true },
  { id: 'plate-15kg', weight: 15, quantity: 2, color: 'blue', material: 'iron', isActive: true },
  { id: 'plate-10kg', weight: 10, quantity: 4, color: 'green', material: 'iron', isActive: true },
  { id: 'plate-5kg', weight: 5, quantity: 4, color: 'white', material: 'iron', isActive: true },
  { id: 'plate-2.5kg', weight: 2.5, quantity: 4, color: 'black', material: 'iron', isActive: true },
  { id: 'plate-1.25kg', weight: 1.25, quantity: 4, color: 'silver', material: 'iron', isActive: true },
];

export const COMMON_BAR_WEIGHTS = {
  olympic: 45, // 20kg
  womens: 35, // 15kg
  training: 25, // 11kg
  safety: 15, // 7kg
  metric: 20,
  metric_womens: 15,
};