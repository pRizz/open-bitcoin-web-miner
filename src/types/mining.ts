import { NoncelessBlockHeader } from "./websocket";

export interface MiningStats {
  hashRate?: number;
  bestHashes?: HashSolution[];
  totalHashes?: number;
  startTime?: number | null;
  blockHeight?: number;
  difficulty?: number;
  requiredBinaryZeroes?: number;
}

// TODO: take a nonceless block header instead of each individual field
export interface HashSolution {
  id: string;
  hash: string;
  nonce: number;
  timestamp: number;
  merkleRoot: string;
  previousBlock: string;
  version: number;
  bits: string;
  binaryZeroes: number;
  hexZeroes: number;
  timeToFind: number; // Time in milliseconds
}

export interface MiningSolution {
  hash: string;
  nonce: number;
  jobId?: string;
  blockHeader?: NoncelessBlockHeader;
}

export interface NetworkStats {
  blockHeight: number;
  difficulty: number;
  requiredBinaryZeroes: number;
}

export type MiningMode = "cpu" | "webgl" | "webgpu";

export interface MiningWorkerMessage {
  type: "start" | "stop" | "updateSpeed" | "hash" | "hashRate";
  blockHeader?: Partial<HashSolution>;
  miningSpeed?: number;
  data?: any;
}

export interface MiningChallenge {
  jobId?: string;
  blockHeader: NoncelessBlockHeader;
  targetZeros?: number;
  keepExisting?: boolean;
}