import { expect, test } from 'playwright/test';
import { CommonStepsProps } from './template-mgmt-e2e-common-steps';
import { LetterType } from './letter-authoring';

type TemplateType = 'nhsapp' | 'email' | 'sms' | 'letter';

type MessagePlanTemplates = {
  nhsapp?: string;
  email?: string;
  sms?: string;
  letters?: {
    standard: string;
    largePrint?: string;
    bsl?: string;
    languages?: string[];
  };
};

type MessagePlanInputs = {
  messageOrder: string;
  name: string;
  campaign: {
    multiCampaignClient: boolean;
    campaignId: string;
  };
  templates: MessagePlanTemplates;
};

type MessagePlanUpdates = {
  name?: string;
};

type MessagePlanState = {
  name: string;
  campaignId: string;
  status: string;
  templates: MessagePlanTemplates;
};

type TemplateTypeTextMap = Record<
  'slug' | 'chooseLink' | 'chooseHeader',
  string
>;

const getLetterTypeTextMap = (letterType: LetterType): TemplateTypeTextMap => {
  return {
    x0: {
      slug: 'standard-english-letter',
      chooseLink: 'Choose Standard English letter template',
      chooseHeader: 'Choose a standard English letter template',
    },
    x1: {
      slug: 'large-print-letter',
      chooseLink: 'Choose Large print letter template',
      chooseHeader: 'Choose a large print letter template',
    },
    q4: {
      slug: 'british-sign-language-letter',
      chooseLink: 'Choose British Sign Language letter template',
      chooseHeader: 'Choose a British Sign Language letter template',
    },
    language: {
      slug: 'other-language-letter',
      chooseLink: 'Choose Other language letters templates',
      chooseHeader: 'Choose other language letter templates',
    },
  }[letterType];
};

function getTemplateTypeTextMap(
  type: TemplateType,
  letterType: LetterType = 'x0'
): TemplateTypeTextMap {
  if (type === 'letter') {
    return getLetterTypeTextMap(letterType);
  }

  return {
    nhsapp: {
      slug: 'nhs-app',
      chooseLink: 'Choose NHS App template',
      chooseHeader: 'Choose an NHS App template',
    },
    email: {
      slug: 'email',
      chooseLink: 'Choose Email template',
      chooseHeader: 'Choose an email template',
    },
    sms: {
      slug: 'text-message',
      chooseLink: 'Choose Text Message (SMS) template',
      chooseHeader: 'Choose a text message (SMS) template',
    },
  }[type];
}

function messagePlansListPage({ basePage }: CommonStepsProps) {
  return test.step('message plans list page', async () => {
    await expect(basePage.page).toHaveURL('/templates/message-plans');

    await expect(basePage.pageHeader).toHaveText('Message plans');
  });
}

function chooseMessageOrder(
  { basePage }: CommonStepsProps,
  messageOrder: string
) {
  return test.step('choose message order', async () => {
    await expect(basePage.page).toHaveURL(
      '/templates/message-plans/choose-message-order'
    );

    await expect(basePage.pageHeader).toHaveText('Choose a message order');

    await basePage.checkRadio(messageOrder);

    await basePage.clickButtonByName('Save and continue');
  });
}

function createMessagePlan(
  { basePage }: CommonStepsProps,
  inputs: MessagePlanInputs
) {
  return test.step('create message plan page', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/create-message-plan\?messageOrder=(.*)/
    );

    await expect(basePage.pageHeader).toHaveText('Create a message plan');

    await basePage.fillTextBox('Message plan name', inputs.name);

    if (inputs.campaign.multiCampaignClient) {
      await basePage.selectOption('Campaign', inputs.campaign.campaignId);
    } else {
      await expect(basePage.page.getByTestId('single-campaign-id')).toHaveText(
        inputs.campaign.campaignId
      );
    }

    await basePage.clickButtonByName('Save and continue');
  });
}

