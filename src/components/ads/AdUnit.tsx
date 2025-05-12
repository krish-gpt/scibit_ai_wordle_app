import { useEffect } from 'react';

interface AdUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdUnit = ({ adSlot, adFormat = 'auto', style, className }: AdUnitProps) => {
  useEffect(() => {
    try {
      // Push the ad only if adsbygoogle is defined
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.error('Error loading AdSense ad:', err);
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID) {
    console.warn('AdSense publisher ID not found in environment variables');
    return null;
  }

  return (
    <ins
      className={`adsbygoogle ${className || ''}`}
      style={{
        display: 'block',
        textAlign: 'center',
        ...style,
      }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  );
};

export default AdUnit; 