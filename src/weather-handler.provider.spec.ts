import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import {
  CurrentWeather,
  GEOCODE_SERVICE,
  GeocodeCoordinates,
  GeocodeService,
  HistoricalWeather,
  WEATHER_SERVICE,
  WeatherService,
} from './types';
import { extractCoordinates } from './utils';
import { WeatherHandlerProvider } from './weather-handler.provider';
import {
  context,
  disallowedCallback,
  event,
} from '../test/utils/lambda-testing';

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
  lastCurrentCoords: GeocodeCoordinates | undefined;
  expectedCurrentError: Error | undefined;
  expectedCurrentWeather: CurrentWeather | undefined;

  current(coordinates: GeocodeCoordinates): Promise<CurrentWeather>;
  current(latitude: number, longitude: number): Promise<CurrentWeather>;
  current(
    latitude: GeocodeCoordinates | number,
    longitude?: number,
  ): Promise<CurrentWeather> {
    const coords = extractCoordinates(latitude, longitude);
    this.lastCurrentCoords = coords;
    if (this.expectedCurrentWeather) {
      return Promise.resolve(this.expectedCurrentWeather);
    }
    return Promise.reject(this.expectedCurrentError);
  }

  lastHistoricalCoords: GeocodeCoordinates | undefined;
  expectedHistoricalError: Error | undefined;
  expectedHistoricalWeather: HistoricalWeather | undefined;

  historical(coordinates: GeocodeCoordinates): Promise<HistoricalWeather>;
  historical(latitude: number, longitude: number): Promise<HistoricalWeather>;
  historical(
    latitude: GeocodeCoordinates | number,
    longitude?: number,
  ): Promise<HistoricalWeather> {
    const coords = extractCoordinates(latitude, longitude);
    this.lastHistoricalCoords = coords;
    if (this.expectedHistoricalWeather) {
      return Promise.resolve(this.expectedHistoricalWeather);
    }
    return Promise.reject(this.expectedHistoricalError);
  }
}

describe('WeatherHandlerProvider', () => {
  let geocodeService: MockGeocoder;
  let weatherService: MockWeatherService;
  let handlerProvider: WeatherHandlerProvider;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        MockGeocoder,
        { provide: GEOCODE_SERVICE, useExisting: MockGeocoder },
        MockWeatherService,
        { provide: WEATHER_SERVICE, useExisting: MockWeatherService },
        WeatherHandlerProvider,
      ],
    }).compile();
    geocodeService = app.get(MockGeocoder);
    weatherService = app.get(MockWeatherService);
    handlerProvider = app.get(WeatherHandlerProvider);
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
      weatherService.expectedCurrentError = error;
      const result = await handlerProvider.current(
        event({ city }, {}),
        context(),
        disallowedCallback(),
      );
      expect(geocodeService.lastLocation).toBe(city);
      expect(weatherService.lastCurrentCoords).toBe(
        geocodeService.expectedCoords,
      );
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(structured.body).toBe(error.message);
    });
    it('should fail with weather error with status code', async () => {
      const error = new HttpException('forced error', HttpStatus.UNAUTHORIZED);
      const city = 'New York';
      geocodeService.expectedCoords = { name: city, lat: 0, long: 0 };
      weatherService.expectedCurrentError = error;
      const result = await handlerProvider.current(
        event({ city }, {}),
        context(),
        disallowedCallback(),
      );
      expect(geocodeService.lastLocation).toBe(city);
      expect(weatherService.lastCurrentCoords).toBe(
        geocodeService.expectedCoords,
      );
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(error.getStatus());
      expect(structured.body).toBe(error.message);
    });
    it('should return current weather', async () => {
      const weather = { temperature: 15 } as CurrentWeather;
      const city = 'New York';
      geocodeService.expectedCoords = { name: city, lat: 0, long: 0 };
      weatherService.expectedCurrentWeather = weather;
      const result = await handlerProvider.current(
        event({ city }, {}),
        context(),
        disallowedCallback(),
      );
      expect(geocodeService.lastLocation).toBe(city);
      expect(weatherService.lastCurrentCoords).toBe(
        geocodeService.expectedCoords,
      );
      expect(result).toBeDefined();
      const structured = result as APIGatewayProxyStructuredResultV2;
      expect(structured.statusCode).toBe(HttpStatus.OK);
      expect(structured.body).toBeDefined();
      const parsedWeather = JSON.parse(structured.body!);
      expect(parsedWeather).toEqual(weather);
    });
  });
});
