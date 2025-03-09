import { HashSolution, MiningChallenge, MiningSolution } from "@/types/mining";
import { deserializeNonceLE, NoncelessBlockHeader, serializeBlockHeader, serializeNonceLE } from "@/types/websocket";
import { calculateLeadingZeroes } from "@/utils/mining";
import { nonceToU8ArrayBE } from "@/utils/nonceUtils";
import { performHash } from "./cpuMiningUtils";

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
  const { type, maybeChallenge: maybeNewChallenge, maybeMiningSpeed: maybeNewSpeed } = e.data;

  if (type === 'start' && maybeNewChallenge) {
    running = true;
    miningSpeed = maybeNewSpeed ?? 100;
    maybeCurrentChallenge = maybeNewChallenge;
    mine();
  } else if (type === 'stop') {
    running = false;
    maybeCurrentChallenge = null;
  } else if (type === 'updateSpeed') {
    miningSpeed = maybeNewSpeed ?? 100;
  } else if (type === 'updateChallenge' && maybeNewChallenge) {
    maybeCurrentChallenge = maybeNewChallenge;
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

  const miningLoop = async () => {
    if (!running || !maybeCurrentChallenge) return;

    try {
      const startTime = Date.now();
      let batchCount = 0;

      while (running && batchCount < BATCH_SIZE) {
        // TODO: clamp nonce to 0xFFFFFFFF, and change header if needed
        nonce++;

        const hash = await performHash(maybeCurrentChallenge.blockHeader, nonce);
        hashCount++;
        batchCount++;

        const { leadingBinaryZeroes: binary } = calculateLeadingZeroes(hash);
        if (binary >= (maybeCurrentChallenge.maybeTargetZeros ?? 10)) {
          const nonceLE = serializeNonceLE(nonce);
          console.log(`nonceLE: ${nonceLE}`)
          const nonceBE = nonceToU8ArrayBE(nonce);
          console.log(`nonceBE: ${nonceBE}`)

          const solution: MiningSolution = {
            hash,
            nonceVecU8: serializeNonceLE(nonce),
            maybeJobId: maybeCurrentChallenge.maybeJobId,
            maybeBlockHeader: maybeCurrentChallenge.blockHeader
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

      setTimeout(async () => await miningLoop(), sleepTime);
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
