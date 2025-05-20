'use client';

import Script from 'next/script';

interface AdSenseScriptProps {
  publisherId: string;
}

const AdSenseScript = ({ publisherId }: AdSenseScriptProps) => {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
      onError={(e) => {
        console.error('Error loading AdSense:', e);
      }}
    />
  );
};

export default AdSenseScript; 