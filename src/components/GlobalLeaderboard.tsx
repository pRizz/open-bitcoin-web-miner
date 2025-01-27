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

interface LeaderboardEntry {
  username: string | null;
  leaderboard_message: string | null;
  hash: string;
  binary_zeroes: number;
  hex_zeroes: number;
  time_to_find: number;
}

export function GlobalLeaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("username, leaderboard_message, hash, binary_zeroes, hex_zeroes, time_to_find")
        .order("binary_zeroes", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as LeaderboardEntry[];
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
      <h2 className="text-2xl font-bold mb-4">Global Leaderboard</h2>
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
              <TableRow key={entry.hash}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{entry.username || "Anonymous"}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {entry.leaderboard_message || "-"}
                </TableCell>
                <TableCell>{entry.binary_zeroes}</TableCell>
                <TableCell>{entry.hex_zeroes}</TableCell>
                <TableCell className="font-mono text-xs truncate max-w-[200px]">
                  0x{entry.hash}
                </TableCell>
                <TableCell>{formatDuration(entry.time_to_find)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}