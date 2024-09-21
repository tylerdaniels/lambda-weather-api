import { Module } from '@nestjs/common';
import { GeocodeApi } from './openweather-geocode.service';
import { WeatherApi } from './openweather-weather.service';
import { GEOCODE_SERVICE, WEATHER_SERVICE } from 'src/types/tokens.constants';
import { OPENWEATHERMAP_APIKEY } from './openweather.constants';

@Module({
  providers: [
    {
      // Extract API Key and use a Provider to inject it where needed
      provide: OPENWEATHERMAP_APIKEY,
      useFactory: () => {
        const apiKey = process.env.OPENWEATHER_APIKEY;
        if (!apiKey || apiKey.length === 0) {
          throw new Error(
            'Missing OpenWeatherMap API Key. Use env "OPENWEATHER_APIKEY" to provide one',
          );
        }
        return apiKey;
      },
    },
    {
      provide: GEOCODE_SERVICE,
      useClass: GeocodeApi,
    },
    {
      provide: WEATHER_SERVICE,
      useClass: WeatherApi,
    },
  ],
  exports: [GEOCODE_SERVICE, WEATHER_SERVICE],
})
export class OpenWeatherMapModule {}
