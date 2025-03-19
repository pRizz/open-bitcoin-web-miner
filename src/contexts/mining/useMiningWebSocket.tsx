import { WebSocketServerMessage, WebSocketClientMessage, MiningSubmission, NoncelessBlockHeader, DifficultyUpdate, MiningSubmissionStatus } from "@/types/websocket";
import API_CONFIG from "@/config/api";
import { createContext, useContext, useRef, useCallback } from "react";
import { useMinerInfo } from "./MinerInfoContext";
import { toast } from "@/hooks/use-toast";

interface MiningWebSocketContextType {
  connect: () => void;
  disconnect: () => void;
  submitSolution: (submission: MiningSubmission) => void;
  setCallbacks: (callbacks: MiningWebSocketCallbacks) => void;
}

const MiningWebSocketContext = createContext<MiningWebSocketContextType | undefined>(undefined);

interface MiningWebSocketCallbacks {
  onNewChallenge: (jobId: string, blockHeader: NoncelessBlockHeader, targetZeros: number) => void;
  onBlockTemplateUpdate: (blockHeader: NoncelessBlockHeader) => void;
  onSubmissionResponse: (status: MiningSubmissionStatus, message: string, maybeDifficultyUpdate: DifficultyUpdate | null) => void;
  onConnectionStateChange: (connected: boolean) => void;
  onError: (error: string) => void;
}

export function MiningWebSocketProvider({ children }: { children: React.ReactNode }) {
  const maybeWebSocket = useRef<WebSocket | null>(null);
  const maybeCallbacks = useRef<MiningWebSocketCallbacks | null>(null);
  const { maybeMinerAddress, maybeBlockchainMessage, maybeLeaderboardUsername, maybeLeaderboardMessage } = useMinerInfo();

  console.log("MiningWebSocketProvider constructor called");

  const setCallbacks = (callbacks: MiningWebSocketCallbacks) => {
    console.log("Setting MiningWebSocketManager callbacks");
    maybeCallbacks.current = callbacks;
  }

  const onOpen = useCallback(() => {
    console.log('in useMiningWebSocket onOpen, WebSocket connection established');

    const data: {
      maybeBtcRewardAddress?: string | null;
      maybeBlockchainMessage?: string | null;
      maybeLeaderboardUsername?: string | null;
      maybeLeaderboardMessage?: string | null;
    } = {};
    if (maybeMinerAddress) {
      data.maybeBtcRewardAddress = maybeMinerAddress;
    }
    if (maybeBlockchainMessage) {
      data.maybeBlockchainMessage = maybeBlockchainMessage;
    }
    if (maybeLeaderboardUsername) {
      data.maybeLeaderboardUsername = maybeLeaderboardUsername;
    }
    if (maybeLeaderboardMessage) {
      data.maybeLeaderboardMessage = maybeLeaderboardMessage;
    }

    const startMiningMessage: WebSocketClientMessage = {
      type: "StartMining",
      data
    };
    console.log("in useMiningWebSocket onOpen, sending StartMining message, minerAddress:", maybeMinerAddress);
    maybeWebSocket.current?.send(JSON.stringify(startMiningMessage));

    maybeCallbacks.current?.onConnectionStateChange(true);
  }, [maybeMinerAddress, maybeBlockchainMessage, maybeLeaderboardUsername, maybeLeaderboardMessage, maybeCallbacks, maybeWebSocket]);

  const onMessage = useCallback((event: MessageEvent) => {
    try {
      console.log("in useMiningWebSocket onMessage, received message");
      const message = JSON.parse(event.data) as WebSocketServerMessage;
      console.log('WebSocket message received:', message);

      switch (message.type) {
      case "ChallengeResponse": {
        const { job_id, nonceless_block_header, target_leading_zero_count } = message.data;
        maybeCallbacks.current?.onNewChallenge(
          job_id,
          nonceless_block_header,
          target_leading_zero_count
        );
        break;
      }
      case "SubmissionResponse": {
        const { status, message: responseMessage, maybe_difficulty_update } = message.data;
        maybeCallbacks.current?.onSubmissionResponse(status, responseMessage, maybe_difficulty_update);
        break;
      }
      case "BlockTemplateUpdate": {
        const { nonceless_block_header } = message.data;
        maybeCallbacks.current?.onBlockTemplateUpdate(nonceless_block_header);
        break;
      }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      maybeCallbacks.current?.onError(`Error processing WebSocket message: ${error}`);
    }
  }, [maybeCallbacks]);

  const onError = useCallback((error: ErrorEvent) => {
    console.error('WebSocket error:', error);
    toast({
      variant: "destructive",
      title: "Mining Connection Error",
      description: "An error occurred while attempting to mine. Please try again.",
    });
    maybeCallbacks.current?.onError('WebSocket error occurred');
  }, [maybeCallbacks]);

  const onClose = useCallback(() => {
    console.log('WebSocket connection closed');
    if (maybeWebSocket.current) {
      maybeCallbacks.current?.onConnectionStateChange(false);
      maybeWebSocket.current = null;
    } else {
      console.warn("Got onClose event, but WebSocket is not connected");
    }
  }, [maybeCallbacks, maybeWebSocket]);

  const connect = useCallback(() => {
    console.log("in useMiningWebSocket connect, connecting to WebSocket");
    if (maybeWebSocket.current) {
      console.warn("WebSocket already connected");
      return;
    }

    const wsProtocol = API_CONFIG.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${API_CONFIG.baseUrl.split('://')[1]}/mining-work`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = onOpen;
    ws.onmessage = onMessage;
    ws.onerror = onError;
    ws.onclose = onClose;

    maybeWebSocket.current = ws;
  }, [maybeWebSocket, onOpen, onMessage, onError, onClose]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket');
    if (maybeWebSocket.current) {
      maybeWebSocket.current.close();
      maybeWebSocket.current = null;
    } else {
      console.warn("Trying to disconnect, but WebSocket is not connected");
    }
  }, [maybeWebSocket]);

  const submitSolution = useCallback((submission: MiningSubmission) => {
    if (!maybeWebSocket.current || maybeWebSocket.current.readyState !== WebSocket.OPEN) {
      maybeCallbacks.current?.onError('Cannot submit solution: WebSocket not connected');
      return;
    }

    const submissionMessage: WebSocketClientMessage = {
      type: "Submission",
      data: submission
    };

    maybeWebSocket.current.send(JSON.stringify(submissionMessage));
  }, [maybeCallbacks, maybeWebSocket]);

  return (
    <MiningWebSocketContext.Provider value={{ connect, disconnect, submitSolution, setCallbacks }}>
      {children}
    </MiningWebSocketContext.Provider>
  );
};

export const useMiningWebSocket = () => {
  const context = useContext(MiningWebSocketContext);
  if (!context) {
    throw new Error("useMiningWebSocket must be used within a MiningWebSocketProvider");
  }
  return context;
};
