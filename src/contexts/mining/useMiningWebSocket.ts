import { WebSocketServerMessage, WebSocketClientMessage, MiningSubmission, NoncelessBlockHeader } from "@/types/websocket";
import API_CONFIG from "@/config/api";

interface WebSocketCallbacks {
  onNewChallenge: (jobId: string, blockHeader: NoncelessBlockHeader, targetZeros: number) => void;
  onBlockTemplateUpdate: (blockHeader: NoncelessBlockHeader) => void;
  onSubmissionResponse: (status: string, message: string) => void;
  onConnectionStateChange: (connected: boolean) => void;
  onError: (error: string) => void;
}

export class MiningWebSocketManager {
  private maybeWebSocket: WebSocket | null = null;
  private maybeCallbacks: WebSocketCallbacks | null = null;

  constructor() {
    console.log("MiningWebSocketManager constructor called");
  }

  setCallbacks(callbacks: WebSocketCallbacks) {
    console.log("Setting MiningWebSocketManager callbacks");
    this.maybeCallbacks = callbacks;
  }

  connect() {
    if (this.maybeWebSocket) {
      console.log("WebSocket already connected");
      return;
    }

    const wsProtocol = API_CONFIG.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${API_CONFIG.baseUrl.split('://')[1]}/mining-work`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      this.maybeCallbacks.onConnectionStateChange(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketServerMessage;
        console.log('WebSocket message received:', message);

        switch (message.type) {
        case "ChallengeResponse": {
          const { job_id, nonceless_block_header, target_leading_zero_count } = message.data;
          this.maybeCallbacks.onNewChallenge(
            job_id,
            nonceless_block_header,
            target_leading_zero_count
          );
          break;
        }
        case "SubmissionResponse": {
          const { status, message: responseMessage } = message.data;
          this.maybeCallbacks.onSubmissionResponse(status.toString(), responseMessage);
          break;
        }
        case "BlockTemplateUpdate": {
          const { nonceless_block_header } = message.data;
          this.maybeCallbacks.onBlockTemplateUpdate(nonceless_block_header);
          break;
        }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        this.maybeCallbacks.onError(`Error processing WebSocket message: ${error}`);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.maybeCallbacks.onError('WebSocket error occurred');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.maybeCallbacks.onConnectionStateChange(false);
      this.maybeWebSocket = null;
    };

    this.maybeWebSocket = ws;
  }

  disconnect() {
    console.log('Disconnecting WebSocket');
    if (this.maybeWebSocket) {
      this.maybeWebSocket.close();
      this.maybeWebSocket = null;
    }
  }

  submitSolution(submission: MiningSubmission) {
    if (!this.maybeWebSocket || this.maybeWebSocket.readyState !== WebSocket.OPEN) {
      this.maybeCallbacks.onError('Cannot submit solution: WebSocket not connected');
      return;
    }

    const message: WebSocketClientMessage = {
      type: "Submission",
      data: submission
    };

    this.maybeWebSocket.send(JSON.stringify(message));
  }
}