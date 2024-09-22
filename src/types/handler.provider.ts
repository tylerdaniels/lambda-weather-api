import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export interface HandlerProvider {
  readonly current: APIGatewayProxyHandlerV2;
  readonly historical: APIGatewayProxyHandlerV2;
}

/**
 * Wraps an existing provider allowing for composition
 * of the functions to provide additional functionality
 */
export interface HandlerWrapper {
  wrap(handlers: HandlerProvider): HandlerProvider;
}
