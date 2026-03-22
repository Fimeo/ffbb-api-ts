import { describe, it, expect, vi } from 'vitest';
import { FFBBClient } from '../src/client.js';
import { FFBBAuthError } from '../src/errors.js';
import {
  createMockFetch,
  MOCK_CONFIGURATION,
  MOCK_ORGANISME,
  MOCK_POULE,
} from './helpers.js';

describe('FFBBClient', () => {
  describe('authenticate()', () => {
    it('fetches and stores tokens', async () => {
      const mockFetch = createMockFetch({
        '/items/configuration': MOCK_CONFIGURATION,
      });

      const client = new FFBBClient({ fetch: mockFetch });
      await client.authenticate();

      // After auth, should be able to make requests
      // We'll verify by checking the mock was called correctly
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('/items/configuration');
    });

    it('throws FFBBAuthError when authentication fails', async () => {
      const mockFetch = vi.fn((() =>
        Promise.resolve(new Response('Server Error', { status: 500, statusText: 'Internal Server Error' }))
      ) as typeof fetch);

      const client = new FFBBClient({ fetch: mockFetch });
      await expect(client.authenticate()).rejects.toThrow(FFBBAuthError);
    });
  });

  describe('getOrganisme()', () => {
    it('fetches an organism by ID', async () => {
      const mockFetch = createMockFetch({
        '/items/ffbbserver_organismes/11402': MOCK_ORGANISME,
      });

      const client = new FFBBClient({ fetch: mockFetch, token: 'test-token' });
      const result = await client.getOrganisme('11402');

      expect(result.id).toBe('11402');
      expect(result.nom).toBe('LE CLUB DE BRETTEVILLE-SUR-ODON BASKET');
      expect(result.engagements).toHaveLength(1);
    });

    it('passes query parameters through', async () => {
      const mockFetch = createMockFetch({
        '/items/ffbbserver_organismes/11402': MOCK_ORGANISME,
      });

      const client = new FFBBClient({ fetch: mockFetch, token: 'test-token' });
      await client.getOrganisme('11402', {
        fields: ['id', 'nom', 'engagements.id'],
        deep: { engagements: { _limit: 100 } },
      });

      const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('fields[]=id');
      expect(callUrl).toContain('fields[]=nom');
      expect(callUrl).toContain('deep[engagements][_limit]=100');
    });
  });

  describe('getPoule()', () => {
    it('fetches a poule with matches and standings', async () => {
      const mockFetch = createMockFetch({
        '/items/ffbbserver_poules/poule-1': MOCK_POULE,
      });

      const client = new FFBBClient({ fetch: mockFetch, token: 'test-token' });
      const result = await client.getPoule('poule-1');

      expect(result.id).toBe('poule-1');
      expect(result.rencontres).toHaveLength(2);
      expect(result.classements).toHaveLength(2);
      expect(result.rencontres[0].nomEquipe1).toBe('LCBO - 1');
    });
  });

  describe('list()', () => {
    it('lists items from a collection', async () => {
      const mockData = { data: [{ id: '1', nom: 'Team A' }, { id: '2', nom: 'Team B' }] };
      const mockFetch = createMockFetch({
        '/items/ffbbserver_engagements': mockData,
      });

      const client = new FFBBClient({ fetch: mockFetch, token: 'test-token' });
      const result = await client.list('ffbbserver_engagements', { limit: 10 });

      expect(result).toHaveLength(2);
    });
  });

  describe('assetUrl()', () => {
    it('builds asset URL without transforms', () => {
      const client = new FFBBClient({ token: 'test-token' });
      const url = client.assetUrl('abc-123');
      expect(url).toBe('https://api.ffbb.com/assets/abc-123');
    });

    it('builds asset URL with transforms', () => {
      const client = new FFBBClient({ token: 'test-token' });
      const url = client.assetUrl('abc-123', {
        width: 300,
        height: 300,
        fit: 'inside',
        quality: 80,
        format: 'webp',
      });
      expect(url).toContain('/assets/abc-123?');
      expect(url).toContain('width=300');
      expect(url).toContain('height=300');
      expect(url).toContain('fit=inside');
      expect(url).toContain('quality=80');
      expect(url).toContain('format=webp');
    });

    it('respects custom baseUrl', () => {
      const client = new FFBBClient({ baseUrl: 'https://custom.api.com', token: 'test' });
      const url = client.assetUrl('xyz');
      expect(url).toBe('https://custom.api.com/assets/xyz');
    });
  });

  describe('getApiVersion()', () => {
    it('returns latest version from array', async () => {
      const mockFetch = createMockFetch({
        '/json/app_versions.json': [
          { version: '1.0', title: 'v1' },
          { version: '2.0', title: 'v2' },
        ],
      });

      const client = new FFBBClient({ fetch: mockFetch, token: 'test-token' });
      const version = await client.getApiVersion();

      expect(version).toEqual({ version: '2.0', title: 'v2' });
    });

    it('returns null on error', async () => {
      const mockFetch = vi.fn((() =>
        Promise.resolve(new Response('Error', { status: 500 }))
      ) as typeof fetch);

      const client = new FFBBClient({ fetch: mockFetch, token: 'test-token' });
      const version = await client.getApiVersion();

      expect(version).toBeNull();
    });
  });

  describe('getLives()', () => {
    it('returns live matches', async () => {
      const mockFetch = createMockFetch({
        '/json/lives.json': [{ id: 'live-1' }],
      });

      const client = new FFBBClient({ fetch: mockFetch, token: 'test-token' });
      const lives = await client.getLives();

      expect(lives).toEqual([{ id: 'live-1' }]);
    });

    it('returns empty array on error', async () => {
      const mockFetch = vi.fn((() =>
        Promise.reject(new Error('Network error'))
      ) as typeof fetch);

      const client = new FFBBClient({ fetch: mockFetch, token: 'test-token' });
      const lives = await client.getLives();

      expect(lives).toEqual([]);
    });
  });

  describe('constructor options', () => {
    it('uses default URLs when not specified', () => {
      const client = new FFBBClient({ token: 'test' });
      const url = client.assetUrl('id');
      expect(url).toContain('api.ffbb.com');
    });

    it('accepts custom baseUrl', () => {
      const client = new FFBBClient({ baseUrl: 'https://custom.example.com', token: 'test' });
      const url = client.assetUrl('id');
      expect(url).toContain('custom.example.com');
    });
  });
});
