import { useState } from "react";
import { MiningStats, HashSolution } from "@/types/mining";
import { useToast } from "@/hooks/use-toast";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { WorkMetadata } from "@/types/websocket";
import { hexStringFromU8Array } from "@/utils/mining";
const STORAGE_KEY = "bitcoin-mining-simulator";

export const useMiningState = () => {
  console.log("useMiningState called");
  const { toast } = useToast();
  const { maybeRequiredBinaryZeroes } = useNetworkInfo();
  const [miningStats, setMiningStats] = useState<MiningStats>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      maybeHashRate: 0,
      maybeBestHashes: [],
      maybeSubmittedHashes: [],
      maybeTotalHashes: 0,
      maybeStartTime: null,
      maybeRequiredBinaryZeroes: 0,
      acceptedHashes: 0,
      rejectedHashes: 0,
    };
  });

  const updateMiningStats = (solution: HashSolution) => {
    setMiningStats(prev => {
      // Calculate time to find if mining has started
      const timeToFind = prev.maybeStartTime ? Date.now() - prev.maybeStartTime : 0;
      const solutionWithTime = { ...solution, timeToFind };

      const updatedHashes = [solutionWithTime, ...(prev.maybeBestHashes || [])]
        .sort((a, b) => b.binaryZeroes - a.binaryZeroes)
        .slice(0, 100);

      if (solution.binaryZeroes >= maybeRequiredBinaryZeroes) {
        toast({
          title: "Block Found!",
          description: `Found a hash with ${solution.binaryZeroes} leading binary zeroes!`,
          variant: "default",
        });
      }

      return {
        ...prev,
        maybeBestHashes: updatedHashes,
        maybeTotalHashes: (prev.maybeTotalHashes || 0) + 1,
      };
    });
  };

  const updateHashRate = (hashRate: number) => {
    setMiningStats(prev => ({
      ...prev,
      maybeHashRate: hashRate,
    }));
  };

  const updateRequiredBinaryZeroes = (requiredBinaryZeroes: number) => {
    setMiningStats(prev => ({
      ...prev,
      maybeRequiredBinaryZeroes: requiredBinaryZeroes,
    }));
  };

  const updateSubmissionStats = ({isAccepted, workMetadata}: {isAccepted: boolean, workMetadata: WorkMetadata}) => {
    console.log("updateSubmissionStats called with isAccepted", isAccepted, "workMetadata", workMetadata);
    setMiningStats(prev => {
      const submittedHashes = prev.maybeSubmittedHashes || [];
      const block_header_hash_as_hex = hexStringFromU8Array(new Uint8Array(workMetadata.block_header_hash));
      console.log("submittedHashes", submittedHashes);
      const updatedHashes = submittedHashes.map(h => {
        console.log("h.hash", h.hash, "block_header_hash_as_hex", block_header_hash_as_hex);
        return h.hash === block_header_hash_as_hex ? { ...h, status: isAccepted ? 'accepted' as const : 'rejected' as const } : h
      });

      return {
        ...prev,
        acceptedHashes: isAccepted ? (prev.acceptedHashes + 1) : prev.acceptedHashes,
        rejectedHashes: !isAccepted ? (prev.rejectedHashes + 1) : prev.rejectedHashes,
        maybeSubmittedHashes: updatedHashes,
      };
    });
  };

  const addSubmittedHash = (solution: HashSolution) => {
    setMiningStats(prev => ({
      ...prev,
      maybeSubmittedHashes: [
        { ...solution, status: 'pending' as const },
        ...(prev.maybeSubmittedHashes || [])
      ].slice(0, 100), // Keep last 100 submissions
    }));
  };

  const resetStats = () => {
    setMiningStats({
      maybeHashRate: 0,
      maybeBestHashes: [],
      maybeSubmittedHashes: [],
      maybeTotalHashes: 0,
      maybeStartTime: null,
      maybeRequiredBinaryZeroes: 0,
      acceptedHashes: 0,
      rejectedHashes: 0,
    });
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Data Reset",
      description: "All mining data has been cleared.",
      variant: "default",
    });
  };

  const startMining = () => {
    setMiningStats(prev => ({
      ...prev,
      maybeStartTime: Date.now(),
    }));
  };

  const stopMining = () => {
    setMiningStats(prev => ({
      ...prev,
      maybeHashRate: 0,
      maybeStartTime: null,
    }));
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