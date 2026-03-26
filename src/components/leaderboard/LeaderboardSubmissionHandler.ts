import { supabase } from "@/integrations/supabase/client";
import { toast as toastFunction } from "@/hooks/use-toast";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class LeaderboardSubmissionHandler {
  constructor(private toast: typeof toastFunction) {}

  validateInputs(username: string, leaderboardMessage: string, blockchainMessage: string): ValidationResult {
    if (!/^[a-zA-Z0-9]{1,20}$/.test(username)) {
      return {
        isValid: false,
        error: "Username must be 1-20 alphanumeric characters",
      };
    }

    if (leaderboardMessage.length > 120) {
      return {
        isValid: false,
        error: "Leaderboard message must be 120 characters or less",
      };
    }

    if (!/^[a-zA-Z0-9]{0,30}$/.test(blockchainMessage)) {
      return {
        isValid: false,
        error: "Blockchain message must be 30 alphanumeric characters or less",
      };
    }

    return { isValid: true };
  }
}
