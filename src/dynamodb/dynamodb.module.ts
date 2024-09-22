import { DynamicModule, Module } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  DYNAMODB_LAMBDA_WRAPPER,
  DYNAMODB_REQUEST_TABLE,
  ENV_DYNAMODB_ENABLED,
  ENV_DYNAMODB_ENDPOINT,
  ENV_DYNAMODB_REGION,
  ENV_DYNAMODB_TABLE,
} from './dynamodb.constants';
import { DynamoDbWrapper } from './dynamodb.wrapper';

function optEnv(variable: string): string | undefined {
  if (!(variable in process.env)) {
    return undefined;
  }
  return process.env[variable];
}

@Module({})
export class DynamoDbModule {
  static forRoot(): DynamicModule {
    const enabled = optEnv(ENV_DYNAMODB_ENABLED);
    if (!enabled || enabled === '0' || enabled.toLowerCase() === 'false') {
      // Return empty module when environment
      // variable is missing or disabled
      return {
        module: DynamoDbModule,
      };
    }
    return {
      module: DynamoDbModule,
      providers: [
        {
          provide: DynamoDBClient,
          useFactory: () => {
            return new DynamoDBClient({
              region: optEnv(ENV_DYNAMODB_REGION),
              endpoint: optEnv(ENV_DYNAMODB_ENDPOINT),
            });
          },
        },
        {
          provide: DynamoDBDocumentClient,
          inject: [DynamoDBClient],
          useFactory: (client: DynamoDBClient) => {
            return DynamoDBDocumentClient.from(client);
          },
        },
        {
          provide: DYNAMODB_REQUEST_TABLE,
          useFactory: () => {
            const table = optEnv(ENV_DYNAMODB_TABLE);
            if (!table) {
              throw new Error(
                `Missing definition for the audit table, use env variable "${ENV_DYNAMODB_TABLE}"`,
              );
            }
            return table;
          },
        },
        {
          provide: DYNAMODB_LAMBDA_WRAPPER,
          useClass: DynamoDbWrapper,
        },
      ],
      exports: [DYNAMODB_LAMBDA_WRAPPER],
    };
  }
}
