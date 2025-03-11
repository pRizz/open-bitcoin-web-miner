import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkerPool } from "@/workers/WorkerPool";
import { useToast } from "@/hooks/use-toast";
import { MiningMode, MiningSolution, MiningChallenge } from "@/types/mining";
import { GPUCapabilities } from './types';

export const useWorkerPool = (
  threadCount: number,
  miningSpeed: number,
  miningMode: MiningMode,
  onHashRate: (rate: number) => void,
  onSolution: (solution: MiningSolution) => void,
) => {
  console.log("useWorkerPool called");
  const { toast } = useToast();
  const [gpuCapabilities, setGpuCapabilities] = useState<GPUCapabilities>();
  const [maybeCurrentChallenge, setCurrentChallenge] = useState<MiningChallenge | null>(null);

  const workerPool = useRef<WorkerPool>(new WorkerPool());
  workerPool.current.updateThreadCount(threadCount);
  workerPool.current.updateSpeed(miningSpeed);
  workerPool.current.setMode(miningMode);
  workerPool.current.onHashRate = onHashRate;
  workerPool.current.onHash = onSolution;
  workerPool.current.onError = (error) => {
    toast({
      title: "Mining Error",
      description: error,
      variant: "destructive",
    });
    stopMining();
  };
  workerPool.current.onGPUCapabilities = (capabilities) => {
    setGpuCapabilities(capabilities);
  };

  useEffect(() => {
    return () => {
      if (workerPool.current) {
        workerPool.current.stop();
      }
    };
  }, [workerPool]);

  useEffect(() => {
    if (workerPool.current) {
      workerPool.current.updateSpeed(miningSpeed);
    }
  }, [miningSpeed, workerPool]);

  useEffect(() => {
    if (workerPool.current) {
      const timeoutId = setTimeout(() => {
        workerPool.current.setMode(miningMode);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [miningMode, workerPool]);

  const updateMiningChallenge = useCallback((challenge: MiningChallenge) => {
    console.log("Updating mining challenge:", challenge);
    console.log("Current worker pool state:", workerPool ? "exists" : "null");
    setCurrentChallenge(prev => {
      if (challenge.maybeKeepExisting && prev) {
        console.log("Keeping existing challenge; updating block header");
        return {
          ...prev,
          blockHeader: challenge.blockHeader
        };
      }
      return challenge;
    });

    if (workerPool.current) {
      console.log("Updating challenge in worker pool");
      workerPool.current.updateChallenge(challenge);
      workerPool.current.start(challenge, miningSpeed);
    }
  }, [workerPool, miningSpeed]);

  const startMining = useCallback(() => {
    try {
      workerPool.current.setMode(miningMode);

      // Only start if we have a challenge
      if (maybeCurrentChallenge) {
        workerPool.current.start(maybeCurrentChallenge, miningSpeed);
      } else {
        console.log("Started worker pool with no challenge, yet.");
      }
    } catch (error) {
      toast({
        title: "Failed to Start Mining",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      stopMining();
    }
  }, [threadCount, miningMode, miningSpeed, maybeCurrentChallenge, workerPool, onHashRate, onSolution, toast]);

  const stopMining = useCallback(() => {
    console.log("Stopping mining");
    setCurrentChallenge(null);
    workerPool.current.stop();
  }, []);

  const updateThreadCount = useCallback((count: number) => {
    if (workerPool.current) {
      workerPool.current.updateThreadCount(count);
    }
  }, [workerPool]);

  return {
    gpuCapabilities,
    startMining,
    stopMining,
    updateThreadCount,
    updateMiningChallenge,
  };
};