/**
 * Transform options for FFBB image assets.
 */
export interface AssetTransforms {
  /** Target width in pixels. */
  width?: number;
  /** Target height in pixels. */
  height?: number;
  /** Fit mode. */
  fit?: 'cover' | 'contain' | 'inside' | 'outside';
  /** Image quality (1-100). */
  quality?: number;
  /** Output format. */
  format?: 'webp' | 'jpg' | 'png' | 'avif';
}

/**
 * Helper for building asset URLs and downloading files from the FFBB Directus API.
 *
 * @example
 * ```ts
 * const assets = new AssetHelper('https://api.ffbb.com', fetch);
 *
 * // Get a URL for a logo
 * const logoUrl = assets.url('uuid-here', { width: 300, format: 'webp' });
 *
 * // Download the logo
 * const buffer = await assets.download('uuid-here', { width: 300, format: 'webp' });
 * ```
 */
export class AssetHelper {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch,
  ) {}

  /**
   * Build a full URL for an asset with optional image transforms.
   *
   * @param uuid - The asset UUID
   * @param transforms - Optional image transformation parameters
   * @returns The full asset URL
   */
  url(uuid: string, transforms?: AssetTransforms): string {
    const params = new URLSearchParams();

    if (transforms) {
      if (transforms.fit) params.set('fit', transforms.fit);
      if (transforms.quality !== undefined) params.set('quality', String(transforms.quality));
      if (transforms.width !== undefined) params.set('width', String(transforms.width));
      if (transforms.height !== undefined) params.set('height', String(transforms.height));
      if (transforms.format) params.set('format', transforms.format);
    }

    const qs = params.toString();
    return `${this.baseUrl}/assets/${uuid}${qs ? `?${qs}` : ''}`;
  }

  /**
   * Download an asset as an ArrayBuffer.
   *
   * @param uuid - The asset UUID
   * @param transforms - Optional image transformation parameters
   * @returns The raw file data as an ArrayBuffer
   */
  async download(uuid: string, transforms?: AssetTransforms): Promise<ArrayBuffer> {
    const assetUrl = this.url(uuid, transforms);
    const response = await this.fetchFn(assetUrl);

    if (!response.ok) {
      throw new Error(`Failed to download asset ${uuid}: HTTP ${response.status}`);
    }

    return response.arrayBuffer();
  }
}
