import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

export class StorageHelper<T extends string, U extends Record<T, unknown>> {
  private readonly ddbDocClient: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    private readonly keyNames: T[],
    private readonly data: U[]
  ) {
    const dynamoClient = new DynamoDBClient({ region: 'eu-west-2' });
    this.ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);
  }

  async seedData() {
    const promises = this.data.map((item) =>
      this.ddbDocClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      )
    );

    await Promise.all(promises);
  }

  async deleteData() {
    const promises = this.data.map((item) =>
      this.ddbDocClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: Object.fromEntries(this.keyNames.map((key) => [key, item[key]])),
        })
      )
    );

    await Promise.all(promises);
  }
}
