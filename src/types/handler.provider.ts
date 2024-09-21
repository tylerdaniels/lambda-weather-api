import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export interface HandlerProvider {
  readonly current: APIGatewayProxyHandlerV2;
  readonly historical: APIGatewayProxyHandlerV2;
}
