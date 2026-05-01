import { expect, test } from 'playwright/test';
import {
  chooseTemplate,
  CommonStepsProps,
  previewPage,
  startNewTemplate,
  startPage,
} from './template-mgmt-e2e-common-steps';

export type LetterType = 'x0' | 'x1' | 'q4' | 'language';

export type AuthoringLetterInputs = {
  name: string;
  letterType: LetterType;
  campaign: {
    multiCampaignClient: boolean;
    campaignId: string;
  };
  fileName: string;
  letterVariantName: string;
  language?: string;
};

export type AuthoringLetterUpdates = {
  name?: string;
  campaignId?: string;
};

type AuthoringLetterPreviewData = {
  name: string;
  letterType: LetterType;
  campaignId: string;
  letterVariantName: string;
  language?: string;
};

export type AuthoringLetterPersonalisation = {
  recipient: string;
  customPersonalisation: Record<string, string>;
};

type LetterTypeTextMap = Record<
  'slug' | 'chooseOption' | 'createPageHeader' | 'previewType',
  string
>;

const getLetterTypeTextMap = (type: LetterType, language?: string) => {
  const mapping: Record<LetterType, LetterTypeTextMap> = {
    x0: {
      slug: 'standard-english',
      chooseOption: 'Standard English',
      createPageHeader: 'a standard English',
      previewType: 'Standard letter',
    },
    x1: {
      slug: 'large-print',
      chooseOption: 'Large print',
      createPageHeader: 'a large print',
      previewType: 'Large print letter',
    },
    q4: {
      slug: 'british-sign-language',
      chooseOption: 'British Sign Language',
      createPageHeader: 'a British Sign Language',
      previewType: 'British Sign Language letter',
    },
    language: {
      slug: 'other-language',
      chooseOption: 'Other language',
      createPageHeader: 'an other language',
      previewType: `Standard letter - ${language}`,
    },
  };
  return mapping[type];
};

function createAuthoringLetterTemplate(
  { basePage }: CommonStepsProps,
  inputs: AuthoringLetterInputs
) {
  return test.step('Create template', async () => {
    const typeTextMap = getLetterTypeTextMap(
      inputs.letterType,
      inputs.language
    );

    await expect(basePage.page).toHaveURL(
      `/templates/upload-${typeTextMap.slug}-letter-template`
    );

    await expect(basePage.pageHeader).toHaveText(
      `Upload ${typeTextMap.createPageHeader} letter template`
    );

    await basePage.fillTextBox('Template name', inputs.name);

    if (inputs.campaign.multiCampaignClient) {
      await basePage.selectOption('Campaign', inputs.campaign.campaignId);
    } else {
      await expect(
        basePage.page.getByTestId('single-campaign-id-text')
      ).toHaveText(inputs.campaign.campaignId);
    }

    if (inputs.letterType === 'language' && inputs.language) {
      await basePage.selectOption('Template language', inputs.language);
    }

    await basePage.setFileInput('Template file', inputs.fileName);

    await basePage.clickButtonByName('Upload letter template file');
  });
}

function waitForLetterTemplateSpinner({ basePage }: CommonStepsProps) {
  return test.step('wait for docx letter template spinner', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/preview-letter-template\/(.*)/
    );

    const spinner = basePage.page.getByRole('heading', {
      name: 'Uploading letter template',
    });

    await expect(spinner).toBeVisible();

    await expect(spinner).toBeHidden({ timeout: 30_000 });
  });
}

function checkAuthoringTemplateDetailsTable(
  { basePage }: CommonStepsProps,
  template: AuthoringLetterPreviewData,
  expectedStatus: string,
  expectLinks: boolean
) {
  const typeTextMap = getLetterTypeTextMap(
    template.letterType,
    template.language
  );
  return test.step('preview authoring letter template details', async () => {
    await expect(basePage.getSummaryListValue('Template type')).toHaveText(
      typeTextMap.previewType
    );

    await expect(basePage.getSummaryListValue('Campaign')).toHaveText(
      template.campaignId
    );
    await expect(
      basePage.getSummaryListValue('Printing and postage')
    ).toHaveText(template.letterVariantName);

    await expect(basePage.getSummaryListValue('Status')).toHaveText(
      expectedStatus
    );

    const links = [
      basePage.page.getByRole('link', {
        name: 'Edit name',
      }),

      basePage.page.getByRole('link', {
        name: 'Edit campaign',
      }),

      basePage.page.getByRole('link', {
        name: 'Edit printing and postage',
      }),
    ];

    for (const link of links) {
      if (expectLinks) {
        expect(link).toBeVisible();
      } else {
        expect(link).toBeHidden();
      }
    }
  });
}

async function previewAuthoringLetterDraft(
  props: CommonStepsProps,
  template: AuthoringLetterPreviewData
) {
  await previewPage(props, 'letter', template.name);

  await checkAuthoringTemplateDetailsTable(
    props,
    template,
    'Approval needed',
    true
  );
}

function editTemplateName(
  { basePage }: CommonStepsProps,
  oldName: string,
  newName: string
) {
  return test.step('edit template name', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/edit-template-name\/(.*)/
    );

    await expect(basePage.pageHeader).toHaveText('Edit template name');

    await expect(basePage.page.getByLabel('Edit template name')).toHaveValue(
      oldName
    );

    await basePage.fillTextBox('Edit template name', newName);

    await basePage.clickButtonByName('Save changes');
  });
}

function editTemplateCampaign(
  { basePage }: CommonStepsProps,
  oldCampaign: string,
  newCampaign: string
) {
  return test.step('edit template campaign', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/edit-template-campaign\/(.*)/
    );

    await expect(basePage.pageHeader).toHaveText('Edit template campaign');

    await expect(
      basePage.page.getByLabel('Edit template campaign')
    ).toHaveValue(oldCampaign);

    await basePage.selectOption('Edit template campaign', newCampaign);

    await basePage.clickButtonByName('Save changes');
  });
}

