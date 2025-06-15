import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { URL_PARAMS } from "@/constants/mining";
import { useToast } from "@/hooks/use-toast";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useCallback } from "react";
import { useShare } from "@/contexts/ShareContext";

interface ShareControlsProps {
  maybeButtonText?: string;
}

async function shareUrl(url: string, toast: ReturnType<typeof useToast>['toast']): Promise<void> {
  // Try to use the Web Share API if available. This uses the native share dialog on mobile devices.
  if (navigator.share) {
    try {
      await navigator.share({
        url,
        title: 'Share Mining Link',
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
    toast({
      title: "Link Copied!",
      description: "Share link has been copied to your clipboard",
    });
  } catch (err) {
    console.error('Failed to copy:', err);
    toast({
      title: "Copy Failed",
      description: "Failed to copy link to clipboard",
      variant: "destructive",
    });
  }
}

export function ShareControls({ maybeButtonText }: ShareControlsProps) {
  const { toast } = useToast();
  const { maybeMinerAddress } = useMinerInfo();
  const { includeAutoStart, includeAddress } = useShare();
  const buttonText = maybeButtonText ?? "Share";

  const handleShare = useCallback(async () => {
    const url = new URL(window.location.href);
    if (includeAutoStart) {
      url.searchParams.set(URL_PARAMS.AUTO_START, "true");
    }
    if (includeAddress && maybeMinerAddress) {
      url.searchParams.set(URL_PARAMS.BITCOIN_ADDRESS, maybeMinerAddress);
    }

    await shareUrl(url.toString(), toast);
  }, [includeAutoStart, includeAddress, maybeMinerAddress, toast]);

  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleShare}
    >
      <Share className="h-4 w-4" /> {buttonText}
    </Button>
  );
}