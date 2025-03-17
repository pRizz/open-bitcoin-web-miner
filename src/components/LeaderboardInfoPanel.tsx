import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { LeaderboardForm } from "./leaderboard/LeaderboardForm";
import { useLeaderboard } from "@/contexts/leaderboard/LeaderboardContext";

export function LeaderboardInfoPanel() {
  const { miningStats } = useMining();
  const { maybeSubmitToLeaderboard } = useLeaderboard();

  // Auto-submit functionality
  useEffect(() => {
    if (miningStats.maybeBestHashes.length > 0) {
      maybeSubmitToLeaderboard();
    }
  }, [miningStats.maybeBestHashes]);

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Your Leaderboard Info</h2>
      <p className="text-sm text-muted-foreground mb-4">
        This feature is completely optional - you don't need to provide any information if you don't want to be added to the leaderboard. However, if you'd like to participate, enter at least a username below. If you find a hash that ranks in the top 100, it will automatically be submitted to the Global Leaderboard. Submissions are limited to once per minute.
      </p>
      <LeaderboardForm />
    </Card>
  );
}