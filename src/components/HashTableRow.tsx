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

interface HashTableRowProps {
  hash: HashSolution;
}

export function HashTableRow({ hash }: HashTableRowProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusIcon = () => {
    switch (hash.status) {
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
    switch (hash.status) {
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
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
        {formatTimestamp(hash.timestamp)}
      </TableCell>
      <TableCell className="text-center font-mono">
        {hash.binaryZeroes}
      </TableCell>
      <TableCell className="text-center font-mono">
        {hash.hexZeroes}
      </TableCell>
      <TableCell className="text-center font-mono">
        {hash.hash.slice(0, 20)}...
      </TableCell>
      <TableCell className="text-center font-mono">
        {formatDuration(hash.timeToFind)}
      </TableCell>
      <TableCell className="text-center">
        {hash.status && (
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
          {hash.nonce}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <HashDetailsDialog hash={hash} />
      </TableCell>
    </TableRow>
  );
}