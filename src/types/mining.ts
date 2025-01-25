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
}

export interface NetworkStats {
  blockHeight: number;
  difficulty: number;
  requiredBinaryZeroes: number;
}