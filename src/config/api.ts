export const developmentUrl = 'http://localhost:3007';
export const productionUrl = 'https://btc-mining-webapp.lightningfaucet.us:443';
export const productionMainnetUrl = 'https://backend.winabitco.in:443';

const getInitialBaseUrl = () => {
  // In development mode, check localStorage for persisted backend selection
  if (!import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || productionUrl;
  }

  // Check if localStorage is available (browser context)
  if (typeof localStorage === 'undefined') {
    console.warn("localStorage is not available, using developmentUrl");
    return import.meta.env.VITE_API_URL || developmentUrl;
  }

  const persistedBackend = localStorage.getItem('selectedBackend');
  if (!persistedBackend) {
    return import.meta.env.VITE_API_URL || developmentUrl;
  }

  switch (persistedBackend) {
  case 'localhost':
    return developmentUrl;
  case 'production':
    return productionUrl;
  case 'mainnet':
    return productionMainnetUrl;
  default:
    return import.meta.env.VITE_API_URL || developmentUrl;
  }
};

const initialBaseUrl = getInitialBaseUrl();

const API_CONFIG = {
  baseUrl: initialBaseUrl
};

export default API_CONFIG;
