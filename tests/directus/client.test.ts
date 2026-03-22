import { describe, it, expect, vi } from 'vitest';
import { DirectusClient } from '../../src/directus/index.js';
import { TokenManager } from '../../src/auth.js';
import { FFBBRequestError, FFBBAuthError, FFBBTimeoutError, FFBBError } from '../../src/errors.js';
import { createMockFetch, createErrorFetch, createNetworkErrorFetch, MOCK_POULE } from '../helpers.js';

function createClient(mockFetch: typeof fetch, timeout?: number) {
  const tm = new TokenManager({ directusToken: 'test-token' });
  return new DirectusClient('https://api.ffbb.com', tm, mockFetch, timeout);
}

describe('DirectusClient', () => {
  describe('get()', () => {
    it('fetches a single item and unwraps data envelope', async () => {
      const mockFetch = createMockFetch({
        '/items/ffbbserver_poules/123': MOCK_POULE,
      });

      const client = createClient(mockFetch);
      const result = await client.get('ffbbserver_poules', '123');

      expect(result).toEqual(MOCK_POULE.data);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toBe('https://api.ffbb.com/items/ffbbserver_poules/123');
    });

    it('appends query string when query is provided', async () => {
      const mockFetch = createMockFetch({
        '/items/ffbbserver_poules/123': MOCK_POULE,
      });

      const client = createClient(mockFetch);
      await client.get('ffbbserver_poules', '123', {
        fields: ['id', 'nom'],
      });

      const callUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('fields[]=id');
      expect(callUrl).toContain('fields[]=nom');
    });

    it('sends Authorization header', async () => {
      const mockFetch = createMockFetch({
        '/items/ffbbserver_poules/123': MOCK_POULE,
      });

      const client = createClient(mockFetch);
      await client.get('ffbbserver_poules', '123');

      const callOptions = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callOptions.headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('list()', () => {
    it('fetches a list and unwraps data envelope', async () => {
      const mockResponse = { data: [{ id: '1' }, { id: '2' }] };
      const mockFetch = createMockFetch({
        '/items/ffbbserver_rencontres': mockResponse,
      });

      const client = createClient(mockFetch);
      const result = await client.list('ffbbserver_rencontres', { limit: 10 });

      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });
  });

  describe('listAll()', () => {
    it('auto-paginates through all items', async () => {
      let callCount = 0;
      const mockFetch = vi.fn((() => {
        callCount++;
        const items = callCount === 1
          ? [{ id: '1' }, { id: '2' }, { id: '3' }]
          : [{ id: '4' }]; // Less than pageSize = done

        return Promise.resolve(
          new Response(JSON.stringify({ data: items }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }) as typeof fetch);

      const client = createClient(mockFetch);
      const items: unknown[] = [];

      for await (const item of client.listAll('ffbbserver_rencontres', {}, 3)) {
        items.push(item);
      }

      expect(items).toHaveLength(4);
      expect(callCount).toBe(2);
    });

    it('stops after first page if fewer items than pageSize', async () => {
      const mockFetch = createMockFetch({
        '/items/ffbbserver_rencontres': { data: [{ id: '1' }] },
      });

      const client = createClient(mockFetch);
      const items: unknown[] = [];

      for await (const item of client.listAll('ffbbserver_rencontres', {}, 10)) {
        items.push(item);
      }

      expect(items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('throws FFBBAuthError on 401', async () => {
      const mockFetch = createErrorFetch(401, 'Unauthorized');
      const client = createClient(mockFetch);

      await expect(client.get('ffbbserver_poules', '123')).rejects.toThrow(FFBBAuthError);
    });

    it('throws FFBBAuthError on 403', async () => {
      const mockFetch = createErrorFetch(403, 'Forbidden');
      const client = createClient(mockFetch);

      await expect(client.get('ffbbserver_poules', '123')).rejects.toThrow(FFBBAuthError);
    });

    it('throws FFBBRequestError on 404 with status info', async () => {
      const mockFetch = createErrorFetch(404, 'Not Found');
      const client = createClient(mockFetch);

      try {
        await client.get('ffbbserver_poules', 'nonexistent');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FFBBRequestError);
        const err = e as FFBBRequestError;
        expect(err.status).toBe(404);
        expect(err.statusText).toBe('Not Found');
        expect(err.url).toContain('ffbbserver_poules/nonexistent');
      }
    });

    it('throws FFBBRequestError on 500', async () => {
      const mockFetch = createErrorFetch(500, 'Internal Server Error', {
        errors: [{ message: 'Something went wrong' }],
      });
      const client = createClient(mockFetch);

      try {
        await client.list('ffbbserver_poules');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(FFBBRequestError);
        const err = e as FFBBRequestError;
        expect(err.status).toBe(500);
        expect(err.body).toEqual({ errors: [{ message: 'Something went wrong' }] });
      }
    });

    it('throws FFBBError on network error', async () => {
      const mockFetch = createNetworkErrorFetch('ECONNREFUSED');
      const client = createClient(mockFetch);

      await expect(client.get('ffbbserver_poules', '123')).rejects.toThrow(FFBBError);
    });

    it('throws FFBBTimeoutError when request times out', async () => {
      const slowFetch: typeof fetch = (_url, options) => {
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      };
      const mockFetch = vi.fn(slowFetch);

      const client = createClient(mockFetch, 50); // 50ms timeout

      await expect(client.get('ffbbserver_poules', '123')).rejects.toThrow(FFBBTimeoutError);
    });
  });
});
