import { GeocodeCoordinates } from './geocode.service';

export type WeatherUnit = 'imperical' | 'metric';

export interface CurrentWeather {
  temperature: number;
  pressure: number;
  humidity: number;
  windSpeed: number;
  units: WeatherUnit;
}

export interface HistoricalWeatherSnapshot {
  temperatureMax: number;
  temperatureMin: number;
  rain: number;
}

export type HistoricalWeather = {
  units: WeatherUnit;
} & Record<string, HistoricalWeatherSnapshot>;

export interface WeatherService {
  current(coordinates: GeocodeCoordinates): Promise<CurrentWeather>;
  current(latitude: number, longitude: number): Promise<CurrentWeather>;

  historical(coordinates: GeocodeCoordinates): Promise<HistoricalWeather>;
  historical(latitude: number, longitude: number): Promise<HistoricalWeather>;
}
