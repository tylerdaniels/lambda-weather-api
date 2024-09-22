import { Module } from '@nestjs/common';
import { OpenWeatherMapModule } from './openweather/openweather.module';
import { DynamoDbModule } from './dynamodb/dynamodb.module';
import { HANDLER_PROVIDER, HandlerProvider, HandlerWrapper } from './types';
import { WeatherHandlerProvider } from './weather-handler.provider';
import { DYNAMODB_LAMBDA_WRAPPER } from './dynamodb/dynamodb.constants';

@Module({
  imports: [OpenWeatherMapModule, DynamoDbModule.forRoot()],
  providers: [
    WeatherHandlerProvider,
    {
      provide: HANDLER_PROVIDER,
      inject: [
        WeatherHandlerProvider,
        // Provide wrappers below here, order is from the outside-in,
        // lambda will execute the first listed wrapper first
        { token: DYNAMODB_LAMBDA_WRAPPER, optional: true },
      ],
      useFactory: (
        weatherHandler: HandlerProvider,
        ...wrappers: (HandlerWrapper | undefined)[]
      ) => {
        if (!wrappers || wrappers.length === 0) {
          // No composition, return base handler
          return weatherHandler;
        }
        // Composes wrappers in reverse order
        return wrappers.reduceRight(
          (handler, nextWrapper) =>
            nextWrapper ? nextWrapper.wrap(handler) : handler,
          weatherHandler,
        );
      },
    },
  ],
  // Ignored for root module but good to be explicit
  exports: [HANDLER_PROVIDER],
})
export class AppModule {}
