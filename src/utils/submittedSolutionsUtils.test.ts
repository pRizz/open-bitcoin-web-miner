import { describe, expect, it } from "vitest";

import type { SubmittedHashSolution } from "@/types/mining";
import { getEffectiveStatus } from "@/utils/submittedSolutionsUtils";

const baseSubmittedSolution: SubmittedHashSolution = {
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
  status: "pending",
};

describe("getEffectiveStatus", () => {
  it("keeps pending submissions pending before the timeout", () => {
    // Arrange
    const nowMs = baseSubmittedSolution.timestamp + 9_999;

    // Act
    const result = getEffectiveStatus(baseSubmittedSolution, nowMs);

    // Assert
    expect(result).toBe("pending");
  });

  it("marks stale pending submissions as rejected after the timeout", () => {
    // Arrange
    const nowMs = baseSubmittedSolution.timestamp + 10_001;

    // Act
    const result = getEffectiveStatus(baseSubmittedSolution, nowMs);

    // Assert
    expect(result).toBe("rejected");
  });

  it("keeps accepted submissions accepted", () => {
    // Arrange
    const submittedSolution: SubmittedHashSolution = {
      ...baseSubmittedSolution,
      status: "accepted",
    };

    // Act
    const result = getEffectiveStatus(submittedSolution, submittedSolution.timestamp + 60_000);

    // Assert
    expect(result).toBe("accepted");
  });

  it("keeps rejected submissions rejected", () => {
    // Arrange
    const submittedSolution: SubmittedHashSolution = {
      ...baseSubmittedSolution,
      status: "rejected",
    };

    // Act
    const result = getEffectiveStatus(submittedSolution, submittedSolution.timestamp + 60_000);

    // Assert
    expect(result).toBe("rejected");
  });

  it("keeps outdated submissions outdated", () => {
    // Arrange
    const submittedSolution: SubmittedHashSolution = {
      ...baseSubmittedSolution,
      status: "outdated",
    };

    // Act
    const result = getEffectiveStatus(submittedSolution, submittedSolution.timestamp + 60_000);

    // Assert
    expect(result).toBe("outdated");
  });
});
