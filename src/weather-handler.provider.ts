import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
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
export class WeatherHandlerProvider implements HandlerProvider {
  constructor(
    @Inject(GEOCODE_SERVICE) private readonly geocodeService: GeocodeService,
    @Inject(WEATHER_SERVICE) private readonly weatherService: WeatherService,
  ) {}

  readonly current: APIGatewayProxyHandlerV2 = async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyResultV2> => {
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
        statusCode: HttpStatus.OK,
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

  readonly historical: APIGatewayProxyHandlerV2 = async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyResultV2> => {
    // Validate path before bootstrapping to save time
    const city = extractCityFromPath(event);
    if (!city) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: 'Historical weather requires a "city" to be provided',
      };
    }
    try {
      const location = await this.geocodeService.geocode(city);
      const weather = await this.weatherService.historical(location);
      return {
        statusCode: HttpStatus.OK,
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
          : `Unable to fetch historical weather: ${e}`;
      return {
        statusCode,
        body,
      };
    }
  };
}
