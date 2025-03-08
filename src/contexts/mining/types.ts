import { MiningStats, NetworkStats, MiningMode } from "@/types/mining";
import { MiningSubmission } from "@/types/websocket";

export interface GPUCapabilities {
  maxStorageBufferSize: string;
  maxWorkgroupsPerDimension: string;
  maxWorkgroupSize: {
    x: string;
    y: string;
    z: string;
  };
  maxInvocationsPerWorkgroup: string;
  maxTextureDimension2D: string;
  adapterInfo: string;
}

export interface MiningContextType {
  miningStats: MiningStats;
  networkStats: NetworkStats;
  isMining: boolean;
  btcAddress: string;
  miningSpeed: number;
  threadCount: number;
  maxThreads: number;
  miningMode: MiningMode;
  gpuCapabilities?: GPUCapabilities;
  setBtcAddress: (address: string) => void;
  setMiningSpeed: (speed: number) => void;
  setThreadCount: (count: number) => void;
  setMiningMode: (mode: MiningMode) => void;
  startMining: () => void;
  stopMining: () => void;
  resetData: () => void;
  submitSolution: (submission: MiningSubmission) => void;
}