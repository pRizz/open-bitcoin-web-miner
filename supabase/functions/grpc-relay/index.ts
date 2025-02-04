import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GRPC_ENDPOINT = "https://degen-server.lightningfaucet.us:443";
// https://hewfqryvvczqdsnsqzxs.supabase.co/functions/v1/grpc-relay
// wss://edge-runtime.supabase.com/functions/v1/grpc-relay
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Pretty print the whole request
  console.log("Received request:", JSON.stringify(req, null, 2));

  console.log("Received request:", req.url);
  console.log("Headers:", req.headers);
  // Pretty print the headers
  console.log("Headers:", JSON.stringify(req.headers, null, 2));

  // Check if it's a WebSocket upgrade request
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    // Get the project reference from the host header
    const projectRef = req.headers.get("project_ref") || "";
    console.log("project_ref header value:", projectRef);
    
    // Construct the WebSocket URL using the project reference
    // FIXME: This is a hack to get the WebSocket URL for the project. The url might change.
    const wsUrl = `wss://${projectRef}.supabase.co/functions/v1/grpc-relay`;

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