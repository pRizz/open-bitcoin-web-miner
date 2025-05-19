import { MiningChallenge, MiningSolution } from "@/types/mining";
import { serializeNoncelessBlockHeader, serializeNonceLE } from "@/types/websocket";
import { calculateLeadingZeroesFromU8Array, hexStringFromU8Array } from "@/utils/mining";
import { nonceToU8ArrayBE } from "@/utils/nonceUtils";
import { doubleSha256BlockHeaderU8Array } from "./cpuMiningUtils";
import { WorkerMessage } from "./WorkerPool";

interface MiningState {
  running: boolean;
  hashCount: number;
  lastHashRateUpdateMs: number;
  miningSpeed: number;
  maybeCurrentChallenge: MiningChallenge | null;
  cumulativeHashes: number;
  }

const state: MiningState = {
  running: false,
  hashCount: 0,
  lastHashRateUpdateMs: Date.now(),
  miningSpeed: 100,
  maybeCurrentChallenge: null,
  cumulativeHashes: 0,
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
      targetZeros: maybeNewDifficulty
    };
  } else {
    console.error("Unhandled message type: ", type, " with data: ", e.data);
  }
};

function mine() {
  if (!state.maybeCurrentChallenge) return;

  // let nonce = Math.floor(Math.random() * 0xFFFFFF);
  let nonce = 0;
  const maybeUpdateHashRate = () => {
    const nowMs = Date.now();
    const elapsedMs = nowMs - state.lastHashRateUpdateMs;
    if (elapsedMs >= HASH_RATE_UPDATE_INTERVAL) {
      const msPerSecond = 1000;
      const hashRatePerSecond = state.hashCount / elapsedMs * msPerSecond;
      self.postMessage({ type: 'hashRate', data: hashRatePerSecond });
      state.hashCount = 0;
      state.lastHashRateUpdateMs = nowMs;
    }
  };

  const miningLoop = async () => {
    if (!state.running || !state.maybeCurrentChallenge) return;

    try {
      const startTime = Date.now();
      let hashesInBatchCount = 0;
      let blockHeaderAsU8Array = serializeNoncelessBlockHeader(state.maybeCurrentChallenge.noncelessBlockHeader, nonce);

      while (state.running && hashesInBatchCount < BATCH_SIZE) {
        nonce++;
        if (nonce > 0xFFFFFFFF) {
          console.log("Nonce overflowed, requesting new timestamp");
          // Notify main thread about nonce rollover
          self.postMessage({
            type: 'nonceRollover'
          });
          // Wait for new challenge with updated timestamp
          return;
        }

        blockHeaderAsU8Array = setNonceOnBlockHeaderAsU8Array(blockHeaderAsU8Array, nonce);
        const hashAsU8Array = await doubleSha256BlockHeaderU8Array(blockHeaderAsU8Array, nonce);
        state.hashCount++;
        state.cumulativeHashes++;
        hashesInBatchCount++;

        const { leadingBinaryZeroes } = calculateLeadingZeroesFromU8Array(hashAsU8Array);
        if (!state.maybeCurrentChallenge.targetZeros) {
          console.error("No target zeros set");
          throw new Error("No target zeros set");
        }
        if (leadingBinaryZeroes >= state.maybeCurrentChallenge.targetZeros) {
          console.log("Found solution with nonce:", nonce);
          const nonceLE = serializeNonceLE(nonce);
          const nonceBE = nonceToU8ArrayBE(nonce);
          const hashHex = hexStringFromU8Array(hashAsU8Array);
          console.log(`nonceLE: ${nonceLE}`);
          console.log(`nonceBE: ${nonceBE}`);
          console.log(`hashHex: ${hashHex}`);

          const solution: MiningSolution = {
            hash: hashHex,
            nonceVecU8: serializeNonceLE(nonce),
            noncelessBlockHeader: state.maybeCurrentChallenge.noncelessBlockHeader,
            cumulativeHashes: state.cumulativeHashes
          };
          self.postMessage({
            type: 'hash',
            data: solution
          });
          state.cumulativeHashes = 0; // Reset after sending
        }
      }

      maybeUpdateHashRate();

      // Calculate sleep time based on mining speed
      const elapsedBatchTimeMs = Date.now() - startTime;
      console.log("Elapsed batch time:", elapsedBatchTimeMs);
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

function setNonceOnBlockHeaderAsU8Array(blockHeaderAsU8Array: Uint8Array<ArrayBufferLike>, nonce: number): Uint8Array<ArrayBufferLike> {
  blockHeaderAsU8Array.set(serializeNonceLE(nonce), 76);
  return blockHeaderAsU8Array;
}
