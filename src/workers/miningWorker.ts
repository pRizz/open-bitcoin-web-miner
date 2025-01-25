import { HashSolution } from "@/types/mining";
import { calculateLeadingZeroes } from "@/utils/mining";

let running = false;
let hashCount = 0;
let lastHashRateUpdate = Date.now();
let miningSpeed = 100;
const HASH_RATE_UPDATE_INTERVAL = 1000; // 1 second

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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const miningLoop = async () => {
    if (!running) return;

    const batchSize = 10000;
    const sleepTime = Math.floor((100 - miningSpeed) * 10); // 0ms at 100%, 900ms at 10%

    for (let i = 0; i < batchSize; i++) {
      const header = {
        ...blockHeader,
        nonce: nonce++,
      };

      const hash = simulateHash(header);
      hashCount++;

      const { binary } = calculateLeadingZeroes(hash);
      if (binary >= 10) {
        self.postMessage({
          type: 'hash',
          data: { ...header, hash },
        });
      }
    }

    updateHashRate();
    
    if (sleepTime > 0) {
      await sleep(sleepTime);
    }
    
    requestAnimationFrame(() => miningLoop());
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