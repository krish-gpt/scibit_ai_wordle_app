export const ADSENSE_CONFIG = {
  // Replace these with your actual AdSense IDs
  CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX',
  RESULTS_AD_SLOT: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || 'XXXXXXXXXX',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

// This can be imported directly in _document.tsx
export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.CLIENT_ID}`; 