import { NestFactory } from '@nestjs/core';
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { AppModule } from './app.module';
import { AppService } from './app.service';

let service: AppService;

async function bootstrap(): Promise<AppService> {
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.init();

  return app.get(AppService);
}

export const handler: APIGatewayProxyHandlerV2 =
  async () // event: APIGatewayProxyEventV2,
  // context: Context,
  // callback: Callback<APIGatewayProxyResultV2>,
  : Promise<APIGatewayProxyResultV2> => {
    const appService = service ?? (await bootstrap());
    return {
      statusCode: 200,
      body: appService.getHello(),
    };
  };
