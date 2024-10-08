import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
} from 'aws-lambda';
import type { HandlerProvider } from './types/handler.provider';
import { NestFactory } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';
import { AppModule } from './app.module';
import { HANDLER_PROVIDER } from './types';

let handlers: HandlerProvider; // Handler cache for warm starts

async function bootstrap(): Promise<HandlerProvider> {
  const app = await NestFactory.createApplicationContext(AppModule);
  handlers = app.get(HANDLER_PROVIDER);
  return handlers;
}

export const current: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback<APIGatewayProxyResultV2>,
): Promise<APIGatewayProxyResultV2> => {
  const handlerProvider = handlers ?? (await bootstrap());
  const result = await handlerProvider.current(event, context, callback);
  if (result === undefined) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: 'Current weather handler failed to return a value',
    };
  }
  return result;
};

export const historical: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback<APIGatewayProxyResultV2>,
): Promise<APIGatewayProxyResultV2> => {
  const handlerProvider = handlers ?? (await bootstrap());
  const result = await handlerProvider.historical(event, context, callback);
  if (result === undefined) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: 'Historical weather handler failed to return a value',
    };
  }
  return result;
};
