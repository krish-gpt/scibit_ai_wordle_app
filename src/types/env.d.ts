declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Google Cloud
      GOOGLE_CLOUD_PROJECT: string;
      GOOGLE_APPLICATION_CREDENTIALS: string;

      // Firebase
      FIREBASE_DATABASE_ID: string;
      
      // Firebase Secret Names
      FIREBASE_API_KEY_SECRET: string;
      FIREBASE_APP_ID_SECRET: string;
      FIREBASE_AUTH_DOMAIN_SECRET: string;
      FIREBASE_PROJECT_ID_SECRET: string;

      // Google AdSense (optional)
      NEXT_PUBLIC_ADSENSE_PUBLISHER_ID?: string;
      NEXT_PUBLIC_ADSENSE_SLOT_RESULTS?: string;
    }
  }
}

export {}; 