import {
  LambdaClient,
  GetFunctionConfigurationCommand,
  UpdateFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';

const client = new LambdaClient({ region: 'eu-west-2' });

export async function getLambdaEnvironmentVariables(
  functionName: string
): Promise<Record<string, string>> {
  const { Environment } = await client.send(
    new GetFunctionConfigurationCommand({
      FunctionName: functionName,
    })
  );

  return Environment?.Variables ?? {};
}
export async function setLambdaEnvironmentVariables(
  functionName: string,
  variables: Record<string, string>
) {
  const current = await getLambdaEnvironmentVariables(functionName);

  await client.send(
    new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Environment: {
        Variables: {
          ...current,
          ...variables,
        },
      },
    })
  );
}
