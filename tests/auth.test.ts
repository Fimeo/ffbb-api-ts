import { describe, it, expect } from 'vitest';
import { TokenManager } from '../src/auth.js';
import { FFBBAuthError } from '../src/errors.js';
import { createMockFetch, createErrorFetch, createNetworkErrorFetch, MOCK_CONFIGURATION } from './helpers.js';

describe('TokenManager', () => {
  it('starts unauthenticated by default', () => {
    const tm = new TokenManager();
    expect(tm.isAuthenticated).toBe(false);
    expect(tm.hasMeilisearchToken).toBe(false);
  });

  it('accepts manual tokens', () => {
    const tm = new TokenManager({
      directusToken: 'my-token',
      meilisearchToken: 'ms-token',
    });
    expect(tm.isAuthenticated).toBe(true);
    expect(tm.hasMeilisearchToken).toBe(true);
    expect(tm.getDirectusAuthHeader()).toBe('Bearer my-token');
    expect(tm.getMeilisearchAuthHeader()).toBe('Bearer ms-token');
  });

  it('throws when getting auth header without token', () => {
    const tm = new TokenManager();
    expect(() => tm.getDirectusAuthHeader()).toThrow(FFBBAuthError);
    expect(() => tm.getMeilisearchAuthHeader()).toThrow(FFBBAuthError);
  });

  it('fetches tokens from configuration endpoint', async () => {
    const mockFetch = createMockFetch({
      '/items/configuration': MOCK_CONFIGURATION,
    });

    const tm = new TokenManager();
    await tm.fetchTokens('https://api.ffbb.com', mockFetch);

    expect(tm.isAuthenticated).toBe(true);
    expect(tm.directusToken).toBe('test-directus-token-abc123');
    expect(tm.meilisearchToken).toBe('test-meilisearch-token-xyz789');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws on HTTP error from configuration endpoint', async () => {
    const mockFetch = createErrorFetch(500, 'Internal Server Error');

    const tm = new TokenManager();
    await expect(tm.fetchTokens('https://api.ffbb.com', mockFetch)).rejects.toThrow(
      FFBBAuthError,
    );
  });

  it('throws on network error', async () => {
    const mockFetch = createNetworkErrorFetch('DNS resolution failed');

    const tm = new TokenManager();
    await expect(tm.fetchTokens('https://api.ffbb.com', mockFetch)).rejects.toThrow(
      FFBBAuthError,
    );
  });

  it('throws when key_dh is missing from response', async () => {
    const mockFetch = createMockFetch({
      '/items/configuration': { data: { key_ms: 'something' } },
    });

    const tm = new TokenManager();
    await expect(tm.fetchTokens('https://api.ffbb.com', mockFetch)).rejects.toThrow(
      FFBBAuthError,
    );
  });
});
