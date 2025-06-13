import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMining } from "@/contexts/MiningContext";
import { LeaderboardForm } from "./leaderboard/LeaderboardForm";
import { TypedLink } from "@/components/TypedLink";
import { Trophy } from "lucide-react";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";

export function LeaderboardInfoPanel() {
  const { isMining } = useMining();
  const { resetLeaderboardInfo } = useMinerInfo();

  return (
    <Card className="p-6 glass-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Leaderboard Info</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={resetLeaderboardInfo}
          disabled={isMining}
          className="text-muted-foreground hover:text-foreground"
        >
          Reset Fields
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        The Leaderboard is a community feature where you can submit your best hashes to the global leaderboard. This feature is optional - you don't need to provide any information to the leaderboard. If a username is not provided, the hash will be anonymous. If you find a hash that ranks in the top 100, it will automatically be submitted to the Global Leaderboard. The best hash is the one with the most leading binary zeroes. If two hashes have the same number of leading zeroes, the hash with the lowest numerical value will be ranked higher.
      </p>
      <LeaderboardForm />
      <div className="mt-6 text-center">
        <TypedLink
          routeKeyName="leaderboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trophy className="mr-2 h-4 w-4" />
          View Global Leaderboard
        </TypedLink>
      </div>
    </Card>
  );
}