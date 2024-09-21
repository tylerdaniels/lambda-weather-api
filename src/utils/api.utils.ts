import { APIGatewayProxyEventV2 } from 'aws-lambda';

export function extractCityFromPath(
  event: APIGatewayProxyEventV2,
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
