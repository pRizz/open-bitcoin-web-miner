import { useParams } from "react-router-dom";
import { HashSolution } from "@/types/mining";
import { HashDetailsContent } from "@/components/HashDetailsContent";
import { useMining } from "@/contexts/MiningContext";

function findHashSolution(hash: string, submittedHashes: HashSolution[]): HashSolution | undefined {
  return submittedHashes.find((h) => h.hash === hash);
}

const InvalidHashError = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="text-red-500">Invalid hash</div>
    </div>
  );
};

export default function HashDetailsPage() {
  const { miningStats } = useMining();
  const { hash } = useParams<{ hash: string }>();
  if (!hash) {
    return <InvalidHashError />;
  }

  const submittedHashes = miningStats.maybeSubmittedSolutions || [];
  const hashSolution = findHashSolution(hash, submittedHashes);

  if (!hashSolution) {
    return <InvalidHashError />;
  }

  return (
    <div className="container mx-auto p-6">
      <HashDetailsContent hash={hashSolution} />
    </div>
  );
}
