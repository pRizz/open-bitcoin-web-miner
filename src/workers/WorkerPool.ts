import { MiningMode, MiningSolution, MiningChallenge } from "@/types/mining";
import { NoncelessBlockHeader } from "@/types/websocket";

export interface WorkerMessage {
  type: 'start' | 'stop' | 'updateSpeed' | 'updateChallenge' | 'updateDifficulty';
  maybeChallenge?: MiningChallenge;
  maybeMiningSpeed?: number;
  maybeWorkerId?: number;
  maybeNewDifficulty?: number;
}

export class WorkerPool {
  private cpuWorkers: Worker[] = [];
  private maybeWebGLWorker: Worker | null = null;
  private maybeWebGPUWorker: Worker | null = null;
  private active = false;
  private hashRateSamples: number[] = [];
  private sampleWindowSize: number = 1; // FIXME
  private maybeCurrentChallenge: MiningChallenge | null = null;
  // Every worker should get a unique timestamp so that the hashes are unique in each worker, so we need to increment this for each worker.
  private nextTimestampSeconds: number = Math.floor(Date.now() / 1000); // Current time in seconds

  private currentMiningSpeed: number;
  private currentMode: MiningMode = "cpu";
  private threadCount: number = 1; // FIXME
  onHashRate: (hashRate: number) => void = () => {};
  onSolution: (solution: MiningSolution) => void = () => {};
  onError: (error: string) => void = () => {};
  onGPUCapabilities: (capabilities: any) => void = () => {};

  constructor(
  ) {
    console.log("WorkerPool constructor called");
  }

  private calculateMovingAverage(newSampleHashRatePerSecond: number): number {
    console.log("Calculating moving average", newSampleHashRatePerSecond);
    this.hashRateSamples.push(newSampleHashRatePerSecond);

    if (this.hashRateSamples.length > this.sampleWindowSize) {
      this.hashRateSamples.shift();
    }

    const sum = this.hashRateSamples.reduce((acc, val) => acc + val, 0);
    // If mining mode is cpu, we need to multiply by the number of threads
    if (this.currentMode === "cpu") {
      return sum / this.hashRateSamples.length * this.threadCount;
    }
    return sum / this.hashRateSamples.length;
  }

  setMode(mode: MiningMode) {
    if (mode === this.currentMode) {
      return; // No change needed if mode is the same
    }

    // Stop only the current mode's workers
    if (this.currentMode === "cpu") {
      this.cpuWorkers.forEach(worker => worker.terminate());
      this.cpuWorkers = [];
    } else if (this.currentMode === "webgl" && this.maybeWebGLWorker) {
      this.maybeWebGLWorker.terminate();
      this.maybeWebGLWorker = null;
    } else if (this.currentMode === "webgpu" && this.maybeWebGPUWorker) {
      this.maybeWebGPUWorker.terminate();
      this.maybeWebGPUWorker = null;
    }

    this.currentMode = mode;
    this.hashRateSamples = []; // Reset hash rate samples for new mode

    // Start new mode's workers if mining is active
    if (this.active && this.maybeCurrentChallenge) {
      switch (mode) {
      case "cpu":
        this.createCPUWorkers();
        break;
      case "webgl":
        this.createWebGLWorker();
        break;
      case "webgpu":
        this.createWebGPUWorker();
        break;
      }
    }
  }

  start(challenge: MiningChallenge, miningSpeed: number) {
    if(this.active) {
      console.log("Worker pool is already active, so we're not starting it again.");
      return;
    }
    console.log("Starting worker pool with challenge:", challenge);
    this.active = true;
    this.hashRateSamples = [];
    this.maybeCurrentChallenge = challenge;
    this.currentMiningSpeed = miningSpeed;
    this.nextTimestampSeconds = Math.floor(Date.now() / 1000); // Reset to current time in seconds

    switch (this.currentMode) {
    case "cpu":
      this.createCPUWorkers();
      break;
    case "webgl":
      this.createWebGLWorker();
      break;
    case "webgpu":
      this.createWebGPUWorker();
      break;
    }
  }

