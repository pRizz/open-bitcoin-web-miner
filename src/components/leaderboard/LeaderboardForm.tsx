import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { getMessageByteLength, MAX_MESSAGE_BYTES } from "@/utils/blockchainMessage";
import { useLeaderboard } from "@/contexts/leaderboard/LeaderboardContext";

export function LeaderboardForm() {
  const { username, setUsername, leaderboardMessage, setLeaderboardMessage } = useLeaderboard();
  const { maybeBlockchainMessage, setBlockchainMessage } = useMinerInfo();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username (1-20 alphanumeric characters)</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          maxLength={20}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="leaderboardMessage">Leaderboard Message (up to 120 characters)</Label>
        <Input
          id="leaderboardMessage"
          value={leaderboardMessage}
          onChange={(e) => setLeaderboardMessage(e.target.value)}
          placeholder="Optional message to display on the leaderboard"
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="blockchainMessage">
          Blockchain Message (up to {MAX_MESSAGE_BYTES} bytes)
        </Label>
        <div className="space-y-1">
          <Input
            id="blockchainMessage"
            value={maybeBlockchainMessage ?? ""}
            onChange={(e) => setBlockchainMessage(e.target.value || null)}
            placeholder="Optional message for the blockchain"
            maxLength={MAX_MESSAGE_BYTES}
          />
          <div className="text-xs text-muted-foreground text-right">
            {getMessageByteLength(maybeBlockchainMessage)} / {MAX_MESSAGE_BYTES} bytes
          </div>
        </div>
      </div>
    </div>
  );
}