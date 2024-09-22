import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { OPENWEATHERMAP_APIKEY } from './openweather.constants';
import {
  CurrentWeather,
  GeocodeCoordinates,
  HistoricalWeather,
  HistoricalWeatherSnapshot,
  WeatherService,
} from 'src/types';
import { extractCoordinates } from '../utils';

type WeatherCoordinates = {
  lat: number;
  lon: number;
};

type WeatherResponseMain = {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level: number;
  grnd_level: number;
};

type WeatherResponseWind = {
  speed: number;
  deg: number;
  gust: number;
};

type WeatherResponse = {
  coord: WeatherCoordinates;
  main: WeatherResponseMain;
  wind: WeatherResponseWind;
};

interface HistoricalTemperature {
  min: number;
  max: number;
  afternoon: number;
  night: number;
  evening: number;
  morning: number;
}

interface HistoricalWind {
  max: {
    speed: number;
    direction: number;
  };
}

interface HistoricalRain {
  total: number;
}

interface HistoricalData {
  date: string;
  tz: string;
  units: string;

  temperature: HistoricalTemperature;
  wind: HistoricalWind;
  precipitation: HistoricalRain;
}

const MILLIS_IN_24_HOURS = 1000 * 60 * 60 * 24;

async function historicalData(
  fetchFn: typeof fetch,
  baseParams: URLSearchParams,
  date: number,
): Promise<HistoricalData> {
  const allParams = new URLSearchParams(baseParams);
  const dateObj = new Date(date);
  const dateString = `${dateObj.getUTCFullYear()}-${dateObj.getUTCMonth()}-${dateObj.getUTCDate()}`;
  allParams.set('date', dateString);
  const response = await fetchFn(
    `https://api.openweathermap.org/data/3.0/onecall/day_summary?${allParams.toString()}`,
  );
  if (response.status !== 200) {
    throw new HttpException(
      await response.text(),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  return await response.json();
}

@Injectable()
export class WeatherApi implements WeatherService {
  private readonly fetchFn: typeof fetch;

  constructor(
    @Inject(OPENWEATHERMAP_APIKEY) private readonly apiKey: string,
    // Used to inject mocked fetch for testing
    @Optional() fetchFn?: typeof fetch,
  ) {
    this.fetchFn = fetchFn ?? global.fetch;
  }

  async current(
    latitude: GeocodeCoordinates | number,
    longitude?: number,
  ): Promise<CurrentWeather> {
    const coords = extractCoordinates(latitude, longitude);
    const params = new URLSearchParams({
      lat: coords.lat.toString(),
      lon: coords.long.toString(),
      units: 'metric',
      appid: this.apiKey,
    });
    const response = await this.fetchFn(
      `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
    );
    if (response.status !== 200) {
      throw new HttpException(
        await response.text(),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const weather: WeatherResponse = await response.json();
    return {
      units: 'metric',
      temperature: weather.main.temp,
      pressure: weather.main.pressure,
      humidity: weather.main.humidity,
      windSpeed: weather.wind.speed,
    };
  }

  async historical(
    latitude: GeocodeCoordinates | number,
    longitude?: number,
  ): Promise<HistoricalWeather> {
    const coords = extractCoordinates(latitude, longitude);
    const params = new URLSearchParams({
      lat: coords.lat.toString(),
      lon: coords.long.toString(),
      units: 'metric',
      appid: this.apiKey,
    });
    const now = new Date().getTime();
    const responses = await Promise.all([
      historicalData(this.fetchFn, params, now - MILLIS_IN_24_HOURS * 1),
      historicalData(this.fetchFn, params, now - MILLIS_IN_24_HOURS * 2),
      historicalData(this.fetchFn, params, now - MILLIS_IN_24_HOURS * 3),
      historicalData(this.fetchFn, params, now - MILLIS_IN_24_HOURS * 4),
      historicalData(this.fetchFn, params, now - MILLIS_IN_24_HOURS * 5),
    ]);
    return Object.assign(
      { units: 'metric' },
      ...responses.map((data) => {
        const date = data.date;
        const snapshot: HistoricalWeatherSnapshot = {
          temperatureMax: data.temperature.max,
          temperatureMin: data.temperature.min,
          rain: data.precipitation.total,
        };
        return { [date]: snapshot };
      }),
    );
  }
}
