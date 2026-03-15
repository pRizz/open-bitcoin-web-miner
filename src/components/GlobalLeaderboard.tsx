import React from "react";
import { Card } from "@/components/ui/card";
import { useGlobalLeaderboard } from "@/contexts/GlobalLeaderboardContext";
import { useState, useMemo } from "react";
import { compareHashes } from "@/utils/mining";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLeaderboard } from "@/components/leaderboard/MobileLeaderboard";
import { DesktopLeaderboard } from "@/components/leaderboard/DesktopLeaderboard";
import { type SortField, type SortDirection } from "@/components/leaderboard/types";

export function GlobalLeaderboard() {
  const { leaderboard, isLoading, error } = useGlobalLeaderboard();
  const { maybeNetworkRequiredLeadingZeroes: maybeRequiredBinaryZeroes } = useNetworkInfo();
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "rank" ? "asc" : "desc");
    }
  };

  const sortedLeaderboard = useMemo(() => {
    if (!leaderboard) return [];

    return [...leaderboard].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
      case "rank":
        // Rank is based on hash comparison
        comparison = compareHashes(a.hash, b.hash);
        break;
      case "binaryZeroes":
        // Use hash comparison for binary zeroes
        comparison = compareHashes(a.hash, b.hash);
        break;
      case "blockHeight":
        comparison = (b.blockHeight || 0) - (a.blockHeight || 0);
        break;
      case "createdAt":
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [leaderboard, sortField, sortDirection]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">
          Error loading leaderboard: {error.message}
        </div>
      </Card>
    );
  }
  return (
    <>
      <div className="lg:hidden block">
        <MobileLeaderboard
          sortedLeaderboard={sortedLeaderboard}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>
      <div className="lg:block hidden">
        <DesktopLeaderboard
          sortedLeaderboard={sortedLeaderboard}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          maybeRequiredBinaryZeroes={maybeRequiredBinaryZeroes}
        />
      </div>
    </>
  );
}