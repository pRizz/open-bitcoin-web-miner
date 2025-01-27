import { TableCell, TableRow } from "@/components/ui/table";
import { HashSolution } from "@/types/mining";
import { formatDuration } from "@/utils/formatters";
import { HashDetailsDialog } from "./HashDetailsDialog";

interface HashTableRowProps {
  hash: HashSolution;
}

export function HashTableRow({ hash }: HashTableRowProps) {
  return (
    <TableRow className="animate-fade-in">
      <TableCell>{hash.binaryZeroes}</TableCell>
      <TableCell>{hash.hexZeroes}</TableCell>
      <TableCell className="font-mono text-xs truncate max-w-[200px]">
        0x{hash.hash}
      </TableCell>
      <TableCell>{formatDuration(hash.timeToFind)}</TableCell>
      <TableCell>
        <HashDetailsDialog hash={hash} />
      </TableCell>
    </TableRow>
  );
}