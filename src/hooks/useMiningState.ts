import { useState, useEffect } from "react";
import { MiningStats, HashSolution, SessionMiningStats, PersistentMiningStats } from "@/types/mining";
import { useToast } from "@/hooks/use-toast";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { MiningSubmissionStatus, WorkMetadata } from "@/types/websocket";
import { hexStringFromU8Array } from "@/utils/mining";

const STORAGE_KEY = "bitcoin-mining-simulator";

const defaultPersistentStats: PersistentMiningStats = {
  maybeBestSolutions: [],
  maybeSubmittedSolutions: [],
  maybeTotalSolutions: 0,
  cumulativeHashes: 0,
  acceptedSolutions: 0,
  rejectedSolutions: 0,
};

const defaultSessionStats: SessionMiningStats = {
  maybeHashRate: 0,
  maybeStartTime: null,
  maybeRequiredBinaryZeroes: 0,
};

export const useMiningState = () => {
  console.log("useMiningState called");
  const { toast } = useToast();
  const { maybeRequiredBinaryZeroes } = useNetworkInfo();

  const [persistentStats, setPersistentStats] = useState<PersistentMiningStats>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultPersistentStats;
  });

  const [sessionStats, setSessionStats] = useState<SessionMiningStats>(() => ({
    ...defaultSessionStats,
    maybeRequiredBinaryZeroes,
  }));

  const updateMiningStats = (solution: HashSolution, cumulativeHashes: number) => {
    // Update session stats
    setSessionStats(prev => {
      const timeToFind = prev.maybeStartTime ? Date.now() - prev.maybeStartTime : 0;
      const solutionWithTime = { ...solution, timeToFind };

      if (solution.binaryZeroes >= maybeRequiredBinaryZeroes) {
        toast({
          title: "Block Found!",
          description: `Found a hash with ${solution.binaryZeroes} leading binary zeroes!`,
          variant: "default",
        });
      }

      return prev;
    });

    // Update persistent stats
    setPersistentStats(prev => {
      const updatedHashes = [solution, ...(prev.maybeBestSolutions || [])]
        .sort((a, b) => b.binaryZeroes - a.binaryZeroes)
        .slice(0, 100);

      return {
        ...prev,
        maybeBestSolutions: updatedHashes,
        maybeTotalSolutions: (prev.maybeTotalSolutions || 0) + 1,
        cumulativeHashes: prev.cumulativeHashes + cumulativeHashes,
      };
    });
  };

  const updateHashRate = (hashRate: number) => {
    setSessionStats(prev => ({
      ...prev,
      maybeHashRate: hashRate,
    }));
  };

  const updateRequiredBinaryZeroes = (requiredBinaryZeroes: number) => {
    setSessionStats(prev => ({
      ...prev,
      maybeRequiredBinaryZeroes: requiredBinaryZeroes,
    }));
  };

  const updateSubmissionStats = ({workMetadata}: {workMetadata: WorkMetadata}) => {
    const isAccepted = workMetadata.status === MiningSubmissionStatus.ACCEPTED || workMetadata.status === MiningSubmissionStatus.ACCEPTED_AND_FOUND_BLOCK;
    console.log("updateSubmissionStats called with isAccepted", isAccepted, "workMetadata", workMetadata);
    setPersistentStats(prev => {
      const submittedHashes = prev.maybeSubmittedSolutions || [];
      const block_header_hash_as_hex = hexStringFromU8Array(new Uint8Array(workMetadata.block_header_hash));
      console.log("submittedHashes", submittedHashes);
      const updatedHashes = submittedHashes.map(h => {
        return h.hash === block_header_hash_as_hex ? { ...h, status: isAccepted ? 'accepted' as const : 'rejected' as const } : h
      });

      return {
        ...prev,
        acceptedSolutions: isAccepted ? (prev.acceptedSolutions + 1) : prev.acceptedSolutions,
        rejectedSolutions: !isAccepted ? (prev.rejectedSolutions + 1) : prev.rejectedSolutions,
        maybeSubmittedSolutions: updatedHashes,
      };
    });
  };

  const addSubmittedHash = (solution: HashSolution) => {
    setPersistentStats(prev => ({
      ...prev,
      maybeSubmittedSolutions: [
        { ...solution, status: 'pending' as const },
        ...(prev.maybeSubmittedSolutions || [])
      ].slice(0, 100), // Keep last 100 submissions
    }));
  };

  const resetStats = () => {
    setPersistentStats(defaultPersistentStats);
    setSessionStats({
      ...defaultSessionStats,
      maybeRequiredBinaryZeroes,
    });
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Data Reset",
      description: "All mining data has been cleared.",
      variant: "default",
    });
  };

  const startMining = () => {
    setSessionStats(prev => ({
      ...prev,
      maybeStartTime: Date.now(),
    }));
  };

  const stopMining = () => {
    setSessionStats(prev => ({
      ...prev,
      maybeHashRate: 0,
      maybeStartTime: null,
    }));
  };

  // Save persistent stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentStats));
  }, [persistentStats]);

  // Combine session and persistent stats for the return value
  const miningStats: MiningStats = {
    ...sessionStats,
    ...persistentStats,
  };

  return {
    miningStats,
    updateMiningStats,
    updateHashRate,
    updateRequiredBinaryZeroes,
    updateSubmissionStats,
    addSubmittedHash,
    resetStats,
    startMining,
    stopMining,
  };
};