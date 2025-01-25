import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { HashSolution } from "@/types/mining";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHashes.map((hash) => (
              <TableRow 
                key={hash.id}
                className="animate-fade-in"
              >
                <TableCell>{hash.binaryZeroes}</TableCell>
                <TableCell>{hash.hexZeroes}</TableCell>
                <TableCell className="font-mono text-xs truncate max-w-[200px]">
                  {hash.hash}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger className="text-blue-500 hover:text-blue-400">
                      View
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Hash Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 font-mono text-sm">
                        <div>
                          <div className="text-gray-400">Hash</div>
                          <div className="break-all">{hash.hash}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Nonce</div>
                          <div>{hash.nonce}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Previous Block</div>
                          <div className="break-all">{hash.previousBlock}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Merkle Root</div>
                          <div className="break-all">{hash.merkleRoot}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Timestamp</div>
                          <div>{new Date(hash.timestamp * 1000).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Version</div>
                          <div>{hash.version}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Bits</div>
                          <div>{hash.bits}</div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}