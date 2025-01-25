import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { HashSolution } from "@/types/mining";
import { HashTableRow } from "./HashTableRow";

interface HashListProps {
  hashes: HashSolution[];
}

export function HashList({ hashes }: HashListProps) {
  const [sortField, setSortField] = useState<keyof HashSolution>("binaryZeroes");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedHashes = [...hashes].sort((a, b) => {
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
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Best Hashes Found</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("binaryZeroes")}
              >
                Leading Binary Zeroes
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("hexZeroes")}
              >
                Leading Hex Zeroes
              </TableHead>
              <TableHead>Hash</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("timeToFind")}
              >
                Time to Find
              </TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHashes.map((hash) => (
              <HashTableRow key={hash.id} hash={hash} />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}