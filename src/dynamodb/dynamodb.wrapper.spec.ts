import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { wrap } from './dynamodb.wrapper';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { context, disallowedCallback, event } from '../../test/utils';

class MockDynamoDBDocumentClient
  implements Pick<DynamoDBDocumentClient, 'send'>
{
  readonly sentCommands: unknown[] = [];
  send(command: unknown): Promise<void> {
    return new Promise((res) => {
      this.sentCommands.push(command);
      res();
    });
  }
}

function castClient(client: unknown): DynamoDBDocumentClient {
  return client as DynamoDBDocumentClient;
}

describe('DynamoDbWrapper.wrap', () => {
  it('should add and update request when successful', async () => {
    const client = new MockDynamoDBDocumentClient();
    const table = 'request-table';
    const type = 'forecast';
    const expectedOutput = { statusCode: 200, body: '' };
    let called = false;
    const handler: APIGatewayProxyHandlerV2 = () => {
      called = true;
      return Promise.resolve(expectedOutput);
    };
    const wrapped = wrap(castClient(client), table, type, handler);
    const output = await wrapped(event(), context(), disallowedCallback());
    expect(called).toBeTruthy();
    expect(output).toBe(expectedOutput);
    expect(client.sentCommands).toHaveLength(2);
    expect(client.sentCommands[0]).toBeInstanceOf(PutCommand);
    expect(client.sentCommands[1]).toBeInstanceOf(UpdateCommand);
    const putCommand = client.sentCommands[0] as PutCommand;
    expect(putCommand.input.TableName).toBe(table);
    expect(putCommand.input.Item!.date).toBeDefined();
    expect(putCommand.input.Item!.type).toBe(type);
    const updateCommand = client.sentCommands[1] as UpdateCommand;
    expect(updateCommand.input.TableName).toBe(table);
  });
  it('should add and update request when promise rejected', async () => {
    const client = new MockDynamoDBDocumentClient();
    const table = 'request-table';
    const type = 'forecast';
    const expectedError = new Error('handler call rejected');
    let called = false;
    const handler: APIGatewayProxyHandlerV2 = () => {
      called = true;
      return Promise.reject(expectedError);
    };
    const wrapped = wrap(castClient(client), table, type, handler);
    try {
      await wrapped(event(), context(), disallowedCallback());
      fail('wrapped handler call should be rejected');
    } catch (e: unknown) {
      expect(e).toBe(expectedError);
    }
    expect(called).toBeTruthy();
    expect(client.sentCommands).toHaveLength(2);
    expect(client.sentCommands[0]).toBeInstanceOf(PutCommand);
    expect(client.sentCommands[1]).toBeInstanceOf(UpdateCommand);
    const putCommand = client.sentCommands[0] as PutCommand;
    expect(putCommand.input.TableName).toBe(table);
    expect(putCommand.input.Item!.date).toBeDefined();
    expect(putCommand.input.Item!.type).toBe(type);
    const updateCommand = client.sentCommands[1] as UpdateCommand;
    expect(updateCommand.input.TableName).toBe(table);
  });
  it('should add and update request when handler returns void', async () => {
    const client = new MockDynamoDBDocumentClient();
    const table = 'request-table';
    const type = 'forecast';
    let called = false;
    const handler: APIGatewayProxyHandlerV2 = () => {
      called = true;
    };
    const wrapped = wrap(castClient(client), table, type, handler);
    try {
      await wrapped(event(), context(), disallowedCallback());
      fail('wrapped handler call should be rejected');
    } catch (e: unknown) {
      expect(e).toBeDefined();
    }
    expect(called).toBeTruthy();
    expect(client.sentCommands).toHaveLength(2);
    expect(client.sentCommands[0]).toBeInstanceOf(PutCommand);
    expect(client.sentCommands[1]).toBeInstanceOf(UpdateCommand);
    const putCommand = client.sentCommands[0] as PutCommand;
    expect(putCommand.input.TableName).toBe(table);
    expect(putCommand.input.Item!.date).toBeDefined();
    expect(putCommand.input.Item!.type).toBe(type);
    const updateCommand = client.sentCommands[1] as UpdateCommand;
    expect(updateCommand.input.TableName).toBe(table);
  });
});
