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

  private createWebGLWorker() {
    this.webglWorker = new Worker(
      new URL('./webglMiningWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.setupWorkerHandlers(this.webglWorker);
  }

  private createWebGPUWorker() {
    this.webgpuWorker = new Worker(
      new URL('./webgpuMiningWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.setupWorkerHandlers(this.webgpuWorker);
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