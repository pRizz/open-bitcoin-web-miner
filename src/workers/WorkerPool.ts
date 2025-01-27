export class WorkerPool {
  private workers: Worker[] = [];
  private active = false;
  private hashRateSamples: number[] = [];
  private sampleWindowSize: number;
  private currentBlockHeader: any;
  private currentMiningSpeed: number;

  constructor(
    private threadCount: number,
    private onHashRate: (hashRate: number) => void,
    private onHash: (data: any) => void
  ) {
    this.sampleWindowSize = threadCount;
  }

  private calculateMovingAverage(newSample: number): number {
    // Add new sample
    this.hashRateSamples.push(newSample);
    
    // Keep only the last N samples where N is the thread count
    if (this.hashRateSamples.length > this.sampleWindowSize) {
      this.hashRateSamples.shift();
    }
    
    // Calculate moving average
    const sum = this.hashRateSamples.reduce((acc, val) => acc + val, 0);
    return sum / this.hashRateSamples.length;
  }

  start(blockHeader: any, miningSpeed: number) {
    this.active = true;
    this.hashRateSamples = []; // Reset samples on start
    this.currentBlockHeader = blockHeader;
    this.currentMiningSpeed = miningSpeed;
    
    this.createWorkers();
  }

  private createWorkers() {
    // Create workers based on thread count
    for (let i = 0; i < this.threadCount; i++) {
      const worker = new Worker(
        new URL('./miningWorker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e) => {
        const { type, data } = e.data;
        if (type === 'hash') {
          this.onHash(data);
        } else if (type === 'hashRate') {
          // Calculate moving average of hash rates
          const movingAverage = this.calculateMovingAverage(data);
          // Sum up the moving average across all threads
          this.onHashRate(movingAverage * this.threadCount);
        }
      };

      worker.postMessage({
        type: 'start',
        blockHeader: this.currentBlockHeader,
        miningSpeed: this.currentMiningSpeed,
        workerId: i,
      });

      this.workers.push(worker);
    }
  }

  stop() {
    this.active = false;
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.hashRateSamples = []; // Clear samples on stop
  }

  updateThreadCount(newThreadCount: number) {
    if (!this.active) {
      this.threadCount = newThreadCount;
      this.sampleWindowSize = newThreadCount;
      return;
    }

    // Stop all current workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.hashRateSamples = []; // Reset samples for new thread count

    // Update thread count and sample window
    this.threadCount = newThreadCount;
    this.sampleWindowSize = newThreadCount;

    // Create new workers with updated count
    this.createWorkers();
  }

  updateSpeed(miningSpeed: number) {
    this.currentMiningSpeed = miningSpeed;
    this.workers.forEach(worker => {
      worker.postMessage({
        type: 'updateSpeed',
        miningSpeed,
      });
    });
  }
}