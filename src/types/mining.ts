import { NoncelessBlockHeader } from "./websocket";

export interface MiningStats {
  maybeHashRate?: number;
  maybeBestHashes?: HashSolution[];
  maybeTotalHashes?: number;
  maybeStartTime?: number | null;
  maybeBlockHeight?: number;
  maybeDifficulty?: number;
  maybeRequiredBinaryZeroes?: number;
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
  maybeJobId?: string;
  maybeBlockHeader?: NoncelessBlockHeader;
}

export interface NetworkStats {
  blockHeight: number;
  difficulty: number;
  requiredBinaryZeroes: number;
}

export type MiningMode = "cpu" | "webgl" | "webgpu";

export interface MiningChallenge {
  maybeJobId?: string;
  blockHeader: NoncelessBlockHeader;
  maybeTargetZeros?: number;
  maybeKeepExisting?: boolean;
}