function getSelectedTemplateNamesEditPage(
  { basePage }: CommonStepsProps,
  testId: string
) {
  return basePage.page
    .getByTestId(`channel-template-${testId}`)
    .getByTestId('template-names');
}

function messagePlanDraft(
  props: CommonStepsProps,
  expectedState: MessagePlanState
) {
  const { basePage } = props;
  return test.step('draft message plan page', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/edit-message-plan\/(.*)/
    );

    await expect(basePage.pageHeader).toHaveText(expectedState.name);

    await expect(basePage.getSummaryListValue('Campaign')).toHaveText(
      expectedState.campaignId
    );

    await expect(basePage.getSummaryListValue('Status')).toHaveText(
      expectedState.status
    );

    if (expectedState.templates.nhsapp) {
      await expect(
        getSelectedTemplateNamesEditPage(props, 'NHSAPP')
      ).toHaveText(expectedState.templates.nhsapp);
    }

    if (expectedState.templates.email) {
      expect(getSelectedTemplateNamesEditPage(props, 'EMAIL')).toHaveText(
        expectedState.templates.email
      );
    }

    if (expectedState.templates.sms) {
      expect(getSelectedTemplateNamesEditPage(props, 'SMS')).toHaveText(
        expectedState.templates.sms
      );
    }

    if (expectedState.templates.letters) {
      const { letters } = expectedState.templates;

      expect(getSelectedTemplateNamesEditPage(props, 'LETTER')).toHaveText(
        letters.standard
      );

      if (letters.largePrint) {
        expect(getSelectedTemplateNamesEditPage(props, 'x1')).toHaveText(
          letters.largePrint
        );
      }

      if (letters.bsl) {
        expect(getSelectedTemplateNamesEditPage(props, 'q4')).toHaveText(
          letters.bsl
        );
      }

      if (letters.languages) {
        const templateNames = getSelectedTemplateNamesEditPage(
          props,
          'foreign-language'
        );
        for (const languageTemplate of letters.languages) {
          expect(templateNames).toHaveText(languageTemplate);
        }
      }
    }
  });
}

function editMessagePlanName(
  { basePage }: CommonStepsProps,
  oldName: string,
  newName: string
) {
  return test.step('edit message plan name', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/edit-message-plan\/(.*)/
    );

    await basePage.clickLinkByName('Rename message plan');

    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/rename-message-plan\/(.*)/
    );

    await expect(basePage.pageHeader).toHaveText('Rename message plan');

    await expect(basePage.page.getByLabel('Message plan name')).toHaveValue(
      oldName
    );

    await basePage.fillTextBox('Message plan name', newName);

    await basePage.clickButtonByName('Save and continue');
  });
}

function chooseTemplate(
  { basePage }: CommonStepsProps,
  templateName: string,
  templateType: TemplateType,
  letterType?: LetterType
) {
  return test.step(`choose message plan template - ${letterType ?? templateType}`, async () => {
    const textMappings = getTemplateTypeTextMap(templateType, letterType);

    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/edit-message-plan\/(.*)/
    );

    await basePage.clickLinkByName(textMappings.chooseLink);

    await expect(basePage.page).toHaveURL(
      new RegExp(
        `/templates/message-plans/choose-${textMappings.slug}-template/(.*)`
      )
    );

    await expect(basePage.pageHeader).toHaveText(textMappings.chooseHeader);

    await basePage.checkRadio(templateName);

    await basePage.clickButtonByName('Save and continue');
  });
}

function chooseLanguageLetterTemplates(
  { basePage }: CommonStepsProps,
  templateNames: string[]
) {
  return test.step('choose message plan template - languages', async () => {
    const textMappings = getTemplateTypeTextMap('letter', 'language');

    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/edit-message-plan\/(.*)/
    );

    await basePage.clickLinkByName(textMappings.chooseLink);

    await expect(basePage.page).toHaveURL(
      new RegExp(
        `/templates/message-plans/choose-${textMappings.slug}-template/(.*)`
      )
    );

    await expect(basePage.pageHeader).toHaveText(textMappings.chooseHeader);

    for (const templateName of templateNames) {
      await basePage.checkCheckbox(templateName);
    }

    await basePage.clickButtonByName('Save and continue');
  });
}

