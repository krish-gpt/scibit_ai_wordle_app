import { useEffect, useRef } from 'react';

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
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const loadAd = () => {
      try {
        // Only push if adsbygoogle exists and we have a valid ref
        if (window.adsbygoogle && adRef.current) {
          window.adsbygoogle.push({});
        }
      } catch (err) {
        console.error('Error loading AdSense ad:', err);
      }
    };

    // Load ad when component mounts
    loadAd();

    // Clean up and reload ad if slot changes
    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [adSlot]); // Reload when slot changes

  if (!process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden">
      <ins
        ref={adRef}
        className={`adsbygoogle ${className || ''}`}
        style={{
          display: 'block',
          overflow: 'hidden',
          ...style,
        }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdUnit; 