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
      <TableCell className="text-center">{hash.binaryZeroes}</TableCell>
      <TableCell className="text-center">{hash.hexZeroes}</TableCell>
      <TableCell className="font-mono text-xs truncate max-w-[200px] text-center">
        0x{hash.hash}
      </TableCell>
      <TableCell className="text-center">{formatDuration(hash.timeToFind)}</TableCell>
      <TableCell className="text-center">
        <HashDetailsDialog hash={hash} />
      </TableCell>
    </TableRow>
  );
}