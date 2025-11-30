import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleFitClient, createGoogleFitClient } from '../services/googleFitClient';

// Mock fetch
globalThis.fetch = vi.fn();

describe('GoogleFitClient', () => {
  let client: GoogleFitClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GoogleFitClient();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      const newClient = new GoogleFitClient();
      expect(newClient).toBeDefined();
      expect(newClient.sessions).toBeDefined();
    });

    it('should create client with custom config', () => {
      const newClient = new GoogleFitClient({
        clientId: 'test-client-id',
        scopes: ['custom-scope'],
      });
      expect(newClient).toBeDefined();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return true when authenticated with valid token', () => {
      client.setAuthResult({
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
      });
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should return false when token has expired', () => {
      client.setAuthResult({
        accessToken: 'test-token',
        expiresAt: Date.now() - 1000, // Already expired
      });
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return null when not authenticated', () => {
      expect(client.getAccessToken()).toBeNull();
    });

    it('should return token when authenticated', () => {
      client.setAuthResult({
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000,
      });
      expect(client.getAccessToken()).toBe('test-token');
    });

    it('should return null when token has expired', () => {
      client.setAuthResult({
        accessToken: 'test-token',
        expiresAt: Date.now() - 1000,
      });
      expect(client.getAccessToken()).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('should clear authentication', () => {
      client.setAuthResult({
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000,
      });
      expect(client.isAuthenticated()).toBe(true);
      
      client.clearAuth();
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('authenticate', () => {
    it('should throw error when client ID is not configured', async () => {
      await expect(client.authenticate()).rejects.toThrow('Google Fit client ID is not configured');
    });

    it('should throw error when OAuth is not implemented', async () => {
      const configuredClient = new GoogleFitClient({ clientId: 'test-client-id' });
      await expect(configuredClient.authenticate()).rejects.toThrow('OAuth authentication not implemented');
    });
  });

  describe('sessions.create', () => {
    it('should throw error when not authenticated', async () => {
      const session = {
        name: 'Test Session',
        startTimeMillis: Date.now(),
        endTimeMillis: Date.now() + 3600000,
        activityType: 97,
      };

      await expect(client.sessions.create(session)).rejects.toThrow('Not authenticated');
    });

    it('should create session when authenticated', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      client.setAuthResult({
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000,
      });

      const session = {
        name: 'Bench Press - Week 1',
        description: 'Great workout',
        startTimeMillis: Date.now(),
        endTimeMillis: Date.now() + 3600000,
        activityType: 97,
      };

      await expect(client.sessions.create(session)).resolves.not.toThrow();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.googleapis.com/fitness/v1/users/me/sessions/'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error when API returns error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized'),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      client.setAuthResult({
        accessToken: 'invalid-token',
        expiresAt: Date.now() + 3600000,
      });

      const session = {
        name: 'Test Session',
        startTimeMillis: Date.now(),
        endTimeMillis: Date.now() + 3600000,
        activityType: 97,
      };

      await expect(client.sessions.create(session)).rejects.toThrow('Failed to create Google Fit session');
    });
  });

  describe('createGoogleFitClient factory', () => {
    it('should create a new client instance', () => {
      const newClient = createGoogleFitClient();
      expect(newClient).toBeInstanceOf(GoogleFitClient);
    });

    it('should create client with config', () => {
      const newClient = createGoogleFitClient({ clientId: 'my-client-id' });
      expect(newClient).toBeDefined();
    });
  });
});
