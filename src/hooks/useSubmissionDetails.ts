import { useState, useEffect } from "react";
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
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_CONFIG.baseUrl}/submission/${hash}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch submission: ${response.statusText}`);
        }
        const data = await response.json();
        setSubmission(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch submission"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [hash]);

  return { submission, isLoading, error };
}