function getReadyToMoveToProduction(
  { basePage }: CommonStepsProps,
  { name }: MessagePlanState
) {
  return test.step('get ready to move to production', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/get-ready-to-move\/(.*)/
    );

    await expect(basePage.getSummaryListValue('Name')).toHaveText(name);

    await basePage.clickButtonByName('Continue');
  });
}

function getSelectedTemplateNamesReviewPage(
  { basePage }: CommonStepsProps,
  heading: string
) {
  return basePage.page
    .getByTestId('channel-card')
    .filter({
      has: basePage.page.getByRole('heading', { level: 3, name: heading }),
    })
    .getByTestId('template-name');
}

function reviewAndMoveToProduction(
  props: CommonStepsProps,
  { name, templates }: MessagePlanState
) {
  const { basePage } = props;

  return test.step('review and move to production', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/review-and-move-to-production\/(.*)/
    );

    await expect(basePage.getSummaryListValue('Name')).toHaveText(name);

    if (templates.nhsapp) {
      await expect(
        getSelectedTemplateNamesReviewPage(props, 'NHS App')
      ).toHaveText(templates.nhsapp);
    }

    if (templates.email) {
      expect(getSelectedTemplateNamesReviewPage(props, 'Email')).toHaveText(
        templates.email
      );
    }

    if (templates.sms) {
      expect(
        getSelectedTemplateNamesReviewPage(props, 'Text message (SMS)')
      ).toHaveText(templates.sms);
    }

    if (templates.letters) {
      const { letters } = templates;

      expect(
        getSelectedTemplateNamesReviewPage(props, 'Standard English letter')
      ).toHaveText(letters.standard);

      if (letters.largePrint) {
        expect(
          getSelectedTemplateNamesReviewPage(props, 'Large print letter')
        ).toHaveText(letters.largePrint);
      }

      if (letters.bsl) {
        expect(
          getSelectedTemplateNamesReviewPage(
            props,
            'British Sign Language letter'
          )
        ).toHaveText(letters.bsl);
      }

      if (letters.languages) {
        const templateNames = getSelectedTemplateNamesReviewPage(
          props,
          'Other language letters'
        );
        for (const languageTemplate of letters.languages) {
          expect(templateNames).toHaveText(languageTemplate);
        }
      }
    }

    await basePage.clickButtonByName('Move to production');
  });
}

function selectMessagePlanFromList(
  { basePage }: CommonStepsProps,
  { name, status }: MessagePlanState
) {
  return test.step('select message plan from list', async () => {
    await expect(basePage.page).toHaveURL('/templates/message-plans');

    const section = basePage.page.getByTestId(
      `message-plans-list-${status.toLowerCase()}`
    );

    if ((await section.getAttribute('open')) !== 'true') {
      await section.click();
    }

    await basePage.clickLinkByName(name);
  });
}

