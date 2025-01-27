export class WorkerPool {
  private workers: Worker[] = [];
  private active = false;
  private hashRateSamples: number[] = [];
  private sampleWindowSize: number;

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
        blockHeader,
        miningSpeed,
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

  updateSpeed(miningSpeed: number) {
    this.workers.forEach(worker => {
      worker.postMessage({
        type: 'updateSpeed',
        miningSpeed,
      });
    });
  }
}
