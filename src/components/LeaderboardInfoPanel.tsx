import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMining } from "@/contexts/MiningContext";
import { LeaderboardForm } from "./leaderboard/LeaderboardForm";
import { useLeaderboard } from "@/contexts/leaderboard/LeaderboardContext";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";

export function LeaderboardInfoPanel() {
  const { miningStats } = useMining();
  const { resetFields } = useLeaderboard();

  return (
    <Card className="p-6 glass-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Leaderboard Info</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={resetFields}
          className="text-muted-foreground hover:text-foreground"
        >
          Reset Fields
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        This feature is completely optional - you don't need to provide any information if you don't want to be added to the leaderboard. However, if you'd like to participate, enter at least a username below. If you find a hash that ranks in the top 100, it will automatically be submitted to the Global Leaderboard. Submissions are limited to once per minute.
      </p>
      <LeaderboardForm />
      <div className="mt-6 text-center">
        <Link
          to="/leaderboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trophy className="mr-2 h-4 w-4" />
          View Global Leaderboard
        </Link>
      </div>
    </Card>
  );
}