import { EventEmitter } from 'node:events';

import type { ConsoleMessage, Page, Request, Response } from '@playwright/test';

export class FakePage extends EventEmitter {
  public currentUrl = 'https://example.test/dashboard';

  public url(): string {
    return this.currentUrl;
  }

  public asPage(): Page {
    return this as unknown as Page;
  }
}

export function consoleMessage(
  text: string,
  type: ReturnType<ConsoleMessage['type']> = 'error',
  url = 'https://example.test/app.js',
): ConsoleMessage {
  return {
    type: () => type,
    text: () => text,
    location: () => ({ url, lineNumber: 12, columnNumber: 8 }),
  } as unknown as ConsoleMessage;
}

export function request(
  url = 'https://example.test/api/data',
  resourceType = 'fetch',
  failureText: string | null = 'net::ERR_CONNECTION_RESET',
  method = 'GET',
): Request {
  return {
    url: () => url,
    resourceType: () => resourceType,
    failure: () => (failureText === null ? null : { errorText: failureText }),
    method: () => method,
  } as unknown as Request;
}

export function response(
  status = 503,
  url = 'https://example.test/api/data',
  resourceType = 'fetch',
  method = 'GET',
  statusText = 'Service Unavailable',
): Response {
  const sourceRequest = request(url, resourceType, '', method);
  return {
    status: () => status,
    statusText: () => statusText,
    url: () => url,
    request: () => sourceRequest,
  } as unknown as Response;
}
