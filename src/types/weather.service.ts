import { GeocodeCoordinates } from './geocode.service';

export interface CurrentWeather {
  temperature: number;
  pressure: number;
  humidity: number;
  windSpeed: number;
}

export interface WeatherService {
  current(coordinates: GeocodeCoordinates): Promise<CurrentWeather>;
  current(latitude: number, longitude: number): Promise<CurrentWeather>;
}
