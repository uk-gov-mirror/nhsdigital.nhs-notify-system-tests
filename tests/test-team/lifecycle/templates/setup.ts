import { randomUUID } from 'node:crypto';
import {
  createClientConfig,
  getCis2ClientId,
  increaseSftpPollingFrequency,
  parseSetupTeardownArgs,
  StateFile,
  StorageHelper,
  TemplateFactory,
  TemplateType,
  LetterVariantFactory,
  getLetterVariantCacheTTL,
  setLetterVariantCacheTTL,
} from 'nhs-notify-system-tests-shared';
import { clients } from '../../fixtures/clients';
import { GLOBAL_LETTER_VARIANT_KEY } from '../../fixtures/letter-variants';

async function main() {
  const { lifecycleServiceDir, targetEnvironment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);

  const sftpPollingFrequency =
    await increaseSftpPollingFrequency(targetEnvironment);

  stateFile.setValue(
    'initialState',
    'sftpPollingFrequency',
    sftpPollingFrequency
  );

  const letterVariantCacheTTL =
    await getLetterVariantCacheTTL(targetEnvironment);

  stateFile.setValue(
    'initialState',
    'letterVariantCacheTTL',
    letterVariantCacheTTL
  );

  await setLetterVariantCacheTTL(targetEnvironment, '0');

  const clientEntries = Object.entries(clients).map(
    ([key, config]) =>
      [key, { config: config.templates, id: `${key}${runId}` }] as const
  );

  await Promise.all(
    clientEntries.map(([, { id, config }]) =>
      createClientConfig(targetEnvironment, id, config, 'product')
    )
  );

  const clientIds = Object.fromEntries(
    clientEntries.map(([key, { id }]) => [key, id])
  );

  stateFile.setValues('clientIds', clientIds);

  const cis2ClientId = await getCis2ClientId();

  stateFile.setValue('cis2', 'notify-client-id', cis2ClientId);

  const multiChannelRoutingConfigNhsAppTemplate = TemplateFactory.create(
    randomUUID(),
    clientIds['PrimaryRoutingEnabledProduct'],
    TemplateType.NHS_APP,
    {
      name: 'multi-channel-routing-config-nhsapp-template-name',
      message: 'multi-channel-routing-config-nhsapp-message',
    }
  );
  stateFile.setValue(
    'templates',
    'multiChannelRoutingConfigNhsApp',
    multiChannelRoutingConfigNhsAppTemplate
  );

  const multiChannelRoutingConfigEmailTemplate = TemplateFactory.create(
    randomUUID(),
    clientIds['PrimaryRoutingEnabledProduct'],
    TemplateType.EMAIL,
    {
      name: 'multi-channel-routing-config-email-template-name',
      message: 'multi-channel-routing-config-email-template-message',
      subject: 'multi-channel-routing-config-email-template-subject',
    }
  );
  stateFile.setValue(
    'templates',
    'multiChannelRoutingConfigEmail',
    multiChannelRoutingConfigEmailTemplate
  );

  const multiChannelRoutingConfigSmsTemplate = TemplateFactory.create(
    randomUUID(),
    clientIds['PrimaryRoutingEnabledProduct'],
    TemplateType.SMS,
    {
      name: 'multi-channel-routing-config-sms-template-name',
      message: 'multi-channel-routing-config-sms-template-message',
    }
  );
  stateFile.setValue(
    'templates',
    'multiChannelRoutingConfigSms',
    multiChannelRoutingConfigSmsTemplate
  );

  await new StorageHelper(
    `nhs-notify-${targetEnvironment}-app-api-templates`,
    ['owner', 'id'],
    [
      multiChannelRoutingConfigNhsAppTemplate,
      multiChannelRoutingConfigEmailTemplate,
      multiChannelRoutingConfigSmsTemplate,
    ]
  ).seedData();

  const globalVariant = LetterVariantFactory.create({
    name: `system-tests-global-variant-${runId}`,
  });

  await new StorageHelper(
    `nhs-notify-${targetEnvironment}-app-api-letter-variants`,
    ['PK', 'SK'],
    [globalVariant]
  ).seedData();

  stateFile.setValue(
    'letterVariants',
    GLOBAL_LETTER_VARIANT_KEY,
    globalVariant
  );

  await stateFile.persist();
}

main();
