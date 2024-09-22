import {
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyEventV2,
  Callback,
  Context,
} from 'aws-lambda';

export function event(
  pathParameters?: APIGatewayProxyEventPathParameters,
  queryStringParameters?: APIGatewayProxyEventQueryStringParameters,
): APIGatewayProxyEventV2 {
  return {
    pathParameters,
    queryStringParameters,
  } as APIGatewayProxyEventV2;
}

export function context(): Context {
  return {} as Context;
}

export function disallowedCallback(): Callback<any> {
  return () => {
    throw new Error('Callback invocation is not allowed');
  };
}
