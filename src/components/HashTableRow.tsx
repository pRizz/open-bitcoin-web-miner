import { TableCell, TableRow } from "@/components/ui/table";
import { HashSolution } from "@/types/mining";
import { formatDuration } from "@/utils/formatters";
import { HashDetailsDialog } from "./HashDetailsDialog";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PENDING_TIMEOUT_MS = 10_000; // 10 seconds

interface HashTableRowProps {
  hashSolution: HashSolution;
}

export function HashTableRow({ hashSolution }: HashTableRowProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEffectiveStatus = () => {
    if (hashSolution.status === 'pending') {
      const pendingDurationMs = Date.now() - hashSolution.timestamp;
      if (pendingDurationMs > PENDING_TIMEOUT_MS) {
        return 'rejected';
      }
    }
    return hashSolution.status;
  };

  const effectiveStatus = getEffectiveStatus();

  const getStatusIcon = () => {
    switch (effectiveStatus) {
    case 'accepted':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'outdated':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'pending':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    default:
      return null;
    }
  };

  const getStatusText = () => {
    switch (effectiveStatus) {
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return effectiveStatus === hashSolution.status ? 'Rejected' : 'Rejected (Timeout)';
    case 'outdated':
      return 'Outdated';
    case 'pending':
      return 'Pending';
    default:
      return 'Unknown';
    }
  };

  return (
    <TableRow>
      <TableCell className="text-center font-mono">
        {formatTimestamp(hashSolution.timestamp)}
      </TableCell>
      <TableCell className="text-center font-mono">
        {hashSolution.binaryZeroes}
      </TableCell>
      <TableCell className="text-center font-mono">
        {hashSolution.hexZeroes}
      </TableCell>
      <TableCell className="text-center font-mono">
        {hashSolution.hash.slice(0, 20)}...
      </TableCell>
      <TableCell className="text-center font-mono">
        {formatDuration(hashSolution.timeToFindMs)}
      </TableCell>
      <TableCell className="text-center">
        {hashSolution.status && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                {getStatusIcon()}
              </TooltipTrigger>
              <TooltipContent>
                <p>{getStatusText()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
      <TableCell className="text-center">
        <span className="font-mono text-xs text-muted-foreground">
          {hashSolution.nonceNumber}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <HashDetailsDialog hash={hashSolution} />
      </TableCell>
    </TableRow>
  );
}