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
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { validateBlockchainMessage, getMessageByteLength, MAX_MESSAGE_BYTES } from "@/utils/blockchainMessage";

export function MiningControls() {
  const { toast } = useToast();
  const {
    isMining,
    miningSpeed,
    threadCount,
    maxThreads,
    miningMode,
    gpuCapabilities,
    setMiningSpeed,
    setThreadCount,
    setMiningMode,
    startMining,
    stopMining,
  } = useMining();
  const {
    maybeMinerAddress,
    setMinerAddress,
    maybeBlockchainMessage,
    setBlockchainMessage,
  } = useMinerInfo();

  const {
    includeAutoStart,
    setIncludeAutoStart,
    includeAddress,
    setIncludeAddress
  } = useShare();

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setMinerAddress(address);

    if (address && !validateBitcoinAddress(address)) {
      toast({
        title: "Invalid Bitcoin Address",
        description: "Please enter a valid Bitcoin address",
        variant: "destructive",
      });
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const message = e.target.value || null;
    setBlockchainMessage(message);
    const error = validateBlockchainMessage(message);
    if (error) {
      toast({
        title: "Invalid Message",
        description: error,
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

  const isValidAddress = maybeMinerAddress ? validateBitcoinAddress(maybeMinerAddress) : false;
  const isMessageValid = !validateBlockchainMessage(maybeBlockchainMessage);

  return (
    <div className="space-y-4">
      {/* BTC Address Input */}
      <div className="space-y-2">
        <Label htmlFor="btc-address">Bitcoin Mining Reward Address (optional)</Label>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Input
                id="btc-address"
                placeholder="Enter your BTC address"
                value={maybeMinerAddress ?? ""}
                onChange={handleAddressChange}
                className="font-mono"
                disabled={isMining}
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p>If you successfully mine a block, you will receive 1 BTC as a reward at this address.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Blockchain Message Input */}
      <div className="space-y-2">
        <Label htmlFor="blockchain-message">Add a message to the blockchain (optional)</Label>
        <div className="space-y-1">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Input
                  id="blockchain-message"
                  placeholder="Enter your message"
                  value={maybeBlockchainMessage ?? ""}
                  onChange={handleMessageChange}
                  maxLength={MAX_MESSAGE_BYTES}
                  className={!isMessageValid ? "border-red-500" : ""}
                  disabled={isMining}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>This message will be added to the coinbase script signature field, if you successfully find a block. UTF-8 text is allowed, with a maximum length of {MAX_MESSAGE_BYTES} bytes. No control characters allowed.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="text-xs text-muted-foreground text-right">
            {getMessageByteLength(maybeBlockchainMessage)} / {MAX_MESSAGE_BYTES} bytes
          </div>
        </div>
      </div>

      {/* Start/Stop Button */}
      <Button
        className={isMining
          ? "w-full bg-red-600 hover:bg-red-700 text-white"
          : "w-full bg-green-600 hover:bg-green-700 text-white"}
        onClick={isMining ? stopMining : startMining}
        disabled={(maybeMinerAddress ? !isValidAddress : false) || !isMessageValid}
      >
        {isMining ? "Stop Mining" : "Start Mining"}
      </Button>

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
            <Tooltip delayDuration={0}>
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

      {/* GPU Capabilities */}
      {miningMode === "webgpu" && (
        <GPUCapabilities capabilities={gpuCapabilities} />
      )}
    </div>
  );
}