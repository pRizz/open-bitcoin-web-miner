import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { URL_PARAMS } from "@/constants/mining";

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
  const handleShare = () => {
    const url = new URL(window.location.href);
    if (includeAutoStart) {
      url.searchParams.set(URL_PARAMS.AUTO_START, "true");
    }
    if (includeAddress && btcAddress) {
      url.searchParams.set(URL_PARAMS.BITCOIN_ADDRESS, btcAddress);
    }
    navigator.clipboard.writeText(url.toString());
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