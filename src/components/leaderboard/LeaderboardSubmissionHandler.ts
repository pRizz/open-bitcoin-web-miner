import { supabase } from "@/integrations/supabase/client";
import { HashSolution } from "@/types/mining";
import { UseToastReturn } from "@/components/ui/use-toast";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class LeaderboardSubmissionHandler {
  constructor(private toast: UseToastReturn["toast"]) {}

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

  async submitHash(
    username: string,
    leaderboardMessage: string,
    blockchainMessage: string,
    bestHash: HashSolution
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("leaderboard").insert({
        username,
        leaderboard_message: leaderboardMessage,
        blockchain_message: blockchainMessage,
        hash: bestHash.hash,
        binary_zeroes: bestHash.binaryZeroes,
        hex_zeroes: bestHash.hexZeroes,
        nonce: bestHash.nonce,
        timestamp: bestHash.timestamp,
        merkle_root: bestHash.merkleRoot,
        previous_block: bestHash.previousBlock,
        version: bestHash.version,
        bits: bestHash.bits,
        time_to_find: bestHash.timeToFind,
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          this.toast({
            title: "Rate limited",
            description: "Please wait 1 minute before submitting again",
            variant: "destructive",
          });
        } else {
          this.toast({
            title: "Submission failed",
            description: "Your hash wasn't good enough for the leaderboard or another error occurred",
            variant: "destructive",
          });
        }
        return false;
      }

      this.toast({
        title: "Success!",
        description: "Your hash has been added to the leaderboard",
      });
      return true;
    } catch (error) {
      this.toast({
        title: "Error",
        description: "Failed to submit hash to leaderboard",
        variant: "destructive",
      });
      return false;
    }
  }
}