import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HashSolution } from "@/types/mining";
import { formatDuration } from "@/utils/formatters";

interface HashDetailsDialogProps {
  hash: HashSolution;
}

export function HashDetailsDialog({ hash }: HashDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className="text-blue-500 hover:text-blue-400">
        View
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hash Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 font-mono text-sm">
          <div>
            <div className="text-gray-400">Hash</div>
            <div className="break-all">{hash.hash}</div>
          </div>
          <div>
            <div className="text-gray-400">Time to Find</div>
            <div>{formatDuration(hash.timeToFind)}</div>
          </div>
          <div>
            <div className="text-gray-400">Nonce</div>
            <div>{hash.nonce}</div>
          </div>
          <div>
            <div className="text-gray-400">Previous Block</div>
            <div className="break-all">{hash.previousBlock}</div>
          </div>
          <div>
            <div className="text-gray-400">Merkle Root</div>
            <div className="break-all">{hash.merkleRoot}</div>
          </div>
          <div>
            <div className="text-gray-400">Timestamp</div>
            <div>{new Date(hash.timestamp * 1000).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-400">Version</div>
            <div>{hash.version}</div>
          </div>
          <div>
            <div className="text-gray-400">Bits</div>
            <div>{hash.bits}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}