import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { getMessageByteLength, MAX_MESSAGE_BYTES } from "@/utils/blockchainMessage";
import { saveLeaderboardUsername, saveLeaderboardMessage } from "@/utils/localStorage";
import { useMining } from "@/contexts/MiningContext";

import MobileFriendlyTooltip from "@/components/ui/mobile-friendly-tooltip";
import { HelpCircle } from "lucide-react";
import { messageTooltip, nameTagTooltip, blockchainMessageTooltip } from "./LeaderboardConstants";

export function LeaderboardForm() {
  const { maybeLeaderboardUsername, setLeaderboardUsername, maybeLeaderboardMessage, setLeaderboardMessage, maybeBlockchainMessage, setBlockchainMessage } = useMinerInfo();
  const { isMining } = useMining();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    // FIXME: still allows invalid usernames to be sent to the backend; only validates when saving to local storage
    setLeaderboardUsername(newUsername);
    saveLeaderboardUsername(newUsername);
  };

  const handleLeaderboardMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setLeaderboardMessage(newMessage);
    saveLeaderboardMessage(newMessage);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="flex items-center gap-2">
          Name Tag (1-20 alphanumeric characters)
          <MobileFriendlyTooltip
            content={<p>{nameTagTooltip}</p>}
            className="max-w-[300px]"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </MobileFriendlyTooltip>
        </Label>
        <div className="space-y-1">
          <Input
            id="username"
            value={maybeLeaderboardUsername ?? ""}
            onChange={handleUsernameChange}
            placeholder="Enter your name tag"
            maxLength={20}
            disabled={isMining}
          />
          <div className="text-xs text-muted-foreground text-right">
            {maybeLeaderboardUsername?.length ?? 0} / 20 characters
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="leaderboardMessage" className="flex items-center gap-2">
          Leaderboard Message (up to 120 characters)
          <MobileFriendlyTooltip
            content={<p>{messageTooltip}</p>}
            className="max-w-[300px]"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </MobileFriendlyTooltip>
        </Label>
        <div className="space-y-1">
          <Input
            id="leaderboardMessage"
            value={maybeLeaderboardMessage ?? ""}
            onChange={handleLeaderboardMessageChange}
            placeholder="Optional message to display on the leaderboard"
            maxLength={120}
            disabled={isMining}
          />
          <div className="text-xs text-muted-foreground text-right">
            {maybeLeaderboardMessage?.length ?? 0} / 120 characters
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="blockchainMessage" className="flex items-center gap-2">
          Blockchain Message (up to {MAX_MESSAGE_BYTES} bytes)
          <MobileFriendlyTooltip
            content={<p>{blockchainMessageTooltip}</p>}
            className="max-w-[300px]"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </MobileFriendlyTooltip>
        </Label>
        <div className="space-y-1">
          <Input
            id="blockchainMessage"
            value={maybeBlockchainMessage ?? ""}
            onChange={(e) => setBlockchainMessage(e.target.value || null)}
            placeholder="Optional message for the blockchain"
            maxLength={MAX_MESSAGE_BYTES}
            disabled={isMining}
          />
          <div className="text-xs text-muted-foreground text-right">
            {getMessageByteLength(maybeBlockchainMessage)} / {MAX_MESSAGE_BYTES} bytes
          </div>
        </div>
      </div>
    </div>
  );
}