import { describe, expect, it } from "vitest";

import { parsePersistentMiningStats } from "@/hooks/useMiningState";

const baseSolution = {
  id: "solution-1",
  hash: "0000abc123",
  nonceNumber: 42,
  timestamp: 1_700_000_000_000,
  merkleRootHex: "merkle-root",
  previousBlockHex: "previous-block",
  versionNumber: 2,
  bitsHex: "1d00ffff",
  binaryZeroes: 16,
  hexZeroes: 4,
  timeToFindMs: 2500,
};

describe("parsePersistentMiningStats", () => {
  it("strips legacy statuses from best solutions", () => {
    // Arrange
    const rawStats = JSON.stringify({
      maybeBestSolutions: [
        {
          ...baseSolution,
          status: "pending",
        },
      ],
    });

    // Act
    const result = parsePersistentMiningStats(rawStats);

    // Assert
    expect(result.maybeBestSolutions).toEqual([baseSolution]);
  });

  it("defaults missing submitted statuses to pending", () => {
    // Arrange
    const rawStats = JSON.stringify({
      maybeSubmittedSolutions: [
        {
          ...baseSolution,
        },
      ],
    });

    // Act
    const result = parsePersistentMiningStats(rawStats);

    // Assert
    expect(result.maybeSubmittedSolutions).toEqual([
      {
        ...baseSolution,
        status: "pending",
      },
    ]);
  });

  it("drops malformed submitted solutions", () => {
    // Arrange
    const rawStats = JSON.stringify({
      maybeSubmittedSolutions: [
        {
          ...baseSolution,
          status: "stuck",
        },
        {
          id: "broken-solution",
          status: "accepted",
        },
      ],
    });

    // Act
    const result = parsePersistentMiningStats(rawStats);

    // Assert
    expect(result.maybeSubmittedSolutions).toEqual([]);
  });
});
