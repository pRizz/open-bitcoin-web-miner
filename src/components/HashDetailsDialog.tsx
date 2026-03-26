import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FoundHashSolution } from "@/types/mining";
import { HashDetailsContent } from "./HashDetailsContent";

interface HashDetailsDialogProps {
  hash: FoundHashSolution;
}

export function HashDetailsDialog({ hash }: HashDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className="text-blue-500 hover:text-blue-400">
        View Details
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hash Details</DialogTitle>
        </DialogHeader>
        <HashDetailsContent hash={hash} />
      </DialogContent>
    </Dialog>
  );
}
