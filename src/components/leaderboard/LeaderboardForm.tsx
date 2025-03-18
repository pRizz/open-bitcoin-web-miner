import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { getMessageByteLength, MAX_MESSAGE_BYTES } from "@/utils/blockchainMessage";
import { useLeaderboard } from "@/contexts/leaderboard/LeaderboardContext";
import { saveLeaderboardUsername, saveLeaderboardMessage } from "@/utils/localStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function LeaderboardForm() {
  const { username, setUsername, leaderboardMessage, setLeaderboardMessage } = useLeaderboard();
  const { maybeBlockchainMessage, setBlockchainMessage } = useMinerInfo();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
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
        <Label htmlFor="username">Username (1-20 alphanumeric characters)</Label>
        <div className="space-y-1">
          <Input
            id="username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter your username"
            maxLength={20}
          />
          <div className="text-xs text-muted-foreground text-right">
            {username.length} / 20 characters
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="leaderboardMessage" className="flex items-center gap-2">
          Leaderboard Message (up to 120 characters)
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>A message that is only displayed in the leaderboard and is not added to the blockchain.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="space-y-1">
          <Input
            id="leaderboardMessage"
            value={leaderboardMessage}
            onChange={handleLeaderboardMessageChange}
            placeholder="Optional message to display on the leaderboard"
            maxLength={120}
          />
          <div className="text-xs text-muted-foreground text-right">
            {leaderboardMessage.length} / 120 characters
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="blockchainMessage" className="flex items-center gap-2">
          Blockchain Message (up to {MAX_MESSAGE_BYTES} bytes)
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>This message will be added to the coinbase script signature field, if you successfully find a block. UTF-8 text is allowed, with a maximum length of {MAX_MESSAGE_BYTES} bytes. No control characters allowed.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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