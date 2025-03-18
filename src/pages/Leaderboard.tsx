import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { useGlobalLeaderboard } from "@/contexts/GlobalLeaderboardContext";

export default function Leaderboard() {
  const { lastRefreshTime } = useGlobalLeaderboard();

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Mining
          </Link>
          {lastRefreshTime && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </span>
          )}
        </div>
        <GlobalLeaderboard />
      </div>
    </PageTransition>
  );
}