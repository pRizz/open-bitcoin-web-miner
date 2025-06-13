const developmentUrl = 'http://localhost:3007';
const productionUrl = 'https://btc-mining-webapp.lightningfaucet.us:443';
const initialBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? developmentUrl : productionUrl);

const API_CONFIG = {
  baseUrl: initialBaseUrl
};

export default API_CONFIG;
