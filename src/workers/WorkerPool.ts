import { MiningMode } from "@/types/mining";

export class WorkerPool {
  private cpuWorkers: Worker[] = [];
  private gpuWorker: Worker | null = null;
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
    private onError?: (error: string) => void
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
    if (this.active) {
      this.stop();
    }
    this.currentMode = mode;
    if (this.active) {
      this.start(this.currentBlockHeader, this.currentMiningSpeed);
    }
  }

  start(blockHeader: any, miningSpeed: number) {
    this.active = true;
    this.hashRateSamples = [];
    this.currentBlockHeader = blockHeader;
    this.currentMiningSpeed = miningSpeed;
    
    if (this.currentMode === "cpu" || this.currentMode === "hybrid") {
      this.createCPUWorkers();
    }
    
    if (this.currentMode === "gpu" || this.currentMode === "hybrid") {
      this.createGPUWorker();
    }
  }

  private createCPUWorkers() {
    for (let i = 0; i < this.threadCount; i++) {
      const worker = new Worker(
        new URL('./miningWorker.ts', import.meta.url),
        { type: 'module' }
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
  }

  private createGPUWorker() {
    this.gpuWorker = new Worker(
      new URL('./gpuMiningWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.gpuWorker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === "hash") {
        this.onHash(data);
      } else if (type === "hashRate") {
        const movingAverage = this.calculateMovingAverage(data);
        this.onHashRate(movingAverage);
      } else if (type === "error" && this.onError) {
        this.onError(data);
      }
    };

    this.gpuWorker.postMessage({
      type: "start",
      blockHeader: this.currentBlockHeader,
      miningSpeed: this.currentMiningSpeed,
    });
  }

  stop() {
    this.active = false;
    this.cpuWorkers.forEach(worker => worker.terminate());
    if (this.gpuWorker) {
      this.gpuWorker.terminate();
      this.gpuWorker = null;
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

    if (this.currentMode === "cpu" || this.currentMode === "hybrid") {
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
    if (this.gpuWorker) {
      this.gpuWorker.postMessage({
        type: "updateSpeed",
        miningSpeed,
      });
    }
  }
}