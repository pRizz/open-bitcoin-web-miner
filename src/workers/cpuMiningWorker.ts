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
  const { type, maybeChallenge: maybeNewChallenge, maybeMiningSpeed: maybeNewSpeed, maybeNewDifficulty } = e.data;

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
  } else if (type === 'updateDifficulty' && maybeNewDifficulty !== undefined && state.maybeCurrentChallenge) {
    console.log("Updating difficulty in worker to:", maybeNewDifficulty);
    state.maybeCurrentChallenge = {
      ...state.maybeCurrentChallenge,
      maybeTargetZeros: maybeNewDifficulty
    };
  } else {
    console.error("Unhandled message type: ", type, " with data: ", e.data);
  }
};

function mine() {
  if (!state.maybeCurrentChallenge) return;

  let nonce = Math.floor(Math.random() * 0xFFFFFF);

  const maybeUpdateHashRate = () => {
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
      let hashesInBatchCount = 0;

      while (state.running && hashesInBatchCount < BATCH_SIZE) {
        // TODO: clamp nonce to 0xFFFFFFFF, and change header if needed
        nonce++;
        if (nonce > 0xFFFFFFFF) {
          console.error("Nonce overflowed, resetting to 0");
          nonce = 0;
        }

        const hash = await performHash(state.maybeCurrentChallenge.blockHeader, nonce);
        state.hashCount++;
        hashesInBatchCount++;

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

      maybeUpdateHashRate();

      // Calculate sleep time based on mining speed
      const elapsedBatchTimeMs = Date.now() - startTime;
      // Whatever elapsedBatchTimeMs is, if speed is 100, we sleep 0ms
      // If speed is 50, we sleep for elapsedBatchTimeMs
      // If speed is 10, we sleep for 9 * elapsedBatchTimeMs
      const sleepTimeMs = Math.max(0, (100 / state.miningSpeed) * elapsedBatchTimeMs - elapsedBatchTimeMs);
      console.log("Sleeping for", sleepTimeMs, "ms");
      setTimeout(async () => await miningLoop(), sleepTimeMs);
    } catch (error) {
      console.error("Mining error:", error);
      self.postMessage({
        type: 'error',
        data: `Mining error: ${error instanceof Error ? error.message : String(error)}`,
      });
      state.running = false;
    }
  };

  miningLoop();
}
