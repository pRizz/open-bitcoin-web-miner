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
}

interface GlobalLeaderboardContextType {
  leaderboard: LeaderboardEntry[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const GlobalLeaderboardContext = createContext<GlobalLeaderboardContextType | undefined>(undefined);

export function GlobalLeaderboardProvider({ children }: { children: React.ReactNode }) {
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ["global-leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const response = await fetch(`${API_CONFIG.baseUrl}/global-leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      return response.json();
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <GlobalLeaderboardContext.Provider
      value={{
        leaderboard,
        isLoading,
        error: error as Error | null,
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