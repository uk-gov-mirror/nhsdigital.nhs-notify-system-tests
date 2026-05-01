import { test } from '@playwright/test';
import { clients } from '../../fixtures/clients';
import {
  getLetterVariant,
  GLOBAL_LETTER_VARIANT_KEY,
} from '../../fixtures/letter-variants';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  AuthoringLetterInputs,
  AuthoringLetterUpdates,
  createAndApproveAuthoringLetter,
} from '../../steps/letter-authoring';
import { createAndSubmitMessagePlan } from '../../steps/message-plans';

test.use({ storageState: 'login-state/letterAuthoringEnabled.json' });

type LetterJourney = {
  initialInputs: AuthoringLetterInputs;
  updates?: AuthoringLetterUpdates;
};

test('create and approve a letter template of each type and use them in a message plan', async ({
  page,
}) => {
  test.setTimeout(1000 * 60 * 5);

  const basePage = new TemplateMgmtBasePage(page);

  const [campaign1, campaign2] =
    clients.LetterAuthoringEnabledProduct.templates.campaignIds;

  const props = { basePage };

  const letterVariant = await getLetterVariant(GLOBAL_LETTER_VARIANT_KEY);

  const standard: LetterJourney = {
    initialInputs: {
      name: 'letter template e2e test - standard english letter',
      campaign: { multiCampaignClient: true, campaignId: campaign1 },
      letterType: 'x0',
      fileName: 'letter-template-nhs-notify.docx',
      letterVariantName: letterVariant.name,
      shortPersonalisation: {
        recipient: 'Jo Bloggs',
        customPersonalisation: {
          gpSurgeryName: 'The Waiting Room',
          gpSurgeryAddress: '42 Little Lane, Snodsbury',
          gpSurgeryPhone: '0123456789',
        },
      },
      longPersonalisation: {
        recipient: 'Sir William Alexander Fitzgerald',
        customPersonalisation: {
          gpSurgeryName:
            'The Waiting Room Family Medical Practice and Community Health Centre',
          gpSurgeryAddress:
            'The Waiting Room Medical Practice, 1234 Unnecessarily Elaborate Boulevard, Little Puddlington-in-the-Marsh, Greater Nowhere-upon-Hill, ZX0 0ZZ, United Kingdom',
          gpSurgeryPhone: '+44 (0)123 456 7890 ext. 404',
        },
      },
    },
    updates: {
      name: 'letter template e2e test - standard english letter - updated name',
      campaignId: campaign2,
    },
  };

  const largePrint: LetterJourney = {
    initialInputs: {
      name: 'letter template e2e test - large print letter',
      campaign: { multiCampaignClient: true, campaignId: campaign2 },
      letterType: 'x1',
      fileName: 'letter-template-nhs-notify-large-print.docx',
      letterVariantName: letterVariant.name,
      shortPersonalisation: {
        recipient: 'Jo Bloggs',
        customPersonalisation: {
          gpSurgery: 'The Waiting Room',
          appointmentDate: '01/05/2026',
        },
      },
      longPersonalisation: {
        recipient: 'Sir William Alexander Fitzgerald',
        customPersonalisation: {
          gpSurgery:
            'The Waiting Room Family Medical Practice and Community Health Centre',
          appointmentDate:
            'a Friday, it being the first day of the month of May in the year of our Lord two thousand and twenty six',
        },
      },
    },
  };

  const bsl: LetterJourney = {
    initialInputs: {
      name: 'letter template e2e test - bsl letter',
      campaign: { multiCampaignClient: true, campaignId: campaign2 },
      letterType: 'q4',
      fileName: 'letter-template-nhs-notify.docx',
      letterVariantName: letterVariant.name,
      shortPersonalisation: {
        recipient: 'Jo Bloggs',
        customPersonalisation: {
          gpSurgeryName: 'The Waiting Room',
          gpSurgeryAddress: '42 Little Lane, Snodsbury',
          gpSurgeryPhone: '0123456789',
        },
      },
      longPersonalisation: {
        recipient: 'Sir William Alexander Fitzgerald',
        customPersonalisation: {
          gpSurgeryName:
            'The Waiting Room Family Medical Practice and Community Health Centre',
          gpSurgeryAddress:
            'The Waiting Room Medical Practice, 1234 Unnecessarily Elaborate Boulevard, Little Puddlington-in-the-Marsh, Greater Nowhere-upon-Hill, ZX0 0ZZ, United Kingdom',
          gpSurgeryPhone: '+44 (0)123 456 7890 ext. 404',
        },
      },
    },
  };

  const italian: LetterJourney = {
    initialInputs: {
      name: 'letter template e2e test - italian letter',
      campaign: { multiCampaignClient: true, campaignId: campaign2 },
      letterType: 'language',
      fileName: 'letter-template-nhs-notify-other-language.docx',
      letterVariantName: letterVariant.name,
      language: 'Italian',
      shortPersonalisation: {
        recipient: 'Jo Bloggs',
        customPersonalisation: {
          gpSurgery: 'The Waiting Room',
          appointmentDate: '01/05/2026',
        },
      },
      longPersonalisation: {
        recipient: 'Sir William Alexander Fitzgerald',
        customPersonalisation: {
          gpSurgery:
            'The Waiting Room Family Medical Practice and Community Health Centre',
          appointmentDate:
            'a Friday, it being the first day of the month of May in the year of our Lord two thousand and twenty six',
        },
      },
    },
  };

  const urdu: LetterJourney = {
    initialInputs: {
      name: 'letter template e2e test - urdu letter',
      campaign: { multiCampaignClient: true, campaignId: campaign2 },
      letterType: 'language',
      fileName: 'letter-template-nhs-notify-other-language.docx',
      letterVariantName: letterVariant.name,
      language: 'Urdu',
      shortPersonalisation: {
        recipient: 'Jo Bloggs',
        customPersonalisation: {
          gpSurgery: 'The Waiting Room',
          appointmentDate: '01/05/2026',
        },
      },
      longPersonalisation: {
        recipient: 'Sir William Alexander Fitzgerald',
        customPersonalisation: {
          gpSurgery:
            'The Waiting Room Family Medical Practice and Community Health Centre',
          appointmentDate:
            'a Friday, it being the first day of the month of May in the year of our Lord two thousand and twenty six',
        },
      },
    },
  };

  for (const { initialInputs, updates } of [
    standard,
    largePrint,
    bsl,
    italian,
    urdu,
  ]) {
    await createAndApproveAuthoringLetter(props, initialInputs, updates);
  }

  await createAndSubmitMessagePlan(
    props,
    {
      messageOrder: 'Letter only',
      name: 'letter authoring test message plan',
      campaign: {
        multiCampaignClient: true,
        campaignId: campaign2,
      },
      templates: {
        letters: {
          standard: standard.updates!.name!,
          largePrint: largePrint.initialInputs.name,
          bsl: bsl.initialInputs.name,
          languages: [italian.initialInputs.name, urdu.initialInputs.name],
        },
      },
    },
    { name: 'letter authoring test message plan - new name' }
  );
});
