import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// WSL:
// import * as degen_server from "file:///mnt/c/Users/prysz/Repos/leading-zero-lab/external/deno_/degen_server.ts";

// Running deno from Powershell onWindows:
import * as degen_server from "./degen_server.ts";

import { type CallContext, type CallOptions } from "npm:nice-grpc-common@2.0.2";
import {createChannel, createClient} from 'npm:nice-grpc@2.1.10';

const LOCAL_GRPC_ENDPOINT = "http://localhost:8080";
const REMOTE_GRPC_ENDPOINT = "https://degen-server.lightningfaucet.us:443";
const GRPC_ENDPOINT = LOCAL_GRPC_ENDPOINT;
// const GRPC_ENDPOINT = REMOTE_GRPC_ENDPOINT;
// https://hewfqryvvczqdsnsqzxs.supabase.co/functions/v1/grpc-relay

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// export type Handler = (
//   request: Request,
//   connInfo: ConnInfo,
// ) => Response | Promise<Response>;

serve(async (req: Request, connInfo: ConnInfo) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("GRPC_ENDPOINT:", GRPC_ENDPOINT);
    const channel = createChannel(GRPC_ENDPOINT);

    const client = createClient(
      degen_server.DegenServiceDefinition,
      channel,
    );
  
    console.log("Client:", client);

    const request = degen_server.GetBitcoinNetworkInfoRequest.create();
    const response = await client.getBitcoinNetworkInfo(request);
    console.log("Bitcoin Network Info Response:", response);


    // Extract data based on whether it's an OK or Error response
    let responseData;
    if (response.ok) {
      responseData = {
        status: 'ok',
        blockHeight: response.ok.blockHeight,
        networkDifficulty: response.ok.networkDifficulty
      };
    } else if (response.error) {
      responseData = {
        status: 'error',
        errorEnum: degen_server.getBitcoinNetworkInfoResponseError_GetBitcoinNetworkInfoErrorEnumToJSON(response.error.errorEnum),
        errorMessage: response.error.errorMessage
      };
    }

    return new Response(JSON.stringify(responseData), { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error getting Bitcoin network info:", error);
    return new Response(JSON.stringify({ 
      status: 'error',
      message: error.message 
    }), { 
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  // Check if it's a WebSocket upgrade request
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {    
    // FIXME: This is a hack to get the WebSocket URL for the project. The url might change.
    const wsUrl = `wss://hewfqryvvczqdsnsqzxs.supabase.co/functions/v1/grpc-relay`;

    console.log("Returning WebSocket URL:", wsUrl);
    return new Response(JSON.stringify({ wsUrl }), { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Upgrade the connection to WebSocket
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    console.log("New WebSocket connection established");

    // Connect to the gRPC server
    const serverSocket = new WebSocket(GRPC_ENDPOINT);
    
    // Forward messages from client to server
    clientSocket.onmessage = (event) => {
      console.log("Forwarding message to gRPC server:", event.data);
      serverSocket.send(event.data);
    };

    // Forward messages from server to client
    serverSocket.onmessage = (event) => {
      console.log("Forwarding message to client:", event.data);
      clientSocket.send(event.data);
    };

    // Handle client disconnection
    clientSocket.onclose = () => {
      console.log("Client disconnected");
      serverSocket.close();
    };

    // Handle server disconnection
    serverSocket.onclose = () => {
      console.log("Server disconnected");
      clientSocket.close();
    };

    // Handle errors
    clientSocket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    serverSocket.onerror = (error) => {
      console.error("Server WebSocket error:", error);
    };

    return response;
  } catch (error) {
    console.error("Error setting up WebSocket connection:", error);
    return new Response(`Failed to set up WebSocket connection: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});