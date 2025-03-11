import { HashSolution, MiningChallenge, MiningSolution } from "@/types/mining";
import { deserializeNonceLE, NoncelessBlockHeader, serializeBlockHeader, serializeNonceLE } from "@/types/websocket";
import { calculateLeadingZeroes } from "@/utils/mining";
import { nonceToU8ArrayBE } from "@/utils/nonceUtils";
import { performHash } from "./cpuMiningUtils";
import { WorkerMessage } from "./WorkerPool";

interface MiningState {
  running: boolean;
  hashCount: number;
  lastHashRateUpdate: number;
  miningSpeed: number;
  maybeCurrentChallenge: MiningChallenge | null;
}

const state: MiningState = {
  running: false,
  hashCount: 0,
  lastHashRateUpdate: Date.now(),
  miningSpeed: 100,
  maybeCurrentChallenge: null,
};

const HASH_RATE_UPDATE_INTERVAL = 1000; // 1 second
const BATCH_SIZE = 10000;

// Add global error handler for the worker
self.onerror = (error: ErrorEvent | string) => {
  const errorMessage = error instanceof ErrorEvent ? error.message : error;
  self.postMessage({
    type: 'error',
    data: `Mining worker error: ${errorMessage}`,
  });
  state.running = false;
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  console.log("Received message in worker:", e.data);
  const { type, maybeChallenge: maybeNewChallenge, maybeMiningSpeed: maybeNewSpeed } = e.data;

  if (type === 'start' && maybeNewChallenge) {
    state.running = true;
    state.miningSpeed = maybeNewSpeed ?? 100;
    state.maybeCurrentChallenge = maybeNewChallenge;
    mine();
  } else if (type === 'stop') {
    state.running = false;
    state.maybeCurrentChallenge = null;
  } else if (type === 'updateSpeed') {
    state.miningSpeed = maybeNewSpeed ?? 100;
  } else if (type === 'updateChallenge' && maybeNewChallenge) {
    console.log("Updating challenge in worker");
    state.maybeCurrentChallenge = maybeNewChallenge;
    // No need to restart mining, the loop will pick up the new challenge
  }
};

function mine() {
  if (!state.maybeCurrentChallenge) return;

  let nonce = 0;

  const updateHashRate = () => {
    const now = Date.now();
    const elapsed = now - state.lastHashRateUpdate;
    if (elapsed >= HASH_RATE_UPDATE_INTERVAL) {
      const hashRate = (state.hashCount * 1000) / elapsed;
      self.postMessage({ type: 'hashRate', data: hashRate });
      state.hashCount = 0;
      state.lastHashRateUpdate = now;
    }
  };

  const miningLoop = async () => {
    if (!state.running || !state.maybeCurrentChallenge) return;

    try {
      const startTime = Date.now();
      let batchCount = 0;

      while (state.running && batchCount < BATCH_SIZE) {
        // TODO: clamp nonce to 0xFFFFFFFF, and change header if needed
        nonce++;
        if (nonce > 0xFFFFFFFF) {
          console.error("Nonce overflowed, resetting to 0");
          nonce = 0;
        }
        
        const hash = await performHash(state.maybeCurrentChallenge.blockHeader, nonce);
        state.hashCount++;
        batchCount++;

        const { leadingBinaryZeroes: binary } = calculateLeadingZeroes(hash);
        if (binary >= (state.maybeCurrentChallenge.maybeTargetZeros ?? 10)) {
          console.log("Nonce:", nonce);
          const nonceLE = serializeNonceLE(nonce);
          console.log(`nonceLE: ${nonceLE}`)
          const nonceBE = nonceToU8ArrayBE(nonce);
          console.log(`nonceBE: ${nonceBE}`)

          const solution: MiningSolution = {
            hash,
            nonceVecU8: serializeNonceLE(nonce),
            maybeJobId: state.maybeCurrentChallenge.maybeJobId,
            maybeBlockHeader: state.maybeCurrentChallenge.blockHeader
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
      const targetTime = (BATCH_SIZE / 10000) * (100 / state.miningSpeed) * 100; // Adjust time based on mining speed
      const sleepTime = Math.max(0, targetTime - elapsedTime);

      setTimeout(async () => await miningLoop(), sleepTime);
    } catch (error) {
      self.postMessage({
        type: 'error',
        data: `Mining error: ${error instanceof Error ? error.message : String(error)}`,
      });
      state.running = false;
    }
  };

  miningLoop();
}
