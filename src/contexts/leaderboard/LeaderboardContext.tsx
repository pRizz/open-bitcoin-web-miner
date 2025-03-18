import { createContext, useContext, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { LeaderboardSubmissionHandler } from "@/components/leaderboard/LeaderboardSubmissionHandler";
import { loadUsername, loadLeaderboardMessage, STORAGE_KEYS } from "@/utils/localStorage";

interface LeaderboardContextType {
  username: string;
  setUsername: (username: string) => void;
  leaderboardMessage: string;
  setLeaderboardMessage: (message: string) => void;
  lastSubmissionTime: number;
  resetFields: () => void;
}

const defaultContext: LeaderboardContextType = {
  username: "",
  setUsername: () => {},
  leaderboardMessage: "",
  setLeaderboardMessage: () => {},
  lastSubmissionTime: 0,
  resetFields: () => {},
};

export const LeaderboardContext = createContext<LeaderboardContextType>(defaultContext);

export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { miningStats } = useMining();
  const { maybeBlockchainMessage } = useMinerInfo();
  const [username, setUsername] = useState(loadUsername() ?? "");
  const [leaderboardMessage, setLeaderboardMessage] = useState(loadLeaderboardMessage() ?? "");
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);

  const submissionHandler = new LeaderboardSubmissionHandler(toast);

  const resetFields = () => {
    setUsername("");
    setLeaderboardMessage("");
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD_MESSAGE);
  };

  return (
    <LeaderboardContext.Provider
      value={{
        username,
        setUsername,
        leaderboardMessage,
        setLeaderboardMessage,
        lastSubmissionTime,
        resetFields,
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error("useLeaderboard must be used within a LeaderboardProvider");
  }
  return context;
}