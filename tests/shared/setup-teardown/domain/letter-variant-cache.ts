import {
  getLambdaEnvironmentVariables,
  setLambdaEnvironmentVariables,
} from '../util';

export async function getLetterVariantCacheTTL(env: string) {
  const vars = await getLambdaEnvironmentVariables(
    `nhs-notify-${env}-app-get-template-letter-variants`
  );

  return vars.LETTER_VARIANT_CACHE_TTL_MS;
}

export async function setLetterVariantCacheTTL(env: string, ttl: string) {
  await setLambdaEnvironmentVariables(
    `nhs-notify-${env}-app-get-template-letter-variants`,
    {
      LETTER_VARIANT_CACHE_TTL_MS: ttl,
    }
  );
}
