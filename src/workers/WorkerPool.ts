export class WorkerPool {
  private workers: Worker[] = [];
  private active = false;

  constructor(
    private threadCount: number,
    private onHashRate: (hashRate: number) => void,
    private onHash: (data: any) => void
  ) {}

  start(blockHeader: any, miningSpeed: number) {
    this.active = true;
    
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
          // Aggregate hash rates from all workers
          this.onHashRate(data * this.threadCount);
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