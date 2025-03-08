import { MiningMode, MiningSolution, MiningChallenge } from "@/types/mining";
import { NoncelessBlockHeader } from "@/types/websocket";

export class WorkerPool {
  private cpuWorkers: Worker[] = [];
  private maybeWebGLWorker: Worker | null = null;
  private maybeWebGPUWorker: Worker | null = null;
  private active = false;
  private hashRateSamples: number[] = [];
  private sampleWindowSize: number;
  private maybeCurrentChallenge: MiningChallenge | null = null;
  private currentMiningSpeed: number;
  private currentMode: MiningMode = "cpu";

  constructor(
    private threadCount: number,
    private onHashRate: (hashRate: number) => void,
    private onHash: (solution: MiningSolution) => void,
    private onError?: (error: string) => void,
    private onGPUCapabilities?: (capabilities: any) => void
  ) {
    this.sampleWindowSize = threadCount;
  }

  private calculateMovingAverage(newSample: number): number {
    this.hashRateSamples.push(newSample);

    if (this.hashRateSamples.length > this.sampleWindowSize) {
      this.hashRateSamples.shift();
    }

    const sum = this.hashRateSamples.reduce((acc, val) => acc + val, 0);
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
      const worker = new Worker(url, { type: 'module' });

      worker.onerror = (error: ErrorEvent) => {
        if (this.onError) {
          // Ensure we pass a meaningful error message
          const errorMessage = error.message || 'Unknown worker initialization error';
          this.onError(errorMessage);
        }
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

  private createCPUWorkers() {
    try {
      for (let i = 0; i < this.threadCount; i++) {
        const worker = this.createWorker(
          new URL('./cpuMiningWorker.ts', import.meta.url)
        );

        worker.onmessage = (e) => {
          const { type, data } = e.data;
          if (type === "hash") {
            const solution: MiningSolution = {
              hash: data.hash,
              nonce: data.nonce,
              maybeJobId: this.maybeCurrentChallenge?.maybeJobId,
              maybeBlockHeader: this.maybeCurrentChallenge?.blockHeader
            };
            this.onHash(solution);
          } else if (type === "hashRate") {
            const movingAverage = this.calculateMovingAverage(data);
            this.onHashRate(movingAverage * this.threadCount);
          }
        };

        worker.postMessage({
          type: "start",
          challenge: this.maybeCurrentChallenge,
          miningSpeed: this.currentMiningSpeed,
          workerId: i,
        });

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
      this.setupWorkerHandlers(this.maybeWebGLWorker);
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
      this.setupWorkerHandlers(this.maybeWebGPUWorker);
    } catch (error) {
      if (this.onError) {
        this.onError(`Failed to initialize WebGPU worker: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private setupWorkerHandlers(worker: Worker) {
    worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === "hash") {
        const solution: MiningSolution = {
          hash: data.hash,
          nonce: data.nonce,
          maybeJobId: this.maybeCurrentChallenge?.maybeJobId,
          maybeBlockHeader: this.maybeCurrentChallenge?.blockHeader
        };
        this.onHash(solution);
      } else if (type === "hashRate") {
        const movingAverage = this.calculateMovingAverage(data);
        this.onHashRate(movingAverage);
      } else if (type === "error" && this.onError) {
        this.onError(data);
      } else if (type === "gpuCapabilities" && this.onGPUCapabilities) {
        this.onGPUCapabilities(data);
      }
    };

    worker.postMessage({
      type: "start",
      challenge: this.maybeCurrentChallenge,
      miningSpeed: this.currentMiningSpeed,
    });
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
    this.currentMiningSpeed = miningSpeed;
    this.cpuWorkers.forEach(worker => {
      worker.postMessage({
        type: "updateSpeed",
        miningSpeed,
      });
    });

    const updateWorker = (maybeWorker: Worker | null) => {
      if (maybeWorker) {
        maybeWorker.postMessage({
          type: "updateSpeed",
          miningSpeed,
        });
      }
    };

    updateWorker(this.maybeWebGLWorker);
    updateWorker(this.maybeWebGPUWorker);
  }

  updateChallenge(challenge: MiningChallenge & { maybeKeepExisting?: boolean }) {
    if (challenge.maybeKeepExisting && this.maybeCurrentChallenge) {
      // Only update the block header, keep existing jobId and targetZeros
      this.maybeCurrentChallenge = {
        ...this.maybeCurrentChallenge,
        blockHeader: challenge.blockHeader
      };
    } else {
      this.maybeCurrentChallenge = challenge;
    }

    // Update all active workers with new challenge
    const message = {
      type: "updateChallenge",
      challenge: this.maybeCurrentChallenge
    };

    this.cpuWorkers.forEach(worker => worker.postMessage(message));
    if (this.maybeWebGLWorker) this.maybeWebGLWorker.postMessage(message);
    if (this.maybeWebGPUWorker) this.maybeWebGPUWorker.postMessage(message);
  }
}