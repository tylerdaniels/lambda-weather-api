import { Module } from '@nestjs/common';
import { OpenWeatherMapModule } from './openweather/openweather.module';
import { HANDLER_PROVIDER } from './types';
import { LambdaHandlerProvider } from './lambda-handler.provider';

@Module({
  imports: [OpenWeatherMapModule],
  providers: [
    {
      provide: HANDLER_PROVIDER,
      useClass: LambdaHandlerProvider,
    },
  ],
})
export class AppModule {}
