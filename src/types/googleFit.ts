// ============================================================================
// GOOGLE FIT TYPES
// ============================================================================

export interface GoogleFitSession {
  name: string;
  description?: string;
  startTimeMillis: number;
  endTimeMillis: number;
  activityType: number;
}

export interface GoogleFitSessionsAPI {
  create(session: GoogleFitSession): Promise<void>;
}

export interface GoogleFitClientConfig {
  clientId: string;
  scopes: string[];
}

export interface GoogleFitAuthResult {
  accessToken: string;
  expiresAt: number;
}

export interface GoogleFitSyncResult {
  success: boolean;
  syncedWorkouts: number;
  failedWorkouts: number;
  errors: string[];
}

// Google Fit activity types
export const GOOGLE_FIT_ACTIVITY_TYPES = {
  WEIGHT_TRAINING: 97,
  STRENGTH_TRAINING: 80,
  CIRCUIT_TRAINING: 15,
} as const;

export type GoogleFitActivityType = typeof GOOGLE_FIT_ACTIVITY_TYPES[keyof typeof GOOGLE_FIT_ACTIVITY_TYPES];
