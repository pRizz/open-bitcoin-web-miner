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

    try {
      await navigator.clipboard.writeText(url.toString());
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