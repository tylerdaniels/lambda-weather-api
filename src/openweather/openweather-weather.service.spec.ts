import { CurrentWeather } from '../types';
import { mockFetchJson } from '../../test/utils';
import { WeatherApi } from './openweather-weather.service';

describe('WeatherApi', () => {
  it('should call the current weather api for the requested coordinates', async () => {
    const key = 'apikey-123';
    const lat = 40.71;
    const long = -74.0;
    const expected: CurrentWeather = {
      units: 'metric',
      temperature: 24,
      pressure: 1013,
      humidity: 45,
      windSpeed: 12,
    };
    const [fetchFn, lastUri, lastQuery] = mockFetchJson({
      coord: {
        lon: long,
        lat,
      },
      main: {
        temp: expected.temperature,
        pressure: expected.pressure,
        humidity: expected.humidity,
      },
      wind: {
        speed: expected.windSpeed,
      },
    });
    const api = new WeatherApi(key, fetchFn);
    const results = await api.current(lat, long);
    expect(results).toEqual(expected);
    expect(lastUri()).toBe('https://api.openweathermap.org/data/2.5/weather');
    const params = lastQuery();
    expect(params).toBeDefined();
    expect(params!.get('lat')).toBe(lat.toString());
    expect(params!.get('lon')).toBe(long.toString());
    expect(params!.get('units')).toBe(expected.units);
    expect(params!.get('appid')).toBe(key);
  });
});
