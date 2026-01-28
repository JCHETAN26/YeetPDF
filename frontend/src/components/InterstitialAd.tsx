import { useState, useEffect } from "react";
import { X, Play, Volume2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdBanner, AdPlaceholder } from "./AdBanner";

interface InterstitialAdProps {
    onComplete: () => void;
    open: boolean;
}

export function InterstitialAd({ onComplete, open }: InterstitialAdProps) {
    const [timeLeft, setTimeLeft] = useState(5);
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        if (!open) return;

        // Reset state when opened
        setTimeLeft(5);
        setCanSkip(false);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanSkip(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px]">

                {/* Ad Content Area (Video/Display) */}
                <div className="flex-1 bg-black relative flex items-center justify-center">
                    {/* Ad Label */}
                    <div className="absolute top-4 left-4 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded">
                        Ad
                    </div>

                    {/* Actual Ad Slot - replacing with a placeholder video simulation for now 
              In production, this would be your Video Player or AdSense Display unit 
          */}
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                        {/* 
                 NOTE: AdSense doesn't provide a direct "Video Player" for manual placement easily.
                 We use a large Display Ad slot here which often serves video/rich media.
             */}
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <AdBanner slot="YOUR_ADSENSE_VIDEO_SLOT_ID" format="rectangle" className="w-full h-full flex items-center justify-center" />
                            <AdPlaceholder width="100%" height="100%" className="absolute inset-0 z-[-1]" />
                        </div>
                    </div>

                    {/* Fake Video Controls (Visual flair) */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <Play className="w-5 h-5 fill-white" />
                            <div className="h-1 w-24 bg-white/30 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-1/3"></div>
                            </div>
                            <span className="text-xs">0:05 / 0:30</span>
                        </div>
                        <Volume2 className="w-5 h-5" />
                    </div>
                </div>

                {/* Sidebar / Controls */}
                <div className="w-full md:w-80 bg-card p-6 flex flex-col border-l border-border">
                    <div className="mb-auto space-y-4">
                        <h3 className="font-semibold text-lg">Your link is ready!</h3>
                        <p className="text-sm text-muted-foreground">
                            Please wait a moment while we process your request. This helps keep YeetPDF free for everyone.
                        </p>

                        {/* Another small ad unit for side */}
                        <div className="mt-4">
                            <AdBanner slot="YOUR_SIDEBAR_SLOT_ID" format="rectangle" />
                            <AdPlaceholder height="250px" />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <Button
                            className="w-full h-12 text-base"
                            size="lg"
                            variant={canSkip ? "default" : "secondary"}
                            disabled={!canSkip}
                            onClick={onComplete}
                        >
                            {canSkip ? (
                                <>
                                    Skip to Link <SkipForward className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                `Skip in ${timeLeft}s...`
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterstitialAd;
