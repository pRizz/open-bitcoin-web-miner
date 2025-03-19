import { NoncelessBlockHeader } from "./websocket";

export interface MiningStats {
  maybeHashRate?: number;
  maybeBestHashes?: HashSolution[];
  maybeSubmittedHashes?: HashSolution[];
  maybeTotalHashes?: number;
  maybeStartTime?: number | null;
  maybeBlockHeight?: number;
  maybeDifficulty?: number;
  maybeRequiredBinaryZeroes?: number;
  acceptedHashes: number;
  rejectedHashes: number;
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
  status?: 'accepted' | 'rejected' | 'outdated' | 'pending';
}

export interface MiningSolution {
  hash: string;
  nonceVecU8: Uint8Array;
  maybeJobId?: string;
  maybeBlockHeader?: NoncelessBlockHeader;
}

export type MiningMode = "cpu" | "webgl" | "webgpu";

export interface MiningChallenge {
  maybeJobId?: string;
  blockHeader: NoncelessBlockHeader;
  maybeTargetZeros?: number;
  maybeKeepExisting?: boolean;
}