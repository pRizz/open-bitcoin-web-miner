import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useMining } from "@/contexts/MiningContext";
import { useShare } from "@/contexts/ShareContext";
import { validateBitcoinAddress } from "@/utils/mining";
import { showError } from "@/utils/notifications";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { GPUCapabilitiesComponent } from "../GPUCapabilities";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { validateBlockchainMessage, getMessageByteLength, MAX_MESSAGE_BYTES } from "@/utils/blockchainMessage";
import { getRandomBitcoinPhrase } from "@/utils/bitcoinPhrases";
import { ShareControls } from "./ShareControls";
import { MiningModeSelector } from "./MiningModeSelector";

const randomPhrase = getRandomBitcoinPhrase();

export function MiningControls() {
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
      showError(
        "Invalid Bitcoin Address",
        "Please enter a valid Bitcoin address"
      );
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const message = e.target.value || null;
    setBlockchainMessage(message);
    const error = validateBlockchainMessage(message);
    if (error) {
      showError(
        "Invalid Message",
        error
      );
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
                  placeholder={randomPhrase}
                  value={maybeBlockchainMessage ?? ""}
                  onChange={handleMessageChange}
                  maxLength={MAX_MESSAGE_BYTES}
                  className={!isMessageValid ? "border-red-500" : ""}
                  disabled={isMining}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]" side="bottom">
                <p>This message will be added to the coinbase input script signature field, if you successfully find a block, similar to Satoshi Nakamoto's genesis block.
                  <br/><br/>
                  This is typically where miners identify themselves with some text, and add entropy (randomness) to widen the mining search space. This does not pollute the UTXO set.
                  <br/><br/>
                  UTF-8 text is allowed, with a maximum length of {MAX_MESSAGE_BYTES} bytes. No control characters allowed.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="text-xs text-muted-foreground text-right">
            {getMessageByteLength(maybeBlockchainMessage)} / {MAX_MESSAGE_BYTES} bytes
          </div>
        </div>
      </div>

      {/* Start/Stop Button; TODO: add disabled state and make it consistent with other Start Mining buttons throughout the app */}
      <Button
        size="lg"
        className={isMining
          ? "w-full bg-red-600 hover:bg-red-700 text-white text-lg"
          : "w-full bg-green-600 hover:bg-green-700 text-white text-lg"}
        onClick={isMining ? stopMining : startMining}
      >
        {isMining ? "Stop Mining" : "Start Mining"}
      </Button>

      {/* Warning for mining without address */}
      {isMining && !maybeMinerAddress && (
        <div className="text-sm text-amber-400 bg-amber-950/50 p-3 rounded-md border border-amber-800 transition-all duration-300 ease-in-out animate-in slide-in-from-top-2">
          ⚠️ Warning: You are mining without a Bitcoin address. If you find a block, you will not receive the mining reward.
        </div>
      )}

      {/* Mining Mode Selection */}
      <div>
        <MiningModeSelector />
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

        {/* <div className="flex items-center justify-between">
          <Label htmlFor="auto-start" className="text-sm">
            Auto-start when sharing
          </Label>
          <Switch
            id="auto-start"
            checked={includeAutoStart}
            onCheckedChange={setIncludeAutoStart}
          />
        </div> */}

        <div className="flex items-center justify-between">
          <Label htmlFor="include-address" className="text-sm">
            Include Bitcoin address in share link
          </Label>
          {!isValidAddress ? (
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
                {/* TODO: fix tooltip z index positioning and dont use max-w */}
                <TooltipContent className="max-w-[140px] z-50">
                  <p>Enter a valid Bitcoin address to enable this option</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Switch
              id="include-address"
              checked={includeAddress}
              onCheckedChange={setIncludeAddress}
              disabled={!isValidAddress}
            />
          )}
        </div>

        {/* GPU Capabilities */}
        {miningMode === "webgpu" && (
          <GPUCapabilitiesComponent capabilities={gpuCapabilities} />
        )}

        <ShareControls />

      </div>

    </div>
  );
}