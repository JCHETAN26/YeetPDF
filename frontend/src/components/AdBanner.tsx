import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdBannerProps {
    slot: string;
    format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
    responsive?: boolean;
    className?: string;
}

/**
 * AdSense Display Ad Component
 * Use this to place ads throughout the site
 * 
 * @param slot - Your AdSense ad slot ID (get from AdSense dashboard)
 * @param format - Ad format type
 * @param responsive - Whether the ad should be responsive
 */
export function AdBanner({
    slot,
    format = 'auto',
    responsive = true,
    className = ''
}: AdBannerProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const isLoaded = useRef(false);

    useEffect(() => {
        if (isLoaded.current) return;

        try {
            // Push the ad
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            isLoaded.current = true;
        } catch (err) {
            console.error('AdSense error:', err);
        }
    }, []);

    return (
        <div className={`ad-container ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-5146404542392206"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? 'true' : 'false'}
            />
        </div>
    );
}

/**
 * Placeholder for ad slots that haven't been created yet
 * Shows a styled placeholder during development
 */
export function AdPlaceholder({
    width = '100%',
    height = '90px',
    className = ''
}: {
    width?: string;
    height?: string;
    className?: string;
}) {
    // Only show placeholder in development
    if (import.meta.env.PROD) {
        return null;
    }

    return (
        <div
            className={`flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 ${className}`}
            style={{ width, height }}
        >
            <span className="text-xs text-muted-foreground">Ad Placeholder</span>
        </div>
    );
}

export default AdBanner;
