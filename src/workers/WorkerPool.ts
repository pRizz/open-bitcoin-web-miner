import { MiningMode } from "@/types/mining";

export class WorkerPool {
  private cpuWorkers: Worker[] = [];
  private webglWorker: Worker | null = null;
  private webgpuWorker: Worker | null = null;
  private active = false;
  private hashRateSamples: number[] = [];
  private sampleWindowSize: number;
  private currentBlockHeader: any;
  private currentMiningSpeed: number;
  private currentMode: MiningMode = "cpu";

  constructor(
    private threadCount: number,
    private onHashRate: (hashRate: number) => void,
    private onHash: (data: any) => void,
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
    } else if (this.currentMode === "webgl" && this.webglWorker) {
      this.webglWorker.terminate();
      this.webglWorker = null;
    } else if (this.currentMode === "webgpu" && this.webgpuWorker) {
      this.webgpuWorker.terminate();
      this.webgpuWorker = null;
    }

    this.currentMode = mode;
    this.hashRateSamples = []; // Reset hash rate samples for new mode

    // Start new mode's workers if mining is active
    if (this.active && this.currentBlockHeader) {
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

  start(blockHeader: any, miningSpeed: number) {
    this.active = true;
    this.hashRateSamples = [];
    this.currentBlockHeader = blockHeader;
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
          new URL('./miningWorker.ts', import.meta.url)
        );

        worker.onmessage = (e) => {
          const { type, data } = e.data;
          if (type === "hash") {
            this.onHash(data);
          } else if (type === "hashRate") {
            const movingAverage = this.calculateMovingAverage(data);
            this.onHashRate(movingAverage * this.threadCount);
          }
        };

        worker.postMessage({
          type: "start",
          blockHeader: this.currentBlockHeader,
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
      this.webglWorker = this.createWorker(
        new URL('./webglMiningWorker.ts', import.meta.url)
      );
      this.setupWorkerHandlers(this.webglWorker);
    } catch (error) {
      if (this.onError) {
        this.onError(`Failed to initialize WebGL worker: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private createWebGPUWorker() {
    try {
      this.webgpuWorker = this.createWorker(
        new URL('./webgpuMiningWorker.ts', import.meta.url)
      );
      this.setupWorkerHandlers(this.webgpuWorker);
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
        this.onHash(data);
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
      blockHeader: this.currentBlockHeader,
      miningSpeed: this.currentMiningSpeed,
    });
  }

  stop() {
    this.active = false;
    this.cpuWorkers.forEach(worker => worker.terminate());
    if (this.webglWorker) {
      this.webglWorker.terminate();
      this.webglWorker = null;
    }
    if (this.webgpuWorker) {
      this.webgpuWorker.terminate();
      this.webgpuWorker = null;
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
    
    const updateWorker = (worker: Worker | null) => {
      if (worker) {
        worker.postMessage({
          type: "updateSpeed",
          miningSpeed,
        });
      }
    };

    updateWorker(this.webglWorker);
    updateWorker(this.webgpuWorker);
  }
}