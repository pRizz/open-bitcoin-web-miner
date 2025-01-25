import { HashSolution } from "@/types/mining";
import { calculateLeadingZeroes } from "@/utils/mining";

let running = false;
let hashCount = 0;
let lastHashRateUpdate = Date.now();
const HASH_RATE_UPDATE_INTERVAL = 1000; // 1 second

self.onmessage = (e) => {
  const { type, blockHeader } = e.data;
  
  if (type === 'start') {
    running = true;
    mine(blockHeader);
  } else if (type === 'stop') {
    running = false;
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

    for (let i = 0; i < 10000; i++) {
      const header = {
        ...blockHeader,
        nonce: nonce++,
      };

      // Simulate SHA256 hash (in reality, you'd use crypto.subtle.digest)
      const hash = simulateHash(header);
      hashCount++;

      const { binary } = calculateLeadingZeroes(hash);
      if (binary >= 10) { // Report any hash with 10+ leading zeroes
        self.postMessage({
          type: 'hash',
          data: { ...header, hash },
        });
      }
    }

    updateHashRate();
    requestAnimationFrame(miningLoop);
  };

  miningLoop();
}

function simulateHash(header: Partial<HashSolution>): string {
  // This is a simplified simulation - in reality, you'd properly serialize the header and use SHA256d
  const input = `${header.version}${header.previousBlock}${header.merkleRoot}${header.timestamp}${header.bits}${header.nonce}`;
  let hash = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}