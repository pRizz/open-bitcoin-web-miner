import { NoncelessBlockHeader, ProofOfReward } from "./websocket";

export interface SessionMiningStats {
  maybeHashRate?: number;
  maybeStartTime?: number | null;
  maybeBlockHeight?: number;
  maybeDifficulty?: number;
  maybeRequiredBinaryZeroes?: number;
}

export interface PersistentMiningStats {
  maybeBestSolutions?: HashSolution[];
  maybeSubmittedSolutions?: HashSolution[];
  maybeTotalSolutions?: number;
  cumulativeHashes: number;
  acceptedSolutions: number;
  rejectedSolutions: number;
}

export interface MiningStats extends SessionMiningStats, PersistentMiningStats {}

// TODO: take a nonceless block header instead of each individual field
export interface HashSolution {
  id: string;
  hash: string;
  nonceNumber: number;
  timestamp: number;
  merkleRootHex: string;
  previousBlockHex: string;
  versionNumber: number;
  bitsHex: string;
  binaryZeroes: number;
  hexZeroes: number;
  timeToFindMs: number;
  status?: 'accepted' | 'rejected' | 'outdated' | 'pending';
}

export interface MiningSolution {
  hash: string;
  nonceVecU8: Uint8Array;
  maybeBlockHeader?: NoncelessBlockHeader;
  cumulativeHashes: number;
}

export type MiningMode = "cpu" | "webgl" | "webgpu";

export interface MiningChallenge {
  blockHeader: NoncelessBlockHeader;
  targetZeros: number;
  proofOfReward: ProofOfReward;
}
