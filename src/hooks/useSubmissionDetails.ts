import { useQuery } from "@tanstack/react-query";
import API_CONFIG from "@/config/api";

interface Submission {
  rank: number;
  hash: string;
  maybeUsername: string | null;
  maybeLeaderboardMessage: string | null;
  maybeBlockchainMessage: string | null;
  binaryZeroes: number;
  hexZeroes: number;
  blockHeight: number;
  createdAt: string;
}

export function useSubmissionDetails(hash: string) {
  const { data: submission, isLoading, error } = useQuery<Submission, Error>({
    queryKey: ["submission", hash],
    queryFn: async () => {
      const response = await fetch(`${API_CONFIG.baseUrl}/submission-details/${hash}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch submission: ${response.statusText}`);
      }
      return response.json();
    },
  });

  return { submission, isLoading, error };
}