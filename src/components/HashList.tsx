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
import { HashSolution } from "@/types/mining";
import { HashTableRow } from "./HashTableRow";
import { useMining } from "@/contexts/MiningContext";

export function HashList() {
  const { isMining, startMining, stopMining, miningStats } = useMining();
  const [sortField, setSortField] = useState<keyof HashSolution>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const submittedHashes = miningStats.maybeSubmittedHashes || [];

  const sortedHashes = [...submittedHashes].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    return sortDirection === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const toggleSort = (field: keyof HashSolution) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <Card className="p-6 glass-card h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Submitted Hashes</h2>
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
                  onClick={() => toggleSort("timeToFind")}
                >
                  Time to Find
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Nonce</TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHashes.map((hash) => (
                <HashTableRow key={hash.id} hash={hash} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}