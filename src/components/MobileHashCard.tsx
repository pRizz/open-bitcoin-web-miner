import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HashSolution } from "@/types/mining";
import { formatDuration } from "@/utils/formatters";
import { HashDetailsDialog } from "./HashDetailsDialog";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTimestamp, getEffectiveStatus, getStatusIcon, getStatusText } from "@/utils/submittedSolutionsUtils";

interface MobileHashCardProps {
  hashSolution: HashSolution;
}

export function MobileHashCard({ hashSolution }: MobileHashCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const effectiveStatus = getEffectiveStatus(hashSolution);

  return (
    <Card className="p-4 mb-3 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-muted-foreground">
            {formatTimestamp(hashSolution.timestamp)}
          </span>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                {getStatusIcon(effectiveStatus)}
              </TooltipTrigger>
              <TooltipContent>
                <p>{getStatusText(effectiveStatus, hashSolution.status)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Binary Zeroes:</span>
          <span className="font-mono ml-1">{hashSolution.binaryZeroes}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Hex Zeroes:</span>
          <span className="font-mono ml-1">{hashSolution.hexZeroes}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Time to Find:</span>
          <span className="font-mono ml-1">{formatDuration(hashSolution.timeToFindMs)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Nonce:</span>
          <span className="font-mono ml-1 text-xs">{hashSolution.nonceNumber}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="mb-2">
            <span className="text-muted-foreground text-sm">Hash:</span>
            <div className="font-mono text-xs break-all mt-1">
              {hashSolution.hash}
            </div>
          </div>
          <div className="flex justify-end">
            <HashDetailsDialog hash={hashSolution} />
          </div>
        </div>
      )}
    </Card>
  );
}