function editTemplatePostage(
  { basePage }: CommonStepsProps,
  letterVariantName: string
) {
  return test.step('edit template printing and postage', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/choose-printing-and-postage\/(.*)/
    );

    await basePage.checkRadio(letterVariantName);

    await basePage.clickButtonByName('Save and continue');
  });
}

function renderLetterPreview(
  { basePage }: CommonStepsProps,
  tab: string,
  personalisation: AuthoringLetterPersonalisation
) {
  return test.step(`render letter preview - ${tab}`, async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/preview-letter-template\/(.*)/
    );

    await basePage.page.getByRole('tab', { name: tab }).click();

    const tabPanel = basePage.page.getByRole('tabpanel', { name: tab });

    expect(tabPanel).toBeVisible();

    const iframe = tabPanel.locator('iframe');

    const spinner = tabPanel
      .getByRole('status')
      .filter({ hasText: 'Loading letter preview' });

    await expect(iframe).toBeVisible();
    await expect(spinner).toBeHidden();

    await tabPanel
      .getByLabel('Example recipient')
      .selectOption(personalisation.recipient);

    for (const [label, value] of Object.entries(
      personalisation.customPersonalisation
    )) {
      await tabPanel.getByLabel(label).fill(value);
    }

    await tabPanel.getByRole('button', { name: 'Update preview' }).click();

    await expect(iframe).toBeHidden();
    await expect(spinner).toBeVisible();

    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(spinner).toBeHidden();
  });
}

function getReadyToApproveLetterTemplate(
  { basePage }: CommonStepsProps,
  name: string
) {
  return test.step('get ready to approve letter template', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/preview-letter-template\/(.*)/
    );

    await expect(basePage.pageHeader).toHaveText(
      `Get ready to approve '${name}'`
    );

    await basePage.clickButtonByName('Continue');
  });
}

function reviewAndApproveLetterTemplate(
  { basePage }: CommonStepsProps,
  template: AuthoringLetterPreviewData
) {
  return test.step('review and approve letter template', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/review-and-approve-letter-template\/(.*)/
    );

    await expect(basePage.pageHeader).toHaveText(
      `Review and approve '${template.name}'`
    );

    await checkAuthoringTemplateDetailsTable(
      { basePage },
      template,
      'Approval needed',
      false
    );

    expect(await basePage.page.locator('iframe').count()).toBe(2);

    await basePage.clickButtonByName('Approve letter template');
  });
}

function letterTemplateApproved({ basePage }: CommonStepsProps, name: string) {
  return test.step('letter template approved', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/review-and-approve-letter-template\/(.*)/
    );

    await expect(basePage.pageHeader).toHaveText('Letter template approved');

    await expect(basePage.page.getByTestId('template-name')).toHaveText(name);
  });
}

async function previewAuthoringLetterApproved(
  props: CommonStepsProps,
  template: AuthoringLetterPreviewData
) {
  await previewPage(props, 'approved-letter', template.name);

  await checkAuthoringTemplateDetailsTable(props, template, 'Approved', false);
}

export async function createAndApproveAuthoringLetter(
  props: CommonStepsProps,
  initialInputs: AuthoringLetterInputs,
  shortPersonalisation: AuthoringLetterPersonalisation,
  longPersonalisation: AuthoringLetterPersonalisation,
  updates: AuthoringLetterUpdates = {}
) {
  const { basePage } = props;

  const typeTextMap = getLetterTypeTextMap(
    initialInputs.letterType,
    initialInputs.language
  );

  const letterState: AuthoringLetterPreviewData = {
    name: initialInputs.name,
    campaignId: initialInputs.campaign.campaignId,
    letterType: initialInputs.letterType,
    letterVariantName: '',
    language: initialInputs.language,
  };

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, 'Letter', typeTextMap.chooseOption);
  await createAuthoringLetterTemplate(props, initialInputs);
  await waitForLetterTemplateSpinner(props);
  await previewAuthoringLetterDraft(props, letterState);

  if (updates.name) {
    await basePage.clickLinkByName('Edit name');

    await editTemplateName(props, letterState.name, updates.name);

    letterState.name = updates.name;

    await previewAuthoringLetterDraft(props, letterState);
  }

  if (initialInputs.campaign.multiCampaignClient && updates.campaignId) {
    await basePage.clickLinkByName('Edit campaign');

    await editTemplateCampaign(
      props,
      letterState.campaignId,
      updates.campaignId
    );

    letterState.campaignId = updates.campaignId;

    await previewAuthoringLetterDraft(props, letterState);
  }

  await basePage.clickLinkByName('Edit printing and postage');

  await editTemplatePostage(props, initialInputs.letterVariantName);

  letterState.letterVariantName = initialInputs.letterVariantName;

  await previewAuthoringLetterDraft(props, letterState);

  await renderLetterPreview(props, 'Short examples', shortPersonalisation);

  await renderLetterPreview(props, 'Long examples', longPersonalisation);

  await basePage.clickButtonByName('Approve template');

  await getReadyToApproveLetterTemplate(props, letterState.name);

  await reviewAndApproveLetterTemplate(props, letterState);

  await letterTemplateApproved(props, letterState.name);

  await basePage.clickNavigationLink('Templates');

  await expect(basePage.page).toHaveURL(/\/templates\/message-templates$/);

  await basePage.clickLinkByName(letterState.name, { exact: true });

  await previewAuthoringLetterApproved(props, letterState);
}
