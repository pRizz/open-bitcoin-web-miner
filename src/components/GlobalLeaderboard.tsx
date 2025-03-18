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
import { HelpCircle } from "lucide-react";

const MotionTableRow = motion(TableRow);

export function GlobalLeaderboard() {
  const { leaderboard, isLoading, error } = useGlobalLeaderboard();

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
    <Card className="p-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="py-10">
              <TableHead className="text-center">Rank</TableHead>
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
              <TableHead className="text-center w-[80px] py-2">
                Leading<br />Binary<br />Zeroes
              </TableHead>
              <TableHead className="text-center w-[80px] py-2">
                Leading<br />Hex<br />Zeroes
              </TableHead>
              <TableHead className="text-center">Hash</TableHead>
              <TableHead className="text-center">Block Height</TableHead>
              <TableHead className="text-center">Time Found</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard?.map((entry, index) => (
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
                <TableCell className="text-center">{index + 1}</TableCell>
                <TableCell className="text-center">{entry.maybeUsername || "Anonymous"}</TableCell>
                <TableCell className="text-center max-w-[200px] truncate">
                  {entry.maybeLeaderboardMessage || "-"}
                </TableCell>
                <TableCell className="text-center max-w-[200px] truncate">
                  {entry.maybeBlockchainMessage || "-"}
                </TableCell>
                <TableCell className="text-center">{entry.binaryZeroes}</TableCell>
                <TableCell className="text-center">{entry.hexZeroes}</TableCell>
                <TableCell className="text-center font-mono text-xs truncate max-w-[200px]">
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger className="cursor-help">
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