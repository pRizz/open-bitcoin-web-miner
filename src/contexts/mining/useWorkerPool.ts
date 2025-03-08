import { useState, useEffect, useCallback } from 'react';
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
  const { toast } = useToast();
  const [maybeWorkerPool, setWorkerPool] = useState<WorkerPool | null>(null);
  const [gpuCapabilities, setGpuCapabilities] = useState<GPUCapabilities>();
  const [maybeCurrentChallenge, setCurrentChallenge] = useState<MiningChallenge | null>(null);

  useEffect(() => {
    return () => {
      if (maybeWorkerPool) {
        maybeWorkerPool.stop();
        setWorkerPool(null);
      }
    };
  }, [maybeWorkerPool]);

  useEffect(() => {
    if (maybeWorkerPool) {
      maybeWorkerPool.updateSpeed(miningSpeed);
    }
  }, [miningSpeed, maybeWorkerPool]);

  useEffect(() => {
    if (maybeWorkerPool) {
      const timeoutId = setTimeout(() => {
        maybeWorkerPool.setMode(miningMode);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [miningMode, maybeWorkerPool]);

  const updateMiningChallenge = useCallback((challenge: MiningChallenge) => {
    setCurrentChallenge(prev => {
      if (challenge.keepExisting && prev) {
        return {
          ...prev,
          blockHeader: challenge.blockHeader
        };
      }
      return challenge;
    });

    if (maybeWorkerPool) {
      maybeWorkerPool.updateChallenge(challenge);
    }
  }, [maybeWorkerPool]);

  const startMining = useCallback(() => {
    if (maybeWorkerPool) return;

    try {
      const pool = new WorkerPool(
        threadCount,
        onHashRate,
        onSolution,
        (error) => {
          toast({
            title: "Mining Error",
            description: error,
            variant: "destructive",
          });
          stopMining();
        },
        (capabilities) => {
          setGpuCapabilities(capabilities);
        }
      );

      setWorkerPool(pool);
      pool.setMode(miningMode);

      // Only start if we have a challenge
      if (maybeCurrentChallenge) {
        pool.start(maybeCurrentChallenge, miningSpeed);
      } else {
        console.error("No challenge provided");
      }
    } catch (error) {
      toast({
        title: "Failed to Start Mining",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      stopMining();
    }
  }, [threadCount, miningMode, miningSpeed, maybeCurrentChallenge, onHashRate, onSolution, toast]);

  const stopMining = useCallback(() => {
    setWorkerPool((currentPool) => {
      if (currentPool) {
        currentPool.stop();
      }
      return null;
    });
  }, []);

  const updateThreadCount = useCallback((count: number) => {
    if (maybeWorkerPool) {
      maybeWorkerPool.updateThreadCount(count);
    }
  }, [maybeWorkerPool]);

  return {
    gpuCapabilities,
    startMining,
    stopMining,
    updateThreadCount,
    updateMiningChallenge,
  };
};