import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import {
  GEOCODE_SERVICE,
  GeocodeService,
  HandlerProvider,
  WEATHER_SERVICE,
  WeatherService,
} from './types';
import { extractCityFromPath } from './utils';

@Injectable()
export class LambdaHandlerProvider implements HandlerProvider {
  constructor(
    @Inject(GEOCODE_SERVICE) private readonly geocodeService: GeocodeService,
    @Inject(WEATHER_SERVICE) private readonly weatherService: WeatherService,
  ) {}

  readonly current: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> => {
    // Validate path before bootstrapping to save time
    const city = extractCityFromPath(event);
    if (!city) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: 'Current weather requires a "city" to be provided',
      };
    }
    try {
      const location = await this.geocodeService.geocode(city);
      const weather = await this.weatherService.current(location);
      return {
        statusCode: 200,
        body: JSON.stringify(weather),
      };
    } catch (e: unknown) {
      const statusCode =
        e instanceof HttpException
          ? e.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const body =
        e instanceof Error
          ? e.message
          : `Unable to fetch current weather: ${e}`;
      return {
        statusCode,
        body,
      };
    }
  };

  readonly historical: APIGatewayProxyHandler =
    async (): Promise<APIGatewayProxyResult> => {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: 'Historical weather not implemented',
      };
    };
}
