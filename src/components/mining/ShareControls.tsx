import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Share } from "lucide-react";
import { URL_PARAMS } from "@/constants/mining";

interface ShareControlsProps {
  includeAutoStart: boolean;
  setIncludeAutoStart?: (value: boolean) => void;
  includeAddress: boolean;
  setIncludeAddress?: (value: boolean) => void;
  btcAddress?: string;
}

export function ShareControls({
  includeAutoStart,
  setIncludeAutoStart,
  includeAddress,
  setIncludeAddress,
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
    <div className="flex items-center justify-end gap-4">
      <div className="flex items-center gap-4">
        {setIncludeAutoStart && (
          <div className="flex items-center gap-2">
            <Switch
              id="auto-start"
              checked={includeAutoStart}
              onCheckedChange={setIncludeAutoStart}
            />
            <Label htmlFor="auto-start">Include Auto-start</Label>
          </div>
        )}
        {setIncludeAddress && (
          <div className="flex items-center gap-2">
            <Switch
              id="include-address"
              checked={includeAddress}
              onCheckedChange={setIncludeAddress}
            />
            <Label htmlFor="include-address">Include Address</Label>
          </div>
        )}
      </div>
      <Button onClick={handleShare} variant="outline">
        <Share className="h-4 w-4 mr-2" />
        Share
      </Button>
    </div>
  );
}