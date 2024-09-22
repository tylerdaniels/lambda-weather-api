import { CurrentWeather, HistoricalWeather } from '../types';
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
  it('should call the historical weather api for the requested coordinates', async () => {
    const key = 'apikey-123';
    const lat = 40.71;
    const long = -74.0;
    const expected = {
      units: 'metric',
      '2020-03-04': {
        temperatureMax: 25,
        temperatureMin: 20,
        rain: 12,
      },
    } as unknown as HistoricalWeather;
    const [fetchFn, lastUri, lastQuery] = mockFetchJson({
      lat,
      lon: long,
      tz: '+02:00',
      date: '2020-03-04',
      units: 'metric',
      precipitation: {
        total: expected['2020-03-04'].rain,
      },
      temperature: {
        min: expected['2020-03-04'].temperatureMin,
        max: expected['2020-03-04'].temperatureMax,
      },
    });
    const api = new WeatherApi(key, fetchFn);
    const results = await api.historical(lat, long);
    expect(results).toEqual(expected);
    expect(lastUri()).toBe(
      'https://api.openweathermap.org/data/3.0/onecall/day_summary',
    );
    const params = lastQuery();
    expect(params).toBeDefined();
    expect(params!.get('lat')).toBe(lat.toString());
    expect(params!.get('lon')).toBe(long.toString());
    expect(params!.get('units')).toBe('metric');
    expect(params!.get('appid')).toBe(key);
    expect(params!.get('date')).toBeDefined();
  });
});
