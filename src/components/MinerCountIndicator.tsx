import React from "react";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { cn } from "@/lib/utils";
import { TypedLink } from "@/components/TypedLink";
import { useMining } from "@/contexts/MiningContext";

export function MinerCountIndicator() {
  const { maybeConnectedMinerCount } = useNetworkInfo();
  const isConnected = maybeConnectedMinerCount !== undefined;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-gray-400"
        )}
      />
      <span className="text-sm text-gray-300">
        {isConnected
          ? `${maybeConnectedMinerCount} ${maybeConnectedMinerCount === 1 ? 'miner' : 'miners'} connected`
          : 'Connecting...'
        }
      </span>
    </div>
  );
}

export function MiningStatusIndicator() {
  const { isMining } = useMining();

  if (!isMining) return null;

  return (
    <TypedLink routeKeyName="home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-sm text-gray-300">Mining</span>
    </TypedLink>
  );
}

export function MiningStatusIndicatorFull() {
  const { isMining } = useMining();

  if (!isMining) return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-gray-400" />
      <span className="text-sm text-gray-300">Not mining</span>
    </div>
  );

  return (
    <TypedLink routeKeyName="home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-sm text-gray-300">Mining</span>
    </TypedLink>
  );
}
