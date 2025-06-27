import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { type SortField, type SortDirection } from "./types";

interface MobileLeaderboardProps {
  sortedLeaderboard: any[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const SortIcon = ({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) => {
  if (currentField !== field) return <ArrowUpDown className="inline ml-1 h-4 w-4" />;
  return direction === "asc" ?
    <ArrowUp className="inline ml-1 h-4 w-4" /> :
    <ArrowDown className="inline ml-1 h-4 w-4" />;
};

export function MobileLeaderboard({ sortedLeaderboard, sortField, sortDirection, onSort }: MobileLeaderboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Global Leaderboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onSort("rank")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              sortField === "rank" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            Rank <SortIcon field="rank" currentField={sortField} direction={sortDirection} />
          </button>
          {/* <button
            onClick={() => onSort("binaryZeroes")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              sortField === "binaryZeroes" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            Zeroes <SortIcon field="binaryZeroes" currentField={sortField} direction={sortDirection} />
          </button> */}
        </div>
      </div>

      <div className="space-y-3">
        {sortedLeaderboard.map((entry) => (
          <motion.div
            key={entry.hash}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4">
              <div className="space-y-3">
                {/* Header with rank and name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm font-bold">
                      #{entry.rank}
                    </Badge>
                    <span className="font-medium text-sm">
                      {entry.maybeUsername || "anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {entry.binaryZeroes} binary
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {entry.hexZeroes} hex
                    </Badge>
                  </div>
                </div>

                {/* Messages */}
                {(entry.maybeLeaderboardMessage || entry.maybeBlockchainMessage) && (
                  <div className="space-y-2">
                    {entry.maybeLeaderboardMessage && (
                      <div>
                        <span className="text-xs text-muted-foreground">Message:</span>
                        <p className="text-sm break-words">{entry.maybeLeaderboardMessage}</p>
                      </div>
                    )}
                    {entry.maybeBlockchainMessage && (
                      <div>
                        <span className="text-xs text-muted-foreground">Blockchain:</span>
                        <p className="text-sm break-words">{entry.maybeBlockchainMessage}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Hash */}
                <div>
                  <span className="text-xs text-muted-foreground">Hash:</span>
                  <p className="text-xs font-mono break-all text-muted-foreground">
                    0x{entry.hash}
                  </p>
                </div>

                {/* Footer with metadata and actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {entry.blockHeight && (
                      <a
                        href={`https://bitcoinexplorer.org/block-height/${entry.blockHeight}`}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {entry.blockHeight.toLocaleString()}
                      </a>
                    )}
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <a
                    href={`/submission/${entry.hash}`}
                    className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs"
                  >
                    <Search className="h-3 w-3" />
                    Inspect
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}