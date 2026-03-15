import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { HashSolution } from "@/types/mining";
import { formatDuration } from "@/utils/formatters";
import { HashDetailsDialog } from "./HashDetailsDialog";

import MobileFriendlyTooltip from "@/components/ui/mobile-friendly-tooltip";
import { formatTimestamp, getEffectiveStatus, getStatusIcon, getStatusText } from "@/utils/submittedSolutionsUtils";

interface HashTableRowProps {
  hashSolution: HashSolution;
}

export function HashTableRow({ hashSolution }: HashTableRowProps) {
  const effectiveStatus = getEffectiveStatus(hashSolution);

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
          <MobileFriendlyTooltip
            content={<p>{getStatusText(effectiveStatus, hashSolution.status)}</p>}
          >
            {getStatusIcon(effectiveStatus)}
          </MobileFriendlyTooltip>
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