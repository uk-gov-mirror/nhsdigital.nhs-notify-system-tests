import z from 'zod';
import { templatesStateFile } from '../lifecycle/templates/state';

const $LetterVariant = z.object({
  name: z.string(),
});

export const GLOBAL_LETTER_VARIANT_KEY = 'global-letter-variant';

export async function getLetterVariant(key: string) {
  const stateFile = await templatesStateFile();

  return stateFile.getValue('letterVariants', key, $LetterVariant);
}
