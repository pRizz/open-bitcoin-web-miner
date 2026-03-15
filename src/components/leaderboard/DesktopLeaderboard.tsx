import React from "react";
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
import MobileFriendlyTooltip from "@/components/ui/mobile-friendly-tooltip";
import { motion } from "framer-motion";
import { HelpCircle, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { messageTooltip, nameTagTooltip, blockchainMessageTooltip } from "./LeaderboardConstants";
import { type SortField, type SortDirection } from "./types";
import { type LeaderboardEntry } from "@/contexts/GlobalLeaderboardContext";

interface DesktopLeaderboardProps {
  sortedLeaderboard: LeaderboardEntry[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  maybeRequiredBinaryZeroes?: number;
}

const MotionTableRow = motion(TableRow);

const SortIcon = ({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) => {
  if (currentField !== field) return <ArrowUpDown className="inline ml-1 h-4 w-4" />;
  return direction === "asc" ?
    <ArrowUp className="inline ml-1 h-4 w-4" /> :
    <ArrowDown className="inline ml-1 h-4 w-4" />;
};

export function DesktopLeaderboard({
  sortedLeaderboard,
  sortField,
  sortDirection,
  onSort,
  maybeRequiredBinaryZeroes
}: DesktopLeaderboardProps) {
  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="py-10">
              <TableHead
                className="text-center cursor-pointer hover:text-primary"
                onClick={() => onSort("rank")}
              >
                Rank <SortIcon field="rank" currentField={sortField} direction={sortDirection} />
              </TableHead>
              <TableHead className="text-center">
                Name Tag
                <MobileFriendlyTooltip
                  content={<p>{nameTagTooltip}</p>}
                  className="max-w-[300px]"
                >
                  <HelpCircle className="inline ml-1 h-4 w-4 text-muted-foreground" />
                </MobileFriendlyTooltip>
              </TableHead>
              <TableHead className="text-center">
                Message
                <MobileFriendlyTooltip
                  content={<p>{messageTooltip}</p>}
                  className="max-w-[300px]"
                >
                  <HelpCircle className="inline ml-1 h-4 w-4 text-muted-foreground" />
                </MobileFriendlyTooltip>
              </TableHead>
              <TableHead className="text-center">
                Blockchain Message
                <MobileFriendlyTooltip
                  content={<p>{blockchainMessageTooltip}</p>}
                  className="max-w-[300px]"
                >
                  <HelpCircle className="inline ml-1 h-4 w-4 text-muted-foreground" />
                </MobileFriendlyTooltip>
              </TableHead>
              <TableHead
                className="text-center w-[80px] py-2 cursor-pointer hover:text-primary"
                onClick={() => onSort("binaryZeroes")}
              >
                Leading<br />Binary<br />Zeroes <SortIcon field="binaryZeroes" currentField={sortField} direction={sortDirection} />
                <MobileFriendlyTooltip
                  content={<p>The number of leading binary zeroes in the block hash. The network currently requires at least {maybeRequiredBinaryZeroes} leading binary zeroes to mine a valid Bitcoin block.</p>}
                  className="max-w-[300px]"
                >
                  <HelpCircle className="inline ml-1 h-4 w-4 text-muted-foreground" />
                </MobileFriendlyTooltip>
              </TableHead>
              <TableHead className="text-center w-[80px] py-2">
                Leading<br />Hex<br />Zeroes
              </TableHead>
              <TableHead className="text-center">Hash</TableHead>
              <TableHead
                className="text-center cursor-pointer hover:text-primary"
                onClick={() => onSort("blockHeight")}
              >
                Block Height <SortIcon field="blockHeight" currentField={sortField} direction={sortDirection} />
              </TableHead>
              <TableHead
                className="text-center cursor-pointer hover:text-primary"
                onClick={() => onSort("createdAt")}
              >
                Time Found <SortIcon field="createdAt" currentField={sortField} direction={sortDirection} />
              </TableHead>
              <TableHead className="text-center">
                Inspect
                <MobileFriendlyTooltip
                  content={<p>View detailed information about this submission</p>}
                  className="max-w-[300px]"
                >
                  <HelpCircle className="inline ml-1 h-4 w-4 text-muted-foreground" />
                </MobileFriendlyTooltip>
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
                      rel="noopener"
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      {entry.blockHeight.toLocaleString()}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <MobileFriendlyTooltip
                    content={new Date(entry.createdAt).toLocaleString()}
                  >
                    <span className="cursor-help">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </MobileFriendlyTooltip>
                </TableCell>
                <TableCell className="text-center">
                  <a
                    href={`/submission/${entry.hash}`}
                    className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600"
                  >
                    <Search className="h-4 w-4" />
                    Inspect
                  </a>
                </TableCell>
              </MotionTableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
