export type StaticClientConfig = {
  templates: {
    campaignIds: string[];
    features?: {
      proofing?: boolean;
      routing?: boolean;
      legacyLetters?: boolean;
      letterAuthoring?: boolean;
    };
  };
  auth: {
    name: string;
  };
};

export type StaticUserConfig = {
  clientKey: string;
  clientConfig: StaticClientConfig['auth'];
};
