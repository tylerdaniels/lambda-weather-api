import { APIGatewayProxyHandler } from 'aws-lambda';

export interface HandlerProvider {
  readonly current: APIGatewayProxyHandler;
  readonly historical: APIGatewayProxyHandler;
}
