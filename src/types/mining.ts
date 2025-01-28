export interface MiningStats {
  hashRate: number;
  bestHashes: HashSolution[];
  totalHashes: number;
  startTime: number | null;
}

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

export interface NetworkStats {
  blockHeight: number;
  difficulty: number;
  requiredBinaryZeroes: number;
}

export type MiningMode = "cpu" | "gpu" | "hybrid" | "webgl" | "webgpu";

export interface MiningWorkerMessage {
  type: "start" | "stop" | "updateSpeed" | "hash" | "hashRate";
  blockHeader?: Partial<HashSolution>;
  miningSpeed?: number;
  data?: any;
}