function previewProductionMessagePlan(
  props: CommonStepsProps,
  { name, campaignId, status, templates }: MessagePlanState
) {
  const { basePage } = props;

  return test.step('preview production message plan', async () => {
    await expect(basePage.page).toHaveURL(
      /\/templates\/message-plans\/preview-message-plan\/(.*)/
    );

    await expect(basePage.pageHeader).toHaveText(name);

    await expect(basePage.getSummaryListValue('Campaign')).toHaveText(
      campaignId
    );

    await expect(basePage.getSummaryListValue('Status')).toHaveText(status);

    if (templates.nhsapp) {
      await expect(
        getSelectedTemplateNamesReviewPage(props, 'NHS App')
      ).toHaveText(templates.nhsapp);
    }

    if (templates.email) {
      expect(getSelectedTemplateNamesReviewPage(props, 'Email')).toHaveText(
        templates.email
      );
    }

    if (templates.sms) {
      expect(
        getSelectedTemplateNamesReviewPage(props, 'Text message (SMS)')
      ).toHaveText(templates.sms);
    }

    if (templates.letters) {
      const { letters } = templates;

      expect(
        getSelectedTemplateNamesReviewPage(props, 'Standard English letter')
      ).toHaveText(letters.standard);

      if (letters.largePrint) {
        expect(
          getSelectedTemplateNamesReviewPage(props, 'Large print letter')
        ).toHaveText(letters.largePrint);
      }

      if (letters.bsl) {
        expect(
          getSelectedTemplateNamesReviewPage(
            props,
            'British Sign Language letter'
          )
        ).toHaveText(letters.bsl);
      }

      if (letters.languages) {
        const templateNames = getSelectedTemplateNamesReviewPage(
          props,
          'Other language letters'
        );
        for (const languageTemplate of letters.languages) {
          expect(templateNames).toHaveText(languageTemplate);
        }
      }
    }
  });
}

export async function createAndSubmitMessagePlan(
  props: CommonStepsProps,
  inputs: MessagePlanInputs,
  updates: MessagePlanUpdates = {}
) {
  const { basePage } = props;

  await basePage.clickNavigationLink('Message plans');

  await messagePlansListPage(props);

  await basePage.clickButtonByName('New message plan');

  await chooseMessageOrder(props, inputs.messageOrder);

  await createMessagePlan(props, inputs);

  const expectedState: MessagePlanState = {
    name: inputs.name,
    campaignId: inputs.campaign.campaignId,
    status: 'Draft',
    templates: {},
  };

  await messagePlanDraft(props, expectedState);

  if (updates.name) {
    await editMessagePlanName(props, expectedState.name, updates.name);
    expectedState.name = updates.name;
  }

  if (inputs.templates.nhsapp) {
    await chooseTemplate(props, inputs.templates.nhsapp, 'nhsapp');
    expectedState.templates.nhsapp = inputs.templates.nhsapp;
  }

  if (inputs.templates.email) {
    await chooseTemplate(props, inputs.templates.email, 'email');
    expectedState.templates.email = inputs.templates.email;
  }

  if (inputs.templates.sms) {
    await chooseTemplate(props, inputs.templates.sms, 'sms');
    expectedState.templates.sms = inputs.templates.sms;
  }

  if (inputs.templates.letters) {
    const { letters } = inputs.templates;

    await chooseTemplate(props, letters.standard, 'letter', 'x0');

    expectedState.templates.letters = {
      ...expectedState.templates.letters,
      standard: letters.standard,
    };

    if (letters.largePrint) {
      await chooseTemplate(props, letters.largePrint, 'letter', 'x1');

      expectedState.templates.letters = {
        ...expectedState.templates.letters,
        largePrint: letters.largePrint,
      };
    }

    if (letters.bsl) {
      await chooseTemplate(props, letters.bsl, 'letter', 'q4');

      expectedState.templates.letters = {
        ...expectedState.templates.letters,
        bsl: letters.bsl,
      };
    }

    if (letters.languages) {
      await chooseLanguageLetterTemplates(props, letters.languages);

      expectedState.templates.letters = {
        ...expectedState.templates.letters,
        languages: letters.languages,
      };
    }

    await messagePlanDraft(props, expectedState);

    await basePage.clickButtonByName('Move to production');

    await getReadyToMoveToProduction(props, expectedState);
    await reviewAndMoveToProduction(props, expectedState);

    expectedState.status = 'Production';

    await selectMessagePlanFromList(props, expectedState);

    await previewProductionMessagePlan(props, expectedState);
  }
}
