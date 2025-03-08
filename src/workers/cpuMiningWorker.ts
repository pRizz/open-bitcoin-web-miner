import { HashSolution, MiningChallenge, MiningSolution } from "@/types/mining";
import { calculateLeadingZeroes } from "@/utils/mining";

let running = false;
let hashCount = 0;
let lastHashRateUpdate = Date.now();
let miningSpeed = 100;
let maybeCurrentChallenge: MiningChallenge | null = null;
const HASH_RATE_UPDATE_INTERVAL = 1000; // 1 second
const BATCH_SIZE = 10000;

// Add global error handler for the worker
self.onerror = (error: ErrorEvent | string) => {
  const errorMessage = error instanceof ErrorEvent ? error.message : error;
  self.postMessage({
    type: 'error',
    data: `Mining worker error: ${errorMessage}`,
  });
  running = false;
};

interface WorkerMessage {
  type: 'start' | 'stop' | 'updateSpeed' | 'updateChallenge';
  maybeChallenge?: MiningChallenge;
  maybeMiningSpeed?: number;
  maybeWorkerId?: number;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, maybeChallenge: challenge, maybeMiningSpeed: newSpeed } = e.data;

  if (type === 'start' && challenge) {
    running = true;
    miningSpeed = newSpeed ?? 100;
    maybeCurrentChallenge = challenge;
    mine();
  } else if (type === 'stop') {
    running = false;
    maybeCurrentChallenge = null;
  } else if (type === 'updateSpeed') {
    miningSpeed = newSpeed ?? 100;
  } else if (type === 'updateChallenge' && challenge) {
    maybeCurrentChallenge = challenge;
    // No need to restart mining, the loop will pick up the new challenge
  }
};

function mine() {
  if (!maybeCurrentChallenge) return;
  
  let nonce = Math.floor(Math.random() * 0xFFFFFFFF);

  const updateHashRate = () => {
    const now = Date.now();
    const elapsed = now - lastHashRateUpdate;
    if (elapsed >= HASH_RATE_UPDATE_INTERVAL) {
      const hashRate = (hashCount * 1000) / elapsed;
      self.postMessage({ type: 'hashRate', data: hashRate });
      hashCount = 0;
      lastHashRateUpdate = now;
    }
  };

  const miningLoop = () => {
    if (!running || !maybeCurrentChallenge) return;

    try {
      const startTime = Date.now();
      let batchCount = 0;

      while (running && batchCount < BATCH_SIZE) {
        nonce++;

        const hash = simulateHash(maybeCurrentChallenge.blockHeader, nonce);
        hashCount++;
        batchCount++;

        const { leadingBinaryZeroes: binary } = calculateLeadingZeroes(hash);
        if (binary >= (maybeCurrentChallenge.targetZeros ?? 10)) {
          const solution: MiningSolution = {
            hash,
            nonce,
            jobId: maybeCurrentChallenge.jobId,
            blockHeader: maybeCurrentChallenge.blockHeader
          };
          self.postMessage({
            type: 'hash',
            data: solution
          });
        }
      }

      updateHashRate();

      // Calculate sleep time based on mining speed
      const elapsedTime = Date.now() - startTime;
      const targetTime = (BATCH_SIZE / 10000) * (100 / miningSpeed) * 100; // Adjust time based on mining speed
      const sleepTime = Math.max(0, targetTime - elapsedTime);

      setTimeout(() => miningLoop(), sleepTime);
    } catch (error) {
      self.postMessage({
        type: 'error',
        data: `Mining error: ${error instanceof Error ? error.message : String(error)}`,
      });
      running = false;
    }
  };

  miningLoop();
}

function simulateHash(blockHeader: any, nonce: number): string {
  // TODO: Implement actual SHA-256 hashing
  let hash = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}