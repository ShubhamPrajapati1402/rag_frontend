import { ModelsCatalogResponse, UserAPIKey, TestConnectionResponse } from '../types';

export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const modelsApi = {
  // 1. Fetch entire model catalog with user configured provider status
  getCatalog: async (): Promise<ModelsCatalogResponse | null> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/models', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Failed to load models catalog:', err);
      return null;
    }
  },

  // 2. Fetch authenticated user active API keys
  getKeys: async (): Promise<UserAPIKey[]> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/models/keys', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('Failed to load user API keys:', err);
      return [];
    }
  },

  // 3. Save or update an encrypted API key for a provider
  saveKey: async (provider: string, apiKey: string, baseUrl?: string): Promise<UserAPIKey> => {
    const res = await fetch(BACKEND_BASE_URL + '/api/v1/models/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        provider,
        api_key: apiKey,
        base_url: baseUrl || null
      })
    });

    if (!res.ok) {
      let errMsg = 'Failed to save API key';
      try {
        const data = await res.json();
        errMsg = data.detail || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    return await res.json();
  },

  // 4. Revoke and delete a provider API key
  deleteKey: async (provider: string): Promise<boolean> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/models/keys/' + provider, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to delete API key for ' + provider + ':', err);
      return false;
    }
  },

  // 5. Test connection and measure roundtrip latency
  testConnection: async (
    provider: string,
    apiKey?: string,
    baseUrl?: string,
    modelName?: string
  ): Promise<TestConnectionResponse> => {
    const res = await fetch(BACKEND_BASE_URL + '/api/v1/models/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        provider,
        api_key: apiKey || null,
        base_url: baseUrl || null,
        model_name: modelName || null
      })
    });

    if (!res.ok) {
      let errMsg = 'Connection test request failed';
      try {
        const data = await res.json();
        errMsg = data.detail || errMsg;
      } catch {}
      return {
        success: false,
        message: errMsg,
        latency_ms: 0
      };
    }

    return await res.json();
  }
};
