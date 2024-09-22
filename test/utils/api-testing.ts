import { HttpStatus } from '@nestjs/common';

export function mockFetchJson(
  response: any,
  status: number = HttpStatus.OK,
): [typeof fetch, () => string | undefined, () => URLSearchParams | undefined] {
  let lastUrl: string | undefined;
  let lastParams: URLSearchParams | undefined;
  const mockFetch: typeof fetch = async (fullUrl) => {
    const url =
      fullUrl instanceof URL
        ? fullUrl
        : typeof fullUrl === 'string'
          ? new URL(fullUrl)
          : new URL(fullUrl.url);
    lastParams = new URLSearchParams(url.searchParams);
    url.search = '';
    lastUrl = url.toString();
    return {
      status,
      json: () => Promise.resolve(response),
    } as Response;
  };
  return [mockFetch, () => lastUrl, () => lastParams];
}

export function mockFetchText(
  response: string,
  status: number = HttpStatus.OK,
): [typeof fetch, () => string | undefined, () => URLSearchParams | undefined] {
  let lastUrl: string | undefined;
  let lastParams: URLSearchParams | undefined;
  const mockFetch: typeof fetch = async (fullUrl) => {
    const url =
      fullUrl instanceof URL
        ? fullUrl
        : typeof fullUrl === 'string'
          ? new URL(fullUrl)
          : new URL(fullUrl.url);
    lastParams = new URLSearchParams(url.searchParams);
    url.search = '';
    lastUrl = url.toString();
    return {
      status,
      text: () => Promise.resolve(response),
    } as Response;
  };
  return [mockFetch, () => lastUrl, () => lastParams];
}
