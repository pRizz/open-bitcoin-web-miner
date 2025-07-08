import { WebSocketMiningState, NoncelessBlockHeader, ProofOfReward } from "./websocket";

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
  // in milliseconds since 1970 epoch
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
  noncelessBlockHeader: NoncelessBlockHeader;
  cumulativeHashes: number;
}

export type MiningMode = "cpu" | "webgl" | "webgpu";

export interface MiningChallenge {
  noncelessBlockHeader: NoncelessBlockHeader;
  targetZeros: number;
  webSocketMiningState: WebSocketMiningState;
  maybeProofOfReward: ProofOfReward | null;
}
