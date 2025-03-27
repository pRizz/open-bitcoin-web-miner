import { Card } from "@/components/ui/card";
import { useSubmissionDetails } from "@/hooks/useSubmissionDetails";
import { Loader2 } from "lucide-react";
import { formatDuration } from "@/utils/formatters";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TypedLink } from "@/components/TypedLink";

interface SubmissionDetailsProps {
  hash: string;
}

export function SubmissionDetails({ hash }: SubmissionDetailsProps) {
  const { submission, isLoading, error } = useSubmissionDetails(hash);
  const { maybeRequiredBinaryZeroes } = useNetworkInfo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <Card className="p-6">
        <div className="text-red-500">
          Error loading submission: {error?.message || "Submission not found"}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TypedLink route="leaderboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TypedLink>
        <h1 className="text-2xl font-bold">Submission Details</h1>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm text-muted-foreground">Current Rank</h2>
              <p className="text-xl font-mono">{submission.rank}</p>
            </div>
            <div>
              <h2 className="text-sm text-muted-foreground">Rank at Time Found ({new Date(submission.createdAt).toLocaleString()})</h2>
              <p className="text-xl font-mono">{submission.initialRank}</p>
            </div>
            <div>
              <h2 className="text-sm text-muted-foreground">Name Tag</h2>
              <p className="text-xl">{submission.maybeUsername || "anonymous"}</p>
            </div>
            <div>
              <h2 className="text-sm text-muted-foreground">Message</h2>
              <p className="text-xl">{submission.maybeLeaderboardMessage || "-"}</p>
            </div>
            <div>
              <h2 className="text-sm text-muted-foreground">Blockchain Message</h2>
              <p className="text-xl">{submission.maybeBlockchainMessage || "-"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-sm text-muted-foreground">Leading Binary Zeroes</h2>
              <p className="text-xl font-mono">
                {submission.binaryZeroes}
                {maybeRequiredBinaryZeroes && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Required {maybeRequiredBinaryZeroes} leading binary zeroes to find a block solution)
                  </span>
                )}
              </p>
            </div>
            <div>
              <h2 className="text-sm text-muted-foreground">Leading Hex Zeroes</h2>
              <p className="text-xl font-mono">{submission.hexZeroes}</p>
            </div>
            <div>
              <h2 className="text-sm text-muted-foreground">Hash</h2>
              <p className="text-xl font-mono break-all">0x{submission.hash}</p>
            </div>
            <div>
              <h2 className="text-sm text-muted-foreground">Block Height</h2>
              <p className="text-xl">
                {submission.blockHeight ? (
                  <a
                    href={`https://bitcoinexplorer.org/block-height/${submission.blockHeight}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    {submission.blockHeight.toLocaleString()}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <h2 className="text-sm text-muted-foreground">Time Found</h2>
              <p className="text-xl">
                {new Date(submission.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}