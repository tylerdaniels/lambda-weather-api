import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { OPENWEATHERMAP_APIKEY } from './openweather.constants';
import { CurrentWeather, GeocodeCoordinates, WeatherService } from 'src/types';
import { extractCoordinates } from 'src/utils';

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

@Injectable()
export class WeatherApi implements WeatherService {
  constructor(@Inject(OPENWEATHERMAP_APIKEY) private readonly apiKey: string) {}

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
    const response = await fetch(
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
      temperature: weather.main.temp,
      pressure: weather.main.pressure,
      humidity: weather.main.humidity,
      windSpeed: weather.wind.speed,
    };
  }
}
