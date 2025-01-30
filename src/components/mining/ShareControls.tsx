import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { URL_PARAMS } from "@/constants/mining";
import { useToast } from "@/hooks/use-toast";

interface ShareControlsProps {
  includeAutoStart: boolean;
  includeAddress: boolean;
  btcAddress?: string;
}

export function ShareControls({
  includeAutoStart,
  includeAddress,
  btcAddress,
}: ShareControlsProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = new URL(window.location.href);
    if (includeAutoStart) {
      url.searchParams.set(URL_PARAMS.AUTO_START, "true");
    }
    if (includeAddress && btcAddress) {
      url.searchParams.set(URL_PARAMS.BITCOIN_ADDRESS, btcAddress);
    }
    
    try {
      await navigator.clipboard.writeText(url.toString());
      toast({
        title: "Link copied!",
        description: "The URL has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the URL manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-end">
      <Button onClick={handleShare} variant="outline">
        <Share className="h-4 w-4 mr-2" />
        Share
      </Button>
    </div>
  );
}