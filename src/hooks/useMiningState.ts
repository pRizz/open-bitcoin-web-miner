import { useState, useEffect } from "react";
import {
  FoundHashSolution,
  MiningStats,
  PersistentMiningStats,
  SessionMiningStats,
  SubmittedHashSolution,
  SubmissionStatus,
} from "@/types/mining";
import { showInfo } from "@/utils/notifications";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { MiningSubmissionStatus, WorkMetadata } from "@/types/websocket";

const STORAGE_KEY = "bitcoin-mining-simulator";

function buildDefaultPersistentStats(): PersistentMiningStats {
  return {
    maybeBestSolutions: [],
    maybeSubmittedSolutions: [],
    maybeTotalSolutions: 0,
    cumulativeHashes: 0,
    acceptedSolutions: 0,
    rejectedSolutions: 0,
  };
}

const defaultSessionStats: SessionMiningStats = {
  maybeHashRate: 0,
  maybeStartTime: null,
  maybeRequiredBinaryZeroes: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return value === "accepted" || value === "rejected" || value === "outdated" || value === "pending";
}

function parseFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseFoundHashSolution(value: unknown): FoundHashSolution | null {
  if (!isRecord(value)) {
    return null;
  }

  const maybeId = value.id;
  const maybeHash = value.hash;
  const maybeNonceNumber = parseFiniteNumber(value.nonceNumber);
  const maybeTimestamp = parseFiniteNumber(value.timestamp);
  const maybeMerkleRootHex = value.merkleRootHex;
  const maybePreviousBlockHex = value.previousBlockHex;
  const maybeVersionNumber = parseFiniteNumber(value.versionNumber);
  const maybeBitsHex = value.bitsHex;
  const maybeBinaryZeroes = parseFiniteNumber(value.binaryZeroes);
  const maybeHexZeroes = parseFiniteNumber(value.hexZeroes);
  const maybeTimeToFindMs = parseFiniteNumber(value.timeToFindMs);

  if (
    typeof maybeId !== "string" ||
    typeof maybeHash !== "string" ||
    maybeNonceNumber === null ||
    maybeTimestamp === null ||
    typeof maybeMerkleRootHex !== "string" ||
    typeof maybePreviousBlockHex !== "string" ||
    maybeVersionNumber === null ||
    typeof maybeBitsHex !== "string" ||
    maybeBinaryZeroes === null ||
    maybeHexZeroes === null ||
    maybeTimeToFindMs === null
  ) {
    return null;
  }

  return {
    id: maybeId,
    hash: maybeHash,
    nonceNumber: maybeNonceNumber,
    timestamp: maybeTimestamp,
    merkleRootHex: maybeMerkleRootHex,
    previousBlockHex: maybePreviousBlockHex,
    versionNumber: maybeVersionNumber,
    bitsHex: maybeBitsHex,
    binaryZeroes: maybeBinaryZeroes,
    hexZeroes: maybeHexZeroes,
    timeToFindMs: maybeTimeToFindMs,
  };
}

function parseSubmittedHashSolution(value: unknown): SubmittedHashSolution | null {
  const maybeFoundHashSolution = parseFoundHashSolution(value);
  if (!maybeFoundHashSolution || !isRecord(value)) {
    return null;
  }

  const maybeStatus = value.status;
  const status = maybeStatus === undefined
    ? "pending"
    : isSubmissionStatus(maybeStatus)
      ? maybeStatus
      : null;

  if (status === null) {
    return null;
  }

  return {
    ...maybeFoundHashSolution,
    status,
  };
}

function parseSolutionArray<T>(value: unknown, parser: (candidate: unknown) => T | null): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parser)
    .filter((maybeSolution): maybeSolution is T => maybeSolution !== null);
}

export function parsePersistentMiningStats(raw: string | null): PersistentMiningStats {
  if (!raw) {
    return buildDefaultPersistentStats();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return buildDefaultPersistentStats();
    }

    const maybeTotalSolutions = parseFiniteNumber(parsed.maybeTotalSolutions);
    const maybeCumulativeHashes = parseFiniteNumber(parsed.cumulativeHashes);
    const maybeAcceptedSolutions = parseFiniteNumber(parsed.acceptedSolutions);
    const maybeRejectedSolutions = parseFiniteNumber(parsed.rejectedSolutions);

    return {
      maybeBestSolutions: parseSolutionArray(parsed.maybeBestSolutions, parseFoundHashSolution),
      maybeSubmittedSolutions: parseSolutionArray(parsed.maybeSubmittedSolutions, parseSubmittedHashSolution),
      maybeTotalSolutions: maybeTotalSolutions ?? 0,
      cumulativeHashes: maybeCumulativeHashes ?? 0,
      acceptedSolutions: maybeAcceptedSolutions ?? 0,
      rejectedSolutions: maybeRejectedSolutions ?? 0,
    };
  } catch {
    return buildDefaultPersistentStats();
  }
}

