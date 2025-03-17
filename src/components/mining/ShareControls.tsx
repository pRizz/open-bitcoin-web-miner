import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { URL_PARAMS } from "@/constants/mining";
import { useToast } from "@/hooks/use-toast";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";

interface ShareControlsProps {
  includeAutoStart: boolean;
  includeAddress: boolean;
}

export function ShareControls({
  includeAutoStart,
  includeAddress,
}: ShareControlsProps) {
  const { toast } = useToast();
  const { maybeMinerAddress } = useMinerInfo();

  const handleShare = async () => {
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
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleShare}
      title="Share mining configuration"
    >
      <Share className="h-4 w-4" />
    </Button>
  );
}