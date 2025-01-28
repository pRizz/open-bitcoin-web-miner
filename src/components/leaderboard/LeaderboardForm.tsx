import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LeaderboardFormProps {
  username: string;
  setUsername: (value: string) => void;
  leaderboardMessage: string;
  setLeaderboardMessage: (value: string) => void;
  blockchainMessage: string;
  setBlockchainMessage: (value: string) => void;
}

export function LeaderboardForm({
  username,
  setUsername,
  leaderboardMessage,
  setLeaderboardMessage,
  blockchainMessage,
  setBlockchainMessage,
}: LeaderboardFormProps) {
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
          Blockchain Message (up to 30 alphanumeric characters)
        </Label>
        <Input
          id="blockchainMessage"
          value={blockchainMessage}
          onChange={(e) => setBlockchainMessage(e.target.value)}
          placeholder="Optional message for the blockchain"
          maxLength={30}
        />
      </div>
    </div>
  );
}