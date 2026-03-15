import React from "react";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { TypedLink } from "@/components/TypedLink";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { useGlobalLeaderboard } from "@/contexts/GlobalLeaderboardContext";
import { Button } from "@/components/ui/button";

export default function Leaderboard() {
  const { lastRefreshTime } = useGlobalLeaderboard();

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <TypedLink routeKeyName="home">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TypedLink>
            <h1 className="text-2xl font-bold">Global Leaderboard</h1>
          </div>
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