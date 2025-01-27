import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { URL_PARAMS } from "@/constants/mining";

interface ShareControlsProps {
  includeAutoStart: boolean;
  includeAddress: boolean;
  btcAddress: string;
  onReset: () => void;
}

export function ShareControls({
  includeAutoStart,
  includeAddress,
  btcAddress,
  onReset,
}: ShareControlsProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = new URL(window.location.href);
    
    if (includeAutoStart) {
      url.searchParams.set(URL_PARAMS.AUTO_START, "true");
    } else {
      url.searchParams.delete(URL_PARAMS.AUTO_START);
    }

    if (includeAddress && btcAddress) {
      url.searchParams.set(URL_PARAMS.BITCOIN_ADDRESS, btcAddress);
    } else {
      url.searchParams.delete(URL_PARAMS.BITCOIN_ADDRESS);
    }
    
    try {
      await navigator.clipboard.writeText(url.toString());
      toast({
        title: "Link Copied!",
        description: "The URL has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy the URL to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button variant="destructive" onClick={onReset}>
        Reset Data
      </Button>
    </div>
  );
}