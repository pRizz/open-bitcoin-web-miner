import { HashSolution } from "@/types/mining";
import { calculateLeadingZeroes } from "@/utils/mining";

let running = false;
let hashCount = 0;
let lastHashRateUpdate = Date.now();
let miningSpeed = 100;
const HASH_RATE_UPDATE_INTERVAL = 1000; // 1 second
const BATCH_SIZE = 10000;

// Add global error handler for the worker
self.onerror = (error) => {
  self.postMessage({
    type: 'error',
    data: `Mining worker error: ${error.message}`,
  });
  running = false;
};

self.onmessage = (e) => {
  const { type, blockHeader, miningSpeed: newSpeed } = e.data;
  
  if (type === 'start') {
    running = true;
    miningSpeed = newSpeed;
    mine(blockHeader);
  } else if (type === 'stop') {
    running = false;
  } else if (type === 'updateSpeed') {
    miningSpeed = newSpeed;
  }
};

function mine(blockHeader: Partial<HashSolution>) {
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
    if (!running) return;

    try {
      const startTime = Date.now();
      let batchCount = 0;

      while (running && batchCount < BATCH_SIZE) {
        const header = {
          ...blockHeader,
          nonce: nonce++,
        };

        const hash = simulateHash(header);
        hashCount++;
        batchCount++;

        const { binary } = calculateLeadingZeroes(hash);
        if (binary >= 10) {
          self.postMessage({
            type: 'hash',
            data: { ...header, hash },
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

function simulateHash(header: Partial<HashSolution>): string {
  const input = `${header.version}${header.previousBlock}${header.merkleRoot}${header.timestamp}${header.bits}${header.nonce}`;
  let hash = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}