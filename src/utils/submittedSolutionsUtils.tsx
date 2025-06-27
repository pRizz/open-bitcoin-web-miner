import { HashSolution } from "@/types/mining";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import React from "react";

const PENDING_TIMEOUT_MS = 10_000; // 10 seconds

export const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

export const getEffectiveStatus = (hashSolution: HashSolution) => {
  if (hashSolution.status === 'pending') {
    const pendingDurationMs = Date.now() - hashSolution.timestamp;
    if (pendingDurationMs > PENDING_TIMEOUT_MS) {
      return 'rejected';
    }
  }
  return hashSolution.status;
};

export const getStatusIcon = (effectiveStatus: string): JSX.Element | null => {
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

export const getStatusText = (effectiveStatus: string, originalStatus: string) => {
  switch (effectiveStatus) {
  case 'accepted':
    return 'Accepted';
  case 'rejected':
    return effectiveStatus === originalStatus ? 'Rejected' : 'Rejected (Timeout)';
  case 'outdated':
    return 'Outdated';
  case 'pending':
    return 'Pending';
  default:
    return 'Unknown';
  }
};