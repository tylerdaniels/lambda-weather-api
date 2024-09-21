import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
  Callback,
  Context,
} from 'aws-lambda';
import { extractCityFromPath } from './api.utils';

export function event(
  pathParameters: APIGatewayProxyEventPathParameters,
  queryStringParameters: APIGatewayProxyEventQueryStringParameters,
): APIGatewayProxyEvent {
  return {
    pathParameters,
    queryStringParameters,
  } as APIGatewayProxyEvent;
}

export function context(): Context {
  return {} as Context;
}

export function disallowedCallback(): Callback<any> {
  return () => {
    throw new Error('Callback invocation is not allowed');
  };
}

describe('extractCityFromPath', () => {
  it('should fail without a "city" parameter', () => {
    const result = extractCityFromPath(event({}, {}));
    expect(result).toBeUndefined();
  });
  it('should fail with an empty "city" parameter', () => {
    const result = extractCityFromPath(event({ city: '' }, {}));
    expect(result).toBeUndefined();
  });
  it('should fail with a whitespace "city" parameter', () => {
    const result = extractCityFromPath(event({ city: '  \t ' }, {}));
    expect(result).toBeUndefined();
  });
  it('should pass-through valid "city" parameter', () => {
    const city = 'Miami, FL';
    const result = extractCityFromPath(event({ city }, {}));
    expect(result).toBe(city);
  });
});
