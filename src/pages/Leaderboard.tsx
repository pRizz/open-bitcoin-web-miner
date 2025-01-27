import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";

export default function Leaderboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Global Leaderboard</h1>
      <GlobalLeaderboard />
    </div>
  );
}