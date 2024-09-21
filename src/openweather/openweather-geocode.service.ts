import { Inject, Injectable } from '@nestjs/common';
import { GeocodeCoordinates, GeocodeService } from 'src/types';
import { OPENWEATHERMAP_APIKEY } from './openweather.constants';

type GeocodeResponseCity = {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state: string;
};

type GeocodeResponse = GeocodeResponseCity[];

function hasLength(s: string): boolean {
  return !!s && s.trim().length > 0;
}

@Injectable()
export class GeocodeApi implements GeocodeService {
  constructor(@Inject(OPENWEATHERMAP_APIKEY) private readonly apiKey: string) {}

  async geocode(city: string): Promise<GeocodeCoordinates> {
    const params = new URLSearchParams({
      q: city,
      limit: '1',
      appid: this.apiKey,
    });
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?${params.toString()}`,
    );
    if (response.status !== 200) {
      throw new Error(await response.text());
    }
    const cities: GeocodeResponse = await response.json();
    if (cities.length === 0) {
      throw new Error(`No cities found for request: ${city}`);
    }
    const geocoded = cities[0];
    const name = [geocoded.name, geocoded.state, geocoded.country]
      .filter(hasLength)
      .join(', ');
    return {
      name,
      lat: geocoded.lat,
      long: geocoded.lon,
    };
  }
}