function getSubmissionStatus(workMetadataStatus: MiningSubmissionStatus): SubmissionStatus {
  switch (workMetadataStatus) {
  case MiningSubmissionStatus.ACCEPTED:
  case MiningSubmissionStatus.ACCEPTED_AND_FOUND_BLOCK:
    return "accepted";
  case MiningSubmissionStatus.REJECTED:
    return "rejected";
  case MiningSubmissionStatus.OUTDATED:
    return "outdated";
  default:
    throw new Error(`Unsupported MiningSubmissionStatus: ${workMetadataStatus}`);
  }
}

export const useMiningState = () => {
  console.log("useMiningState called");
  const networkInfo = useNetworkInfo();

  const [persistentStats, setPersistentStats] = useState<PersistentMiningStats>(() => {
    if (typeof localStorage === "undefined") {
      return buildDefaultPersistentStats();
    }

    return parsePersistentMiningStats(localStorage.getItem(STORAGE_KEY));
  });

  const [sessionStats, setSessionStats] = useState<SessionMiningStats>(() => ({
    ...defaultSessionStats,
    maybeRequiredBinaryZeroes: networkInfo.maybeNetworkRequiredLeadingZeroes,
  }));

  const updateMiningStats = (solution: FoundHashSolution, cumulativeHashes: number) => {
    if (
      networkInfo.maybeNetworkRequiredLeadingZeroes !== undefined &&
      solution.binaryZeroes >= networkInfo.maybeNetworkRequiredLeadingZeroes
    ) {
      showInfo(
        "Partial Solution Found!",
        `Found a hash with ${solution.binaryZeroes} leading binary zeroes!`,
        {
          maybePersist: false,
        }
      );
    }

    // Update persistent stats
    setPersistentStats(prev => {
      const updatedHashes = [solution, ...(prev.maybeBestSolutions || [])]
        .sort((a, b) => b.binaryZeroes - a.binaryZeroes);
        // .slice(0, 100);

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
    const submissionStatus = getSubmissionStatus(workMetadata.status);
    const isAccepted = submissionStatus === "accepted";
    console.log("updateSubmissionStats called with submissionStatus", submissionStatus, "workMetadata", workMetadata);
    setPersistentStats(prev => {
      const submittedHashes = prev.maybeSubmittedSolutions || [];
      const block_header_hash_as_hex = workMetadata.block_header_hash_hex;
      let didUpdate = false;
      const updatedSubmittedHashes = submittedHashes.map((submittedHash) => {
        if (submittedHash.hash !== block_header_hash_as_hex) {
          return submittedHash;
        }

        didUpdate = true;
        return {
          ...submittedHash,
          status: submissionStatus,
        };
      });

      if (!didUpdate) {
        console.error("Element not found in submittedHashes for status:", block_header_hash_as_hex, "workMetadata", workMetadata.status);
      }

      return {
        ...prev,
        acceptedSolutions: isAccepted ? (prev.acceptedSolutions + 1) : prev.acceptedSolutions,
        rejectedSolutions: submissionStatus === "rejected" ? (prev.rejectedSolutions + 1) : prev.rejectedSolutions,
        maybeSubmittedSolutions: updatedSubmittedHashes,
      };
    });
  };

  const addSubmittedHash = (solution: FoundHashSolution) => {
    setPersistentStats(prev => ({
      ...prev,
      maybeSubmittedSolutions: [
        { ...solution, status: 'pending' as const },
        ...(prev.maybeSubmittedSolutions || [])
      ].slice(0, 100), // Keep last 100 submissions
    }));
  };

  const resetStats = () => {
    setPersistentStats(buildDefaultPersistentStats());
    setSessionStats({
      ...defaultSessionStats,
      maybeRequiredBinaryZeroes: networkInfo.maybeNetworkRequiredLeadingZeroes,
    });
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    showInfo(
      "Data Reset",
      "All mining data has been cleared."
    );
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
    if (typeof localStorage === "undefined") {
      return;
    }

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
