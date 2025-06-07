import { WebSocketServerMessage, WebSocketClientMessage, MiningSubmission, NoncelessBlockHeader, MiningSubmissionResponse, BlockTemplateUpdate } from "@/types/websocket";
import API_CONFIG from "@/config/api";
import { createContext, useContext, useRef, useCallback } from "react";
import { useMinerInfo } from "./MinerInfoContext";
import { toast } from "@/hooks/use-toast";
import { useGlobalLeaderboard } from "@/contexts/GlobalLeaderboardContext";
import { Trophy } from "lucide-react";
import { MiningChallenge } from "@/types/mining";

interface MiningWebSocketContextType {
  connect: () => void;
  disconnect: () => void;
  submitSolution: (submission: MiningSubmission) => void;
  setCallbacks: (callbacks: MiningWebSocketCallbacks) => void;
}

const MiningWebSocketContext = createContext<MiningWebSocketContextType | undefined>(undefined);

interface MiningWebSocketCallbacks {
  onNewChallenge: (challenge: MiningChallenge) => void;
  onBlockTemplateUpdate: (blockTemplateUpdate: BlockTemplateUpdate) => void;
  onSubmissionResponse: (submissionResponse: MiningSubmissionResponse) => void;
  onConnectionStateChange: (connected: boolean) => void;
  onError: (error: string) => void;
}

export function MiningWebSocketProvider({ children }: { children: React.ReactNode }) {
  const maybeWebSocket = useRef<WebSocket | null>(null);
  const maybeCallbacks = useRef<MiningWebSocketCallbacks | null>(null);
  const { maybeMinerAddress, maybeBlockchainMessage, maybeLeaderboardUsername, maybeLeaderboardMessage } = useMinerInfo();
  const { refetch: refetchLeaderboard } = useGlobalLeaderboard();

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
        const { nonceless_block_header, target_leading_zero_count, mining_mode } = message.data;
        maybeCallbacks.current?.onNewChallenge(
          {
            noncelessBlockHeader: nonceless_block_header,
            targetZeros: target_leading_zero_count,
            webSocketMiningState: mining_mode,
            maybeProofOfReward: null
          }
        );
        break;
      }
      case "SubmissionResponse": {
        const { maybe_difficulty_update, work_metadata } = message.data;
        const submissionResponse: MiningSubmissionResponse = {
          maybe_difficulty_update,
          work_metadata
        };
        maybeCallbacks.current?.onSubmissionResponse(submissionResponse);
        break;
      }
      case "BlockTemplateUpdate": {
        const { nonceless_block_header, maybe_proof_of_reward, mining_mode } = message.data;
        maybeCallbacks.current?.onBlockTemplateUpdate(
          {
            nonceless_block_header,
            maybe_proof_of_reward,
            mining_mode
          }
        );
        break;
      }
      case "LeaderboardAddSuccess": {
        const { block_hash_hex, rank, leading_binary_zeroes } = message.data;
        console.log(`Global leaderboard entry added: Hash ${block_hash_hex}, Rank ${rank}, Binary Zeroes ${leading_binary_zeroes}`);
        toast({
          title: "🏆 Global Leaderboard Entry Added!",
          description: `You found a hash that had ${leading_binary_zeroes} leading binary zeroes and ranked #${rank} on the global leaderboard!`,
          // TODO: add link to submission page; broken
          // action: (
          //   <Link to="/leaderboard" className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600">
          //     <Trophy className="h-4 w-4" />
          //     View Leaderboard
          //   </Link>
          // ),
        });
        refetchLeaderboard();
        break;
      }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      maybeCallbacks.current?.onError(`Error processing WebSocket message: ${error}`);
    }
  }, [maybeCallbacks, refetchLeaderboard]);

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
