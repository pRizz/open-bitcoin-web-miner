import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useMining } from "@/contexts/MiningContext";
import { validateBitcoinAddress } from "@/utils/mining";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MiningMode } from "@/types/mining";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface MiningControlsProps {
  includeAutoStart: boolean;
  setIncludeAutoStart: (value: boolean) => void;
  includeAddress: boolean;
  setIncludeAddress: (value: boolean) => void;
}

export function MiningControls({
  includeAutoStart,
  setIncludeAutoStart,
  includeAddress,
  setIncludeAddress,
}: MiningControlsProps) {
  const { toast } = useToast();
  const {
    isMining,
    btcAddress,
    miningSpeed,
    threadCount,
    maxThreads,
    miningMode,
    setBtcAddress,
    setMiningSpeed,
    setThreadCount,
    setMiningMode,
    startMining,
    stopMining,
  } = useMining();

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

  const toggleMiningMode = (mode: MiningMode, enabled: boolean) => {
    if (enabled) {
      setMiningMode(mode);
    } else if (miningMode === mode) {
      setMiningMode("cpu"); // Default to CPU mining when disabling a mode
    }
  };

  const isValidAddress = btcAddress ? validateBitcoinAddress(btcAddress) : false;
  const showCPUControls = miningMode === "cpu";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-400">Mining Modes</label>
        <Card className="p-4 mt-2 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cpu-mining">CPU Mining</Label>
            <Switch
              id="cpu-mining"
              checked={miningMode === "cpu"}
              onCheckedChange={(checked) => toggleMiningMode("cpu", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="webgl-mining">WebGL Mining</Label>
            <Switch
              id="webgl-mining"
              checked={miningMode === "webgl"}
              onCheckedChange={(checked) => toggleMiningMode("webgl", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="webgpu-mining">WebGPU Mining</Label>
            <Switch
              id="webgpu-mining"
              checked={miningMode === "webgpu"}
              onCheckedChange={(checked) => toggleMiningMode("webgpu", checked)}
            />
          </div>
        </Card>
      </div>

      <div>
        <label className="text-sm text-gray-400">
          Bitcoin Address (Optional)
        </label>
        <Input
          placeholder="Enter your Bitcoin address"
          value={btcAddress}
          onChange={handleAddressChange}
          className="font-mono"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-400">
          Mining Speed: {miningSpeed}%
        </label>
        <Slider
          value={[miningSpeed]}
          onValueChange={handleSpeedChange}
          min={10}
          max={100}
          step={10}
          className="w-full"
        />
      </div>

      {showCPUControls && (
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            CPU Threads: {threadCount} of {maxThreads}
          </label>
          <Slider
            value={[threadCount]}
            onValueChange={handleThreadChange}
            min={1}
            max={maxThreads}
            step={1}
            className="w-full"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">
            Auto-start when sharing
          </label>
          <Switch
            checked={includeAutoStart}
            onCheckedChange={setIncludeAutoStart}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">
            Include Bitcoin address in share link
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Switch
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

      <Button
        className="w-full"
        variant={isMining ? "destructive" : "default"}
        onClick={isMining ? stopMining : startMining}
      >
        {isMining ? "Stop Mining" : "Start Mining"}
      </Button>
    </div>
  );
}