  private createWorker(url: URL): Worker {
    try {
      // new URL('./cpuMiningWorker.ts', import.meta.url)
      // const worker = new Worker(url, { type: 'module' });
      // FIXME: This is a hack to get the worker to work in production.
      const worker = new Worker(new URL('./cpuMiningWorker.ts', import.meta.url), { type: 'module' });

      worker.onerror = (error: ErrorEvent) => {
        // Ensure we pass a meaningful error message
        const errorMessage = error.message || 'Unknown worker initialization error';
        this.onError(errorMessage);
        if (this.cpuWorkers.includes(worker)) {
          worker.terminate();
          this.cpuWorkers = this.cpuWorkers.filter(w => w !== worker);

          if (this.cpuWorkers.length === 0) {
            this.stop();
          }
        }
      };

      return worker;
    } catch (error) {
      if (this.onError) {
        // Ensure we pass a meaningful error message for other types of errors
        const errorMessage = error instanceof Error ? error.message : 'Failed to create worker';
        this.onError(errorMessage);
      }
      throw error;
    }
  }

  private getNextTimestampSeconds(): number {
    const timestamp = this.nextTimestampSeconds;
    this.nextTimestampSeconds++;
    return timestamp;
  }

  private timestampSecondsToHex(timestampSeconds: number): string {
    // Convert to 4 bytes (32 bits) little-endian hex string
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, timestampSeconds, true); // true for little-endian
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private createCPUWorkers() {
    try {
      console.log("Creating CPU workers", this.threadCount);
      for (let i = 0; i < this.threadCount; i++) {
        const worker = this.createWorker(
          new URL('./cpuMiningWorker.ts', import.meta.url)
        );

        this.setupWorkerOnMessageHandler(worker);
        this.updateTimestampAndStartWorker(worker, i);

        this.cpuWorkers.push(worker);
      }
    } catch (error) {
      if (this.onError) {
        this.onError(`Failed to initialize CPU workers: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private createWebGLWorker() {
    try {
      this.maybeWebGLWorker = this.createWorker(
        new URL('./webglMiningWorker.ts', import.meta.url)
      );
      this.setupWorkerOnMessageHandler(this.maybeWebGLWorker);
      this.updateTimestampAndStartWorker(this.maybeWebGLWorker, -1); // Use -1 as ID for WebGL worker
    } catch (error) {
      if (this.onError) {
        this.onError(`Failed to initialize WebGL worker: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private createWebGPUWorker() {
    try {
      this.maybeWebGPUWorker = this.createWorker(
        new URL('./webgpuMiningWorker.ts', import.meta.url)
      );
      this.setupWorkerOnMessageHandler(this.maybeWebGPUWorker);
      this.updateTimestampAndStartWorker(this.maybeWebGPUWorker, -2); // Use -2 as ID for WebGPU worker
    } catch (error) {
      if (this.onError) {
        this.onError(`Failed to initialize WebGPU worker: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private setupWorkerOnMessageHandler(worker: Worker) {
    worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === "hash") {
        const miningSolution = data as MiningSolution;
        const solution: MiningSolution = {
          hash: miningSolution.hash,
          nonceVecU8: miningSolution.nonceVecU8,
          noncelessBlockHeader: miningSolution.noncelessBlockHeader,
          cumulativeHashes: miningSolution.cumulativeHashes
        };
        this.onSolution(solution);
      } else if (type === "hashRate") {
        const movingAverage = this.calculateMovingAverage(data);
        this.onHashRate(movingAverage);
      } else if (type === "error" && this.onError) {
        this.onError(data);
      } else if (type === "gpuCapabilities" && this.onGPUCapabilities) {
        this.onGPUCapabilities(data);
      } else if (type === "nonceRollover") {
        // Send updated challenge with new timestamp
        this.updateTimestampAndWorkerChallenge(worker);
      }
    };
  }

  private updateTimestampAndWorkerChallenge(worker: Worker) {
    if (!this.maybeCurrentChallenge) return;
    const currentChallenge = this.maybeCurrentChallenge;

    const timestamp = this.getNextTimestampSeconds();
    const updatedChallenge: MiningChallenge = {
      ...currentChallenge,
      noncelessBlockHeader: {
        ...currentChallenge.noncelessBlockHeader,
        timestamp_hex: this.timestampSecondsToHex(timestamp)
      }
    };

    const message: WorkerMessage = {
      type: "updateChallenge",
      maybeChallenge: updatedChallenge
    };
    worker.postMessage(message);
  }

  private updateTimestampAndStartWorker(worker: Worker, workerId: number) {
    if (!this.maybeCurrentChallenge) return;
    const currentChallenge = this.maybeCurrentChallenge;

    const timestamp = this.getNextTimestampSeconds();
    const challengeWithTimestamp: MiningChallenge = {
      ...currentChallenge,
      noncelessBlockHeader: {
        ...currentChallenge.noncelessBlockHeader,
        timestamp_hex: this.timestampSecondsToHex(timestamp)
      }
    };

    const message: WorkerMessage = {
      type: "start",
      maybeChallenge: challengeWithTimestamp,
      maybeMiningSpeed: this.currentMiningSpeed,
      maybeWorkerId: workerId
    };
    worker.postMessage(message);
  }

  stop() {
    this.active = false;
    this.cpuWorkers.forEach(worker => worker.terminate());
    if (this.maybeWebGLWorker) {
      this.maybeWebGLWorker.terminate();
      this.maybeWebGLWorker = null;
    }
    if (this.maybeWebGPUWorker) {
      this.maybeWebGPUWorker.terminate();
      this.maybeWebGPUWorker = null;
    }
    this.cpuWorkers = [];
    this.hashRateSamples = [];
  }

  updateThreadCount(newThreadCount: number) {
    if (!this.active) {
      this.threadCount = newThreadCount;
      this.sampleWindowSize = newThreadCount;
      return;
    }

    if (newThreadCount === this.threadCount) {
      return;
    }

    this.cpuWorkers.forEach(worker => worker.terminate());
    this.cpuWorkers = [];
    this.hashRateSamples = [];

    this.threadCount = newThreadCount;
    this.sampleWindowSize = newThreadCount;

    if (this.currentMode === "cpu") {
      this.createCPUWorkers();
    }
  }

  updateSpeed(miningSpeed: number) {
    console.log("Updating speed in worker pool:", miningSpeed);
    if (miningSpeed === this.currentMiningSpeed) {
      console.log("Speed is the same, so we're not updating it");
      return;
    }

    this.currentMiningSpeed = miningSpeed;

    const updateWorker = (maybeWorker: Worker | null) => {
      if (maybeWorker) {
        const message: WorkerMessage = {
          type: "updateSpeed",
          maybeMiningSpeed: miningSpeed,
        };
        maybeWorker.postMessage(message);
      }
    };

    this.cpuWorkers.forEach(updateWorker);
    updateWorker(this.maybeWebGLWorker);
    updateWorker(this.maybeWebGPUWorker);
  }

  updateChallenge(challenge: MiningChallenge) {
    console.log("Updating challenge in worker pool:", challenge);
    this.maybeCurrentChallenge = challenge;

    // Update all active workers with new challenge
    const message: WorkerMessage = {
      type: "updateChallenge",
      maybeChallenge: this.maybeCurrentChallenge
    };

    this.cpuWorkers.forEach(worker => worker.postMessage(message));
    if (this.maybeWebGLWorker) this.maybeWebGLWorker.postMessage(message);
    if (this.maybeWebGPUWorker) this.maybeWebGPUWorker.postMessage(message);
  }

  updateDifficulty(newDifficulty: number) {
    console.log("Updating difficulty in worker pool:", newDifficulty);
    if (this.maybeCurrentChallenge) {
      this.maybeCurrentChallenge = {
        ...this.maybeCurrentChallenge,
        targetZeros: newDifficulty
      };
    }

    const message: WorkerMessage = {
      type: "updateDifficulty",
      maybeNewDifficulty: newDifficulty
    };

    this.cpuWorkers.forEach(worker => worker.postMessage(message));
    if (this.maybeWebGLWorker) this.maybeWebGLWorker.postMessage(message);
    if (this.maybeWebGPUWorker) this.maybeWebGPUWorker.postMessage(message);
  }
}