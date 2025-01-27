import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMining } from "@/contexts/MiningContext";

export function LeaderboardInfoPanel() {
  const { toast } = useToast();
  const { miningStats } = useMining();
  const [username, setUsername] = useState("");
  const [leaderboardMessage, setLeaderboardMessage] = useState("");
  const [blockchainMessage, setBlockchainMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);

  const validateInputs = () => {
    if (!/^[a-zA-Z0-9]{1,20}$/.test(username)) {
      toast({
        title: "Invalid username",
        description: "Username must be 1-20 alphanumeric characters",
        variant: "destructive",
      });
      return false;
    }

    if (leaderboardMessage.length > 120) {
      toast({
        title: "Invalid leaderboard message",
        description: "Leaderboard message must be 120 characters or less",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[a-zA-Z0-9]{0,30}$/.test(blockchainMessage)) {
      toast({
        title: "Invalid blockchain message",
        description: "Blockchain message must be 30 alphanumeric characters or less",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmitBestHash = async () => {
    if (!validateInputs()) return;
    if (miningStats.bestHashes.length === 0) {
      toast({
        title: "No hashes found",
        description: "You need to mine some hashes first!",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const bestHash = miningStats.bestHashes[0];

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
          toast({
            title: "Rate limited",
            description: "Please wait 1 minute before submitting again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Submission failed",
            description: "Your hash wasn't good enough for the leaderboard or another error occurred",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success!",
        description: "Your hash has been added to the leaderboard",
      });
      setLastSubmissionTime(Date.now());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit hash to leaderboard",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit functionality
  useEffect(() => {
    const autoSubmit = async () => {
      if (
        miningStats.bestHashes.length > 0 &&
        username &&
        Date.now() - lastSubmissionTime >= 60000 // 1 minute cooldown
      ) {
        await handleSubmitBestHash();
      }
    };

    autoSubmit();
  }, [miningStats.bestHashes]);

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Your Leaderboard Info</h2>
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
    </Card>
  );
}