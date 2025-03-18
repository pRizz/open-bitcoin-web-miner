import React, { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import API_CONFIG from "@/config/api";

interface LeaderboardEntry {
  maybeUsername: string | null;
  maybeLeaderboardMessage: string | null;
  maybeBlockchainMessage: string | null;
  hash: string;
  binaryZeroes: number;
  hexZeroes: number;
  blockHeight: number;
  createdAt: string;
  rank: number;
}

interface GlobalLeaderboardContextType {
  leaderboard: LeaderboardEntry[] | undefined;
  isLoading: boolean;
  error: Error | null;
  lastRefreshTime: Date | null;
}

const GlobalLeaderboardContext = createContext<GlobalLeaderboardContextType | undefined>(undefined);

// Function to get random time between 15 and 30 seconds
const getRandomRefetchInterval = () => {
  return Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
};

export function GlobalLeaderboardProvider({ children }: { children: React.ReactNode }) {
  // Track last refresh time
  const [lastRefreshTime, setLastRefreshTime] = React.useState<Date | null>(null);

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ["global-leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const response = await fetch(`${API_CONFIG.baseUrl}/global-leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      const data = await response.json();
      setLastRefreshTime(new Date());
      // Add rank to each entry based on binaryZeroes
      return data.map((entry: LeaderboardEntry, index: number) => ({
        ...entry,
        rank: index + 1
      }));
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: getRandomRefetchInterval, // Random time between 15-30 seconds
  });

  return (
    <GlobalLeaderboardContext.Provider
      value={{
        leaderboard,
        isLoading,
        error: error as Error | null,
        lastRefreshTime,
      }}
    >
      {children}
    </GlobalLeaderboardContext.Provider>
  );
}

export function useGlobalLeaderboard() {
  const context = useContext(GlobalLeaderboardContext);
  if (context === undefined) {
    throw new Error("useGlobalLeaderboard must be used within a GlobalLeaderboardProvider");
  }
  return context;
}