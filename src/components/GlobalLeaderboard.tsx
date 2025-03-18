import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/utils/formatters";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  maybeUsername: string | null;
  maybeLeaderboardMessage: string | null;
  hash: string;
  binaryZeroes: number;
  hexZeroes: number;
  timeToFind: number;
}

const MotionTableRow = motion(TableRow);

export function GlobalLeaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("username, leaderboard_message, hash, binary_zeroes, hex_zeroes, time_to_find")
        .order("binary_zeroes", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data.map((entry) => ({
        maybeUsername: entry.username,
        maybeLeaderboardMessage: entry.leaderboard_message,
        hash: entry.hash,
        binaryZeroes: entry.binary_zeroes,
        hexZeroes: entry.hex_zeroes,
        timeToFind: entry.time_to_find,
      }));
    },
  });

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

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Binary Zeroes</TableHead>
              <TableHead>Hex Zeroes</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead>Time to Find</TableHead>
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
                <TableCell>{index + 1}</TableCell>
                <TableCell>{entry.maybeUsername || "Anonymous"}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {entry.maybeLeaderboardMessage || "-"}
                </TableCell>
                <TableCell>{entry.binaryZeroes}</TableCell>
                <TableCell>{entry.hexZeroes}</TableCell>
                <TableCell className="font-mono text-xs truncate max-w-[200px]">
                  0x{entry.hash}
                </TableCell>
                <TableCell>{formatDuration(entry.timeToFind)}</TableCell>
              </MotionTableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}