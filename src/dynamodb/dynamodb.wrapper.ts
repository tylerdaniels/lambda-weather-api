import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable } from '@nestjs/common';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
} from 'aws-lambda';
import { HandlerProvider, HandlerWrapper } from 'src/types';
import { DYNAMODB_REQUEST_TABLE } from './dynamodb.constants';

export function wrap(
  db: DynamoDBDocumentClient,
  tableName: string,
  type: string,
  handler: APIGatewayProxyHandlerV2,
): APIGatewayProxyHandlerV2 {
  return async (
    event: APIGatewayProxyEventV2,
    context: Context,
    callback: Callback<APIGatewayProxyResultV2>,
  ): Promise<APIGatewayProxyResultV2> => {
    const requestDate = new Date().getTime();
    await db.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          requestId: context.awsRequestId,
          date: requestDate,
          type,
          path: event.pathParameters,
          query: event.queryStringParameters,
        },
      }),
    );
    try {
      const weather = await handler(event, context, callback);
      if (!weather) {
        throw new Error('Weather service did not return a value');
      }
      const responseDate = new Date().getTime();
      const duration = responseDate - requestDate;
      await db.send(
        new UpdateCommand({
          TableName: tableName,
          Key: {
            requestId: context.awsRequestId,
            date: requestDate,
          },
          UpdateExpression: 'set #r = :response, #d = :duration',
          ExpressionAttributeNames: { '#r': 'response', '#d': 'duration' },
          ExpressionAttributeValues: {
            ':response': weather,
            ':duration': duration,
          },
        }),
      );
      return weather;
    } catch (e: unknown) {
      try {
        const responseDate = new Date().getTime();
        const duration = responseDate - requestDate;
        await db.send(
          new UpdateCommand({
            TableName: tableName,
            Key: {
              requestId: context.awsRequestId,
              date: requestDate,
            },
            UpdateExpression: 'set #r = :response, #d = :duration',
            ExpressionAttributeNames: { '#r': 'error', '#d': 'duration' },
            ExpressionAttributeValues: {
              ':response': e,
              ':duration': duration,
            },
          }),
        );
      } catch (e2: unknown) {
        // Swallow additional error but log to console
        console.log(
          'Additional error found when saving error to DynamoDB: ' + e2,
        );
      }
      // Rethrow original error for outer handlers
      throw e;
    }
  };
}

@Injectable()
export class DynamoDbWrapper implements HandlerWrapper {
  constructor(
    @Inject(DynamoDBDocumentClient) private readonly db: DynamoDBDocumentClient,
    @Inject(DYNAMODB_REQUEST_TABLE) private readonly requestTable: string,
  ) {}

  wrap(handlers: HandlerProvider): HandlerProvider {
    // Note: these use arrow functions to keep "this" context in delegate handlers
    return {
      current: wrap(this.db, this.requestTable, 'current', (ev, cxt, cb) =>
        handlers.current(ev, cxt, cb),
      ),

      historical: wrap(
        this.db,
        this.requestTable,
        'historical',
        (ev, cxt, cb) => handlers.historical(ev, cxt, cb),
      ),
    };
  }
}
