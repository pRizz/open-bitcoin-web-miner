import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDuration } from "@/utils/formatters";
import { motion } from "framer-motion";
import { useGlobalLeaderboard } from "@/contexts/GlobalLeaderboardContext";
import { HelpCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useMemo } from "react";
import { compareHashes } from "@/utils/mining";

const MotionTableRow = motion(TableRow);

type SortField = "rank" | "binaryZeroes" | "blockHeight" | "createdAt";
type SortDirection = "asc" | "desc";

export function GlobalLeaderboard() {
  const { leaderboard, isLoading, error } = useGlobalLeaderboard();
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="inline ml-1 h-4 w-4" />;
    return sortDirection === "asc" ?
      <ArrowUp className="inline ml-1 h-4 w-4" /> :
      <ArrowDown className="inline ml-1 h-4 w-4" />;
  };

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="py-10">
              <TableHead
                className="text-center cursor-pointer hover:text-primary"
                onClick={() => handleSort("rank")}
              >
                Rank <SortIcon field="rank" />
              </TableHead>
              <TableHead className="text-center">Username</TableHead>
              <TableHead className="text-center">
                Message
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger>
                      <HelpCircle className="inline ml-1 h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>A message that is only displayed in the leaderboard and is not added to the blockchain.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-center">
                Blockchain Message
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger>
                      <HelpCircle className="inline ml-1 h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>This message will be added to the coinbase script signature field, if you successfully find a block. UTF-8 text is allowed, with a maximum length of 100 bytes. No control characters allowed.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead
                className="text-center w-[80px] py-2 cursor-pointer hover:text-primary"
                onClick={() => handleSort("binaryZeroes")}
              >
                Leading<br />Binary<br />Zeroes <SortIcon field="binaryZeroes" />
              </TableHead>
              <TableHead className="text-center w-[80px] py-2">
                Leading<br />Hex<br />Zeroes
              </TableHead>
              <TableHead className="text-center">Hash</TableHead>
              <TableHead
                className="text-center cursor-pointer hover:text-primary"
                onClick={() => handleSort("blockHeight")}
              >
                Block Height <SortIcon field="blockHeight" />
              </TableHead>
              <TableHead
                className="text-center cursor-pointer hover:text-primary"
                onClick={() => handleSort("createdAt")}
              >
                Time Found <SortIcon field="createdAt" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeaderboard.map((entry) => (
              <MotionTableRow
                key={entry.hash}
                initial={{
                  color: "hsl(var(--background))",
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--background))"
                }}
                animate={{
                  color: "hsl(var(--foreground))",
                  backgroundColor: "transparent",
                  borderColor: "hsl(var(--border))"
                }}
                transition={{ duration: 0.3 }}
                className="transition-none"
              >
                <TableCell className="text-center">{entry.rank}</TableCell>
                <TableCell className="text-center whitespace-normal break-words">{entry.maybeUsername || "anonymous"}</TableCell>
                <TableCell className="text-center whitespace-normal break-words max-w-[200px]">
                  {entry.maybeLeaderboardMessage || "-"}
                </TableCell>
                <TableCell className="text-center whitespace-normal break-words max-w-[200px]">
                  {entry.maybeBlockchainMessage || "-"}
                </TableCell>
                <TableCell className="text-center">{entry.binaryZeroes}</TableCell>
                <TableCell className="text-center">{entry.hexZeroes}</TableCell>
                <TableCell className="text-center font-mono text-xs truncate max-w-[200px]">
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger className="cursor-help font-mono text-xs truncate max-w-[120px] whitespace-normal break-words">
                        0x{entry.hash}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">0x{entry.hash}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-center">
                  {entry.blockHeight ? (
                    <a
                      href={`https://bitcoinexplorer.org/block-height/${entry.blockHeight}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      {entry.blockHeight.toLocaleString()}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger className="cursor-help">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(entry.createdAt).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </MotionTableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}