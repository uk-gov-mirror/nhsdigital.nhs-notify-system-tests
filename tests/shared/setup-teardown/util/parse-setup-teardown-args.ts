import { dirname } from 'node:path';
import z from 'zod';

export function parseSetupTeardownArgs(argv: string[]): {
  lifecycleServiceDir: string;
  targetEnvironment: string;
  runId: string;
} {
  const [, scriptPath, targetEnvironment, runId] = argv;

  const lifecycleServiceDir = dirname(scriptPath);

  const parseResult = z
    .object({
      lifecycleServiceDir: z.string(),
      targetEnvironment: z.string(),
      runId: z.string(),
    })
    .safeParse({
      lifecycleServiceDir,
      targetEnvironment,
      runId,
    });

  if (!parseResult.success) {
    throw new Error('Unable to parse setup/teardown args', {
      cause: parseResult.error,
    });
  }

  return parseResult.data;
}
