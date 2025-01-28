import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useMining } from "@/contexts/MiningContext";
import { LeaderboardForm } from "./leaderboard/LeaderboardForm";
import { LeaderboardSubmissionHandler } from "./leaderboard/LeaderboardSubmissionHandler";

export function LeaderboardInfoPanel() {
  const { toast } = useToast();
  const { miningStats } = useMining();
  const [username, setUsername] = useState("");
  const [leaderboardMessage, setLeaderboardMessage] = useState("");
  const [blockchainMessage, setBlockchainMessage] = useState("");
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);

  const submissionHandler = new LeaderboardSubmissionHandler(toast);

  // Auto-submit functionality
  useEffect(() => {
    const autoSubmit = async () => {
      if (
        miningStats.bestHashes.length > 0 &&
        username &&
        Date.now() - lastSubmissionTime >= 60000 // 1 minute cooldown
      ) {
        const validation = submissionHandler.validateInputs(
          username,
          leaderboardMessage,
          blockchainMessage
        );

        if (!validation.isValid) {
          toast({
            title: "Invalid input",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        const success = await submissionHandler.submitHash(
          username,
          leaderboardMessage,
          blockchainMessage,
          miningStats.bestHashes[0]
        );

        if (success) {
          setLastSubmissionTime(Date.now());
        }
      }
    };

    autoSubmit();
  }, [miningStats.bestHashes]);

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Your Leaderboard Info</h2>
      <p className="text-sm text-muted-foreground mb-4">
        This feature is completely optional - you don't need to provide any information if you don't want to be added to the leaderboard. However, if you'd like to participate, enter at least a username below. If you find a hash that ranks in the top 100, it will automatically be submitted to the Global Leaderboard. Submissions are limited to once per minute.
      </p>
      <LeaderboardForm
        username={username}
        setUsername={setUsername}
        leaderboardMessage={leaderboardMessage}
        setLeaderboardMessage={setLeaderboardMessage}
        blockchainMessage={blockchainMessage}
        setBlockchainMessage={setBlockchainMessage}
      />
    </Card>
  );
}