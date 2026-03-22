/**
 * Base error class for all FFBB API client errors.
 */
export class FFBBError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FFBBError';
  }
}

/**
 * Thrown when authentication fails (missing token, invalid token, 401/403 response).
 */
export class FFBBAuthError extends FFBBError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FFBBAuthError';
  }
}

/**
 * Thrown when an HTTP request returns a non-2xx status code.
 */
export class FFBBRequestError extends FFBBError {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly body?: unknown;

  constructor(
    message: string,
    options: { status: number; statusText: string; url: string; body?: unknown; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = 'FFBBRequestError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.url = options.url;
    this.body = options.body;
  }
}

/**
 * Thrown when a request exceeds the configured timeout.
 */
export class FFBBTimeoutError extends FFBBError {
  readonly timeoutMs: number;
  readonly url: string;

  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = 'FFBBTimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}
