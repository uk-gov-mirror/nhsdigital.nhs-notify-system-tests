/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtLetterPage } from '../../pages/template-mgmt-letter-page';
import {
  startPage,
  chooseTemplate,
  createLetterTemplate,
  startNewTemplate,
} from '../../steps/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/primaryRoutingEnabled.json' });

const testConfigs = [
  {
    language: 'bn',
    inputFileName: 'Bengali.pdf',
  },
  { language: 'ar', inputFileName: 'Arabic.pdf' },
  {
    language: 'tr',
    inputFileName: 'Turkish.pdf',
  },
];

for (const { language, inputFileName } of testConfigs) {
  test(`User creates and submits a new letter template successfully - ${language} - routing enabled)`, async ({
    page,
  }) => {
    test.setTimeout(240_000); // override just for this test

    const props = {
      basePage: new TemplateMgmtLetterPage(page),
    };

    const channel = 'Letter';
    const name = `${language} language template e2e test - routing enabled`;

    await startPage(props);
    await startNewTemplate(props);
    await chooseTemplate(props, channel);
    await createLetterTemplate(props, name, language, inputFileName);
  });
}
