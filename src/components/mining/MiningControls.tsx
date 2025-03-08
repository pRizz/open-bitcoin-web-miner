import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useMining } from "@/contexts/MiningContext";
import { useShare } from "@/contexts/ShareContext";
import { validateBitcoinAddress } from "@/utils/mining";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { GPUCapabilities } from "../GPUCapabilities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MiningControls() {
  const { toast } = useToast();
  const {
    isMining,
    btcAddress,
    miningSpeed,
    threadCount,
    maxThreads,
    miningMode,
    gpuCapabilities,
    setBtcAddress,
    setMiningSpeed,
    setThreadCount,
    setMiningMode,
    startMining,
    stopMining,
  } = useMining();

  const {
    includeAutoStart,
    setIncludeAutoStart,
    includeAddress,
    setIncludeAddress
  } = useShare();

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setBtcAddress(address);

    if (address && !validateBitcoinAddress(address)) {
      toast({
        title: "Invalid Bitcoin Address",
        description: "Please enter a valid Bitcoin address",
        variant: "destructive",
      });
    }
  };

  const handleSpeedChange = (value: number[]) => {
    setMiningSpeed(value[0]);
  };

  const handleThreadChange = (value: number[]) => {
    setThreadCount(value[0]);
  };

  const isValidAddress = btcAddress ? validateBitcoinAddress(btcAddress) : false;

  return (
    <div className="space-y-4">
      {/* BTC Address Input */}
      <div className="space-y-2">
        <Label htmlFor="btc-address">Bitcoin Address</Label>
        <Input
          id="btc-address"
          placeholder="Enter your BTC address"
          value={btcAddress}
          onChange={handleAddressChange}
          className="font-mono"
        />
      </div>

      {/* Mining Mode Selection */}
      <div className="space-y-2">
        <Label>Mining Mode</Label>
        <Select value={miningMode} onValueChange={setMiningMode}>
          <SelectTrigger>
            <SelectValue placeholder="Select mining mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cpu">CPU Mining</SelectItem>
            <SelectItem value="webgpu">WebGPU Mining</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Thread Count Control (CPU Only) */}
      {miningMode === "cpu" && (
        <div className="space-y-2">
          <Label>Thread Count: {threadCount}</Label>
          <Slider
            value={[threadCount]}
            onValueChange={handleThreadChange}
            min={1}
            max={maxThreads}
            step={1}
          />
          <div className="text-xs text-muted-foreground">
            Available Threads: {maxThreads}
          </div>
        </div>
      )}

      {/* Mining Speed Control */}
      <div className="space-y-2">
        <Label>Mining Speed: {miningSpeed}%</Label>
        <Slider
          value={[miningSpeed]}
          onValueChange={handleSpeedChange}
          min={5}
          max={100}
          step={5}
        />
        <div className="text-xs text-muted-foreground">
          Adjust to balance between mining speed and system responsiveness
        </div>
      </div>

      {/* Sharing Options */}
      <div className="space-y-3 pt-2 border-t">
        <Label className="text-sm text-muted-foreground">Sharing Options</Label>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-start" className="text-sm">
            Auto-start when sharing
          </Label>
          <Switch
            id="auto-start"
            checked={includeAutoStart}
            onCheckedChange={setIncludeAutoStart}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="include-address" className="text-sm">
            Include Bitcoin address in share link
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Switch
                    id="include-address"
                    checked={includeAddress}
                    onCheckedChange={setIncludeAddress}
                    disabled={!isValidAddress}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter a valid Bitcoin address to enable this option</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Start/Stop Button */}
      <Button
        className="w-full"
        onClick={isMining ? stopMining : startMining}
        variant={isMining ? "destructive" : "default"}
        disabled={btcAddress ? !isValidAddress : false}
      >
        {isMining ? "Stop Mining" : "Start Mining"}
      </Button>

      {/* GPU Capabilities */}
      {miningMode === "webgpu" && (
        <GPUCapabilities capabilities={gpuCapabilities} />
      )}
    </div>
  );
}