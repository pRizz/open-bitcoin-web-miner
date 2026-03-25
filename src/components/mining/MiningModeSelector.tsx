import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { useMining } from "@/contexts/MiningContext";

export function MiningModeSelector() {
  const {
    miningMode,
    setMiningMode,
    isWebGPUAllowed,
    webGPUAvailabilityReason,
  } = useMining();

  let webGPUMiningLabel = "WebGPU Mining";
  if (webGPUAvailabilityReason === "unsupported") {
    webGPUMiningLabel = "WebGPU Mining (Not Supported)";
  } else if (webGPUAvailabilityReason === "disabled_on_mobile") {
    webGPUMiningLabel = "WebGPU Mining (Disabled on Mobile by Config)";
  }

  return (
    <div className="space-y-2">
      <Label>Mining Mode</Label>
      <Select value={miningMode} onValueChange={setMiningMode}>
        <SelectTrigger>
          <SelectValue placeholder="Select mining mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="webgpu" disabled={!isWebGPUAllowed}>{webGPUMiningLabel}</SelectItem>
          <SelectItem value="cpu">CPU Mining (JavaScript Implementation)</SelectItem>
          <SelectItem disabled value="cpuWasm">CPU Mining (WebAssembly Implementation) (Coming Soon)</SelectItem>
          <SelectItem disabled value="bitaxe">Bitaxe Mining (Coming Soon)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
