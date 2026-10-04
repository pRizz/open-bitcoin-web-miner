/** Public production identity and deployment resources; never store credentials here. */
export const productionSite = {
  host: 'win3bitcoin.com',
  origin: 'https://win3bitcoin.com',
  brand: 'Win3Bitcoin.com',
  awsRegion: 'us-east-2',
  bucket: 'www.winabitco.in',
  appDistributionId: 'E3GD8ZGWCJI0MH',
  redirectDistributionId: 'EVH2SH6YOOO76',
  appAliases: ['win3bitcoin.com', 'www.win3bitcoin.com'],
  redirectAliases: ['win3bitco.in', 'www.win3bitco.in', 'winabitco.in', 'www.winabitco.in'],
  hostedZones: {
    'win3bitcoin.com': 'Z08277702OW6CHIB80X2Y',
    'win3bitco.in': 'Z08292653Q242MKWX2OYY',
    'winabitco.in': 'Z047582630HIUSQMT1N67',
  },
} as const;
