import { useState, useEffect, useCallback } from 'react';
import { WorkerPool } from "@/workers/WorkerPool";
import { useToast } from "@/hooks/use-toast";
import { MiningMode } from "@/types/mining";
import { generateMockBlockHeader } from "@/utils/mining";
import { GPUCapabilities } from './types';

export const useWorkerPool = (
  threadCount: number,
  miningSpeed: number,
  miningMode: MiningMode,
  onHashRate: (rate: number) => void,
  onSolution: (data: any) => void,
) => {
  const { toast } = useToast();
  const [workerPool, setWorkerPool] = useState<WorkerPool | null>(null);
  const [gpuCapabilities, setGpuCapabilities] = useState<GPUCapabilities>();

  useEffect(() => {
    return () => {
      if (workerPool) {
        workerPool.stop();
        setWorkerPool(null);
      }
    };
  }, [workerPool]);

  useEffect(() => {
    if (workerPool) {
      workerPool.updateSpeed(miningSpeed);
    }
  }, [miningSpeed, workerPool]);

  useEffect(() => {
    if (workerPool) {
      const timeoutId = setTimeout(() => {
        workerPool.setMode(miningMode);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [miningMode, workerPool]);

  const startMining = () => {
    if (workerPool) return;

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
      pool.start(generateMockBlockHeader(), miningSpeed);
    } catch (error) {
      toast({
        title: "Failed to Start Mining",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      stopMining();
    }
  };

  const stopMining = useCallback(() => {
    setWorkerPool((currentPool) => {
      if (currentPool) {
        currentPool.stop();
      }
      return null;
    });
  }, []);

  const updateThreadCount = (count: number) => {
    if (workerPool) {
      workerPool.updateThreadCount(count);
    }
  };

  return {
    gpuCapabilities,
    startMining,
    stopMining,
    updateThreadCount,
  };
};