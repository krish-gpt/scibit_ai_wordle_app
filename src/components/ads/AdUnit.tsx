
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
    const adElement = adRef.current;
    if (!adElement) {
      console.warn('AdUnit: Ad ref not available.');
      return;
    }

    // Check if adsbygoogle script is loaded
    if (typeof window.adsbygoogle === 'undefined') {
      console.warn('AdUnit: adsbygoogle is not loaded yet. AdSense script might still be loading.');
      // AdSense script itself will scan for 'ins' tags when it loads.
      return;
    }

    // Check if AdSense has already processed this slot.
    // AdSense might add 'data-adsbygoogle-status' or inject an iframe.
    const isSlotProcessed = adElement.hasAttribute('data-adsbygoogle-status') || 
                            adElement.querySelector('iframe') !== null ||
                            adElement.dataset.adsbygoogleStatus === 'done' || // another common status
                            adElement.childElementCount > 0; // general check for modification


    if (!isSlotProcessed) {
      try {
        console.log(`AdUnit: Pushing to ad slot ${adSlot}. Current status/children:`, adElement.dataset.adsbygoogleStatus, adElement.childElementCount);
        window.adsbygoogle = window.adsbygoogle || []; // Ensure it's an array
        window.adsbygoogle.push({});
      } catch (err) {
        console.error('AdUnit: Error pushing to adsbygoogle:', err);
      }
    } else {
      console.log(`AdUnit: Ad slot ${adSlot} appears to be already processed or filled. Skipping push.`);
    }

    // No explicit cleanup for adsbygoogle.push is generally needed here.
    // If the component unmounts, React removes the <ins> tag.
    // If it remounts, this effect runs again for the new <ins> tag.
  }, [adSlot]); // Effect runs on mount and if adSlot changes.

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
