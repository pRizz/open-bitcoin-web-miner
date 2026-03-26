import React from "react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmittedHashSolution } from "@/types/mining";
import { HashTableRow } from "./HashTableRow";
import { MobileHashCard } from "./MobileHashCard";
import { useMining } from "@/contexts/MiningContext";
import { compareHashes } from "@/utils/mining";

type SubmittedSolutionsSortField = "timestamp" | "binaryZeroes" | "hexZeroes" | "timeToFindMs";

export function SubmittedSolutionsList() {
  const { isMining, startMining, stopMining, miningStats } = useMining();
  const [sortField, setSortField] = useState<SubmittedSolutionsSortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const submittedHashes = miningStats.maybeSubmittedSolutions || [];
  const totalSolutions = miningStats.maybeTotalSolutions || 0;
  const sortedHashes = [...submittedHashes].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    // Special handling for hash-based sorting
    if (sortField === "binaryZeroes" || sortField === "hexZeroes") {
      return sortDirection === "asc"
        ? compareHashes(a.hash, b.hash)
        : compareHashes(b.hash, a.hash);
    }

    // Default sorting for other fields
    return sortDirection === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const toggleSort = (field: SubmittedSolutionsSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <Card className="p-4 lg:p-6 glass-card h-[500px] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-xl lg:text-2xl font-bold">Submitted Solutions ({totalSolutions})</h2>
        <Button
          onClick={isMining ? stopMining : startMining}
          size="sm"
          className={isMining
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"}
        >
          {isMining ? "Stop Mining" : "Start Mining"}
        </Button>
      </div>

      {submittedHashes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hashes submitted yet. Start mining to submit hashes!
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => toggleSort("timestamp")}
                  >
                    Time Submitted
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => toggleSort("binaryZeroes")}
                  >
                    Leading Binary Zeroes
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => toggleSort("hexZeroes")}
                  >
                    Leading Hex Zeroes
                  </TableHead>
                  <TableHead className="text-center">Hash</TableHead>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => toggleSort("timeToFindMs")}
                  >
                    Time to Find
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Nonce</TableHead>
                  <TableHead className="text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHashes.map((hashSolution) => (
                  <HashTableRow key={hashSolution.id} hashSolution={hashSolution} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {sortedHashes.map((hashSolution) => (
              <MobileHashCard key={hashSolution.id} hashSolution={hashSolution} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
