import { WebSocketMiningState, NoncelessBlockHeader, ProofOfReward } from "./websocket";

export interface SessionMiningStats {
  maybeHashRate?: number;
  maybeStartTime?: number | null;
  maybeBlockHeight?: number;
  maybeDifficulty?: number;
  maybeRequiredBinaryZeroes?: number;
}

export type SubmissionStatus = 'accepted' | 'rejected' | 'outdated' | 'pending';

// TODO: take a nonceless block header instead of each individual field
export interface FoundHashSolution {
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
}

export interface SubmittedHashSolution extends FoundHashSolution {
  status: SubmissionStatus;
}

export interface PersistentMiningStats {
  maybeBestSolutions?: FoundHashSolution[];
  maybeSubmittedSolutions?: SubmittedHashSolution[];
  maybeTotalSolutions?: number;
  cumulativeHashes: number;
  acceptedSolutions: number;
  rejectedSolutions: number;
}

export interface MiningStats extends SessionMiningStats, PersistentMiningStats {}

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
