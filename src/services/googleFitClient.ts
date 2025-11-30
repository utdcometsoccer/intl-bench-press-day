// Google Fit Client - Handles OAuth and API communication with Google Fit
import type {
  GoogleFitSession,
  GoogleFitSessionsAPI,
  GoogleFitClientConfig,
  GoogleFitAuthResult,
} from '../types/googleFit';

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.write',
  'https://www.googleapis.com/auth/fitness.body.write',
];

const GOOGLE_FIT_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

export class GoogleFitClient {
  private config: GoogleFitClientConfig;
  private authResult: GoogleFitAuthResult | null = null;

  public sessions: GoogleFitSessionsAPI;

  constructor(config?: Partial<GoogleFitClientConfig>) {
    this.config = {
      clientId: config?.clientId || '',
      scopes: config?.scopes || DEFAULT_SCOPES,
    };

    this.sessions = {
      create: this.createSession.bind(this),
    };
  }

  /**
   * Check if the client is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.authResult) return false;
    return Date.now() < this.authResult.expiresAt;
  }

  /**
   * Get the current access token if authenticated
   */
  getAccessToken(): string | null {
    if (!this.isAuthenticated()) return null;
    return this.authResult?.accessToken || null;
  }

  /**
   * Set authentication result (typically from OAuth flow)
   */
  setAuthResult(result: GoogleFitAuthResult): void {
    this.authResult = result;
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.authResult = null;
  }

  /**
   * Initiate OAuth authentication flow
   * In a real implementation, this would open a popup or redirect for OAuth
   */
  async authenticate(): Promise<GoogleFitAuthResult> {
    if (!this.config.clientId) {
      throw new Error('Google Fit client ID is not configured');
    }

    // This is a placeholder for the OAuth flow
    // In production, this would use the Google Identity Services library
    // or redirect to Google's OAuth endpoint
    throw new Error(
      'OAuth authentication not implemented. Configure Google Identity Services for production use.'
    );
  }

  /**
   * Create a fitness session in Google Fit
   */
  private async createSession(session: GoogleFitSession): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const sessionId = `intl-bench-press-${session.startTimeMillis}`;
    const url = `${GOOGLE_FIT_API_BASE}/sessions/${sessionId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: sessionId,
        name: session.name,
        description: session.description || '',
        startTimeMillis: session.startTimeMillis,
        endTimeMillis: session.endTimeMillis,
        activityType: session.activityType,
        application: {
          name: 'International Bench Press Day',
          packageName: 'com.intl-bench-press-day',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Google Fit session: ${response.status} ${errorText}`);
    }
  }
}

// Export a factory function for creating client instances
export const createGoogleFitClient = (config?: Partial<GoogleFitClientConfig>): GoogleFitClient => {
  return new GoogleFitClient(config);
};
