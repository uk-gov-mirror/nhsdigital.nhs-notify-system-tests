import { randomUUID } from 'node:crypto';

export const LetterVariantFactory = {
  create: ({ name }: { name: string }) => {
    const id = randomUUID();
    return {
      PK: `VARIANT#${id}`,
      SK: 'METADATA',
      ByScopeIndexPK: 'GLOBAL',
      ByScopeIndexSK: `STANDARD#PROD#${id}`,
      bothSides: true,
      dispatchTime: 'standard',
      envelopeSize: 'C4',
      id,
      maxSheets: 20,
      name,
      postage: 'economy',
      printColour: 'black',
      sheetSize: 'A4',
      status: 'PROD',
      type: 'STANDARD',
    };
  },
};
