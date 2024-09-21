import { APIGatewayProxyEvent } from 'aws-lambda';

export function extractCityFromPath(
  event: APIGatewayProxyEvent,
): string | undefined {
  if (!event.pathParameters || !('city' in event.pathParameters)) {
    return undefined;
  }
  const city = event.pathParameters.city;
  if (!city || city.trim().length === 0) {
    return undefined;
  }
  return city;
}
