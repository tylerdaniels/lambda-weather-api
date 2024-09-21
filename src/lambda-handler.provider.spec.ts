import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CurrentWeather,
  GEOCODE_SERVICE,
  GeocodeCoordinates,
  GeocodeService,
  WEATHER_SERVICE,
  WeatherService,
} from './types';
import { extractCoordinates } from './utils';
import { context, disallowedCallback, event } from './utils/api.utils.spec';
import { LambdaHandlerProvider } from './lambda-handler.provider';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

@Injectable()
class MockGeocoder implements GeocodeService {
  lastLocation: string | undefined;
  expectedError: Error | undefined;
  expectedCoords: GeocodeCoordinates | undefined;

  geocode(location: string): Promise<GeocodeCoordinates> {
    this.lastLocation = location;
    if (this.expectedCoords) {
      return Promise.resolve(this.expectedCoords);
    }
    return Promise.reject(this.expectedError);
  }
}

@Injectable()
class MockWeatherService implements WeatherService {
  lastCoords: GeocodeCoordinates | undefined;
  expectedError: Error | undefined;
  expectedWeather: CurrentWeather | undefined;

  current(coordinates: GeocodeCoordinates): Promise<CurrentWeather>;
  current(latitude: number, longitude: number): Promise<CurrentWeather>;
  current(
    latitude: GeocodeCoordinates | number,
    longitude?: number,
  ): Promise<CurrentWeather> {
    const coords = extractCoordinates(latitude, longitude);
    this.lastCoords = coords;
    if (this.expectedWeather) {
      return Promise.resolve(this.expectedWeather);
    }
    return Promise.reject(this.expectedError);
  }
}

describe('LambdaHandlerProvider', () => {
  let geocodeService: MockGeocoder;
  let weatherService: MockWeatherService;
  let handlerProvider: LambdaHandlerProvider;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        MockGeocoder,
        { provide: GEOCODE_SERVICE, useExisting: MockGeocoder },
        MockWeatherService,
        { provide: WEATHER_SERVICE, useExisting: MockWeatherService },
        LambdaHandlerProvider,
      ],
    }).compile();
    geocodeService = app.get(MockGeocoder);
    weatherService = app.get(MockWeatherService);
    handlerProvider = app.get(LambdaHandlerProvider);
  });

  describe('current', () => {
    it('should fail without a "city" parameter', async () => {
      const result = await handlerProvider.current(
        event({}, {}),
        context(),
        disallowedCallback(),
      );
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(HttpStatus.BAD_REQUEST);
      // Error message should contain something about the missing parameter
      expect(structured.body).toContain('city');
    });
    it('should fail with geocoder error without status code', async () => {
      const error = new Error('forced error');
      geocodeService.expectedError = error;
      const city = 'Sydney';
      const result = await handlerProvider.current(
        event({ city }, {}),
        context(),
        disallowedCallback(),
      );
      expect(geocodeService.lastLocation).toBe(city);
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(structured.body).toBe(error.message);
    });
    it('should fail with geocoder error with status code', async () => {
      const error = new HttpException('forced error', HttpStatus.UNAUTHORIZED);
      geocodeService.expectedError = error;
      const city = 'Sydney';
      const result = await handlerProvider.current(
        event({ city }, {}),
        context(),
        disallowedCallback(),
      );
      expect(geocodeService.lastLocation).toBe(city);
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(error.getStatus());
      expect(structured.body).toBe(error.message);
    });
    it('should fail with weather error without status code', async () => {
      const error = new Error('forced error');
      const city = 'New York';
      geocodeService.expectedCoords = { name: city, lat: 0, long: 0 };
      weatherService.expectedError = error;
      const result = await handlerProvider.current(
        event({ city }, {}),
        context(),
        disallowedCallback(),
      );
      expect(geocodeService.lastLocation).toBe(city);
      expect(weatherService.lastCoords).toBe(geocodeService.expectedCoords);
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(structured.body).toBe(error.message);
    });
    it('should fail with weather error with status code', async () => {
      const error = new HttpException('forced error', HttpStatus.UNAUTHORIZED);
      const city = 'New York';
      geocodeService.expectedCoords = { name: city, lat: 0, long: 0 };
      weatherService.expectedError = error;
      const result = await handlerProvider.current(
        event({ city }, {}),
        context(),
        disallowedCallback(),
      );
      expect(geocodeService.lastLocation).toBe(city);
      expect(weatherService.lastCoords).toBe(geocodeService.expectedCoords);
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(error.getStatus());
      expect(structured.body).toBe(error.message);
    });
    it('should return current weather', async () => {
      const weather = { temperature: 15 } as CurrentWeather;
      const city = 'New York';
      geocodeService.expectedCoords = { name: city, lat: 0, long: 0 };
      weatherService.expectedWeather = weather;
      const result = await handlerProvider.current(
        event({ city }, {}),
        context(),
        disallowedCallback(),
      );
      expect(geocodeService.lastLocation).toBe(city);
      expect(weatherService.lastCoords).toBe(geocodeService.expectedCoords);
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(HttpStatus.OK);
      expect(structured.body).toBeDefined();
      const parsedWeather = JSON.parse(structured.body!);
      expect(parsedWeather).toEqual(weather);
    });
  });
});
