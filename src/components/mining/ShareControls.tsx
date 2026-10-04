import React from "react";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { productionSite } from "@/config/production";
import { miningShareUrl } from "@/lib/siteUrls";
import { showSuccess, showError } from "@/utils/notifications";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useCallback } from "react";
import { useShare } from "@/contexts/ShareContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface ShareControlsProps {
  maybeButtonText?: string;
}

async function shareUrl(url: string): Promise<void> {
  // Try to use the Web Share API if available. This uses the native share dialog on mobile devices.
  if (navigator.share) {
    try {
      await navigator.share({
        url,
        title: productionSite.brand,
        text: `Mine Bitcoin in your browser with ${productionSite.brand}`,
      });
      return;
    } catch (err) {
      // If user cancels share, don't show error
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Share failed:', err);
    }
  }

  // Fallback to clipboard copy
  try {
    await navigator.clipboard.writeText(url);
    showSuccess(
      "Link Copied!",
      "Share link has been copied to your clipboard"
    );
  } catch (err) {
    console.error('Failed to copy:', err);
    showError(
      "Copy Failed",
      "Failed to copy link to clipboard"
    );
  }
}

export function ShareControls({ maybeButtonText }: ShareControlsProps) {
  const { maybeMinerAddress } = useMinerInfo();
  const { includeAutoStart, includeAddress } = useShare();
  const isMobile = useIsMobile();
  const buttonText = isMobile ? "" : (maybeButtonText ?? "Share");

  const handleShare = useCallback(async () => {
    const url = miningShareUrl(window.location.href, {
      includeAutoStart,
      includeAddress,
      maybeMinerAddress,
    });
    await shareUrl(url);
  }, [includeAutoStart, includeAddress, maybeMinerAddress]);

  return (
    <Button
      variant="outline"
      size={isMobile ? "icon" : "default"}
      aria-label="Share mining link"
      onClick={handleShare}
    >
      <Share className="h-4 w-4" /> {buttonText}
    </Button>
  );
}