import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HashSolution } from "@/types/mining";
import { formatDuration } from "@/utils/formatters";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/notifications";
import { Button } from "@/components/ui/button";
import { HashDetailsContent } from "./HashDetailsContent";

interface HashDetailsDialogProps {
  hash: HashSolution;
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
