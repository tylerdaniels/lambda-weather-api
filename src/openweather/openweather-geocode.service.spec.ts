import { GeocodeCoordinates } from 'src/types';
import { GeocodeApi } from './openweather-geocode.service';
import { mockFetchJson, mockFetchText } from '../../test/utils';
import { HttpStatus } from '@nestjs/common';

describe('GeocodeApi', () => {
  it('should call the geocode api for the requested city', async () => {
    const key = 'apikey-123';
    const city = 'newyork';
    const expected: GeocodeCoordinates = {
      name: 'New York, NY, US',
      lat: 40.71,
      long: -74.0,
    };
    const [fetchFn, lastUri, lastQuery] = mockFetchJson([
      {
        name: 'New York',
        lat: expected.lat,
        lon: expected.long,
        country: 'US',
        state: 'NY',
      },
    ]);
    const api = new GeocodeApi(key, fetchFn);
    const results = await api.geocode(city);
    expect(results).toEqual(expected);
    expect(lastUri()).toBe('http://api.openweathermap.org/geo/1.0/direct');
    const params = lastQuery();
    expect(params).toBeDefined();
    expect(params!.get('q')).toBe(city);
    expect(params!.get('appid')).toBe(key);
  });
  it('should throw error when no cities returned from the API', async () => {
    const key = 'apikey-456';
    const city = 'madrid';
    const [fetchFn, lastUri, lastQuery] = mockFetchJson([]);
    const api = new GeocodeApi(key, fetchFn);
    try {
      await api.geocode(city);
      fail('Geocode request should fail with no cities');
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(Error);
    }
    expect(lastUri()).toBe('http://api.openweathermap.org/geo/1.0/direct');
    const params = lastQuery();
    expect(params).toBeDefined();
    expect(params!.get('q')).toBe(city);
    expect(params!.get('appid')).toBe(key);
  });
  it('should throw error for non-200 return code', async () => {
    const key = 'apikey-456';
    const city = 'london';
    const error = 'User is unauthorized to use this API';
    const [fetchFn, lastUri, lastQuery] = mockFetchText(
      error,
      HttpStatus.UNAUTHORIZED,
    );
    const api = new GeocodeApi(key, fetchFn);
    try {
      await api.geocode(city);
      fail('Geocode request should fail with unseccessful API call');
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(Error);
    }
    expect(lastUri()).toBe('http://api.openweathermap.org/geo/1.0/direct');
    const params = lastQuery();
    expect(params).toBeDefined();
    expect(params!.get('q')).toBe(city);
    expect(params!.get('appid')).toBe(key);
  });
});
