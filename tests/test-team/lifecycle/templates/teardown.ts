import {
  restoreSftpPollingFrequency,
  parseSetupTeardownArgs,
  StateFile,
  deleteClientConfigs,
  deleteClientEntries,
  StorageHelper,
  setLetterVariantCacheTTL,
} from 'nhs-notify-system-tests-shared';
import z from 'zod';

async function main() {
  const { lifecycleServiceDir, targetEnvironment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);
  await stateFile.loadFromDisk();

  let exit = 0;

  const initialSftpPollingFrequency = stateFile.getValue(
    'initialState',
    'sftpPollingFrequency',
    z.string().default('')
  );

  await restoreSftpPollingFrequency(
    targetEnvironment,
    initialSftpPollingFrequency
  ).catch((error) => {
    exit = 1;
    console.error(error);
  });

  const initialLetterVariantCacheTTL = stateFile.getValue(
    'initialState',
    'letterVariantCacheTTL',
    z.string()
  );

  await setLetterVariantCacheTTL(
    targetEnvironment,
    initialLetterVariantCacheTTL
  ).catch((error) => {
    exit = 1;
    console.error(error);
  });

  const clientIds = Object.values(
    stateFile.getValues(
      'clientIds',
      z.record(z.string(), z.string()).default({})
    )
  );

  await deleteClientConfigs(targetEnvironment, clientIds).catch((error) => {
    exit = 1;
    console.error(error);
  });

  const cis2ClientId = stateFile.getValue(
    'cis2',
    'notify-client-id',
    z.string().default('')
  );

  const deletedTemplates = await Promise.allSettled(
    [...clientIds, cis2ClientId].map((id) =>
      deleteClientEntries(
        id,
        `nhs-notify-${targetEnvironment}-app-api-templates`
      )
    )
  );

  const deletedRoutingConfigs = await Promise.allSettled(
    [...clientIds, cis2ClientId].map((id) =>
      deleteClientEntries(
        id,
        `nhs-notify-${targetEnvironment}-app-api-routing-configuration`
      )
    )
  );

  const letterVariants = Object.values(
    stateFile.getValues(
      'letterVariants',
      z.record(z.string(), z.object({ PK: z.string(), SK: z.string() }))
    )
  );

  const deletedLetterVariants = await Promise.allSettled([
    new StorageHelper(
      `nhs-notify-${targetEnvironment}-app-api-letter-variants`,
      ['PK', 'SK'],
      letterVariants
    ).deleteData(),
  ]);

  const failures = [
    ...deletedTemplates,
    ...deletedRoutingConfigs,
    ...deletedLetterVariants,
  ].flatMap((res) => (res.status === 'rejected' ? [res.reason] : []));

  if (failures.length) {
    exit = 1;
    console.error(new AggregateError(failures));
  }

  process.exit(exit);
}

main();
