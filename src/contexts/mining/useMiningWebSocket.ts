import { WebSocketServerMessage, WebSocketClientMessage, MiningSubmission, NoncelessBlockHeader, DifficultyUpdate } from "@/types/websocket";
import API_CONFIG from "@/config/api";
import { useRef } from "react";

interface WebSocketCallbacks {
  onNewChallenge: (jobId: string, blockHeader: NoncelessBlockHeader, targetZeros: number) => void;
  onBlockTemplateUpdate: (blockHeader: NoncelessBlockHeader) => void;
  onSubmissionResponse: (status: string, message: string, maybeDifficultyUpdate: DifficultyUpdate | null) => void;
  onConnectionStateChange: (connected: boolean) => void;
  onError: (error: string) => void;
}

export function MiningWebSocketManager() {
  const maybeWebSocket = useRef<WebSocket | null>(null);
  const maybeCallbacks = useRef<WebSocketCallbacks | null>(null);

  console.log("MiningWebSocketManager constructor called");

  const setCallbacks = (callbacks: WebSocketCallbacks) => {
    console.log("Setting MiningWebSocketManager callbacks");
    maybeCallbacks.current = callbacks;
  }

  const connect = () => {
    if (maybeWebSocket.current) {
      console.log("WebSocket already connected");
      return;
    }

    const wsProtocol = API_CONFIG.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${API_CONFIG.baseUrl.split('://')[1]}/mining-work`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      maybeCallbacks.current?.onConnectionStateChange(true);
    };

    ws.onmessage = (event) => {
      try {
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
          maybeCallbacks.current?.onSubmissionResponse(status.toString(), responseMessage, maybe_difficulty_update);
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
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      maybeCallbacks.current?.onError('WebSocket error occurred');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      maybeCallbacks.current?.onConnectionStateChange(false);
      maybeWebSocket.current = null;
    };

    maybeWebSocket.current = ws;
  }

  const disconnect = () => {
    console.log('Disconnecting WebSocket');
    if (maybeWebSocket.current) {
      maybeWebSocket.current.close();
      maybeWebSocket.current = null;
    }
  }

  const submitSolution = (submission: MiningSubmission) => {
    if (!maybeWebSocket.current || maybeWebSocket.current.readyState !== WebSocket.OPEN) {
      maybeCallbacks.current?.onError('Cannot submit solution: WebSocket not connected');
      return;
    }

    const message: WebSocketClientMessage = {
      type: "Submission",
      data: submission
    };

    maybeWebSocket.current.send(JSON.stringify(message));
  }

  return {
    connect,
    disconnect,
    submitSolution,
    setCallbacks
  }
}