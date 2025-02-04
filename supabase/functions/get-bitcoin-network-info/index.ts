import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GRPC_ENDPOINT = "https://degen-server.lightningfaucet.us:443";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Connecting to gRPC endpoint:', GRPC_ENDPOINT);
    
    // Create WebSocket connection to gRPC server
    const ws = new WebSocket(GRPC_ENDPOINT);
    
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        console.log('WebSocket connected, sending network info request');
        
        // Create an empty GetBitcoinNetworkInfoRequest message
        const message = new Uint8Array([]);
        ws.send(message);
      };

      ws.onmessage = (event) => {
        console.log('Received network info response');
        ws.close();
        
        resolve(new Response(event.data, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }));
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
        reject(new Error('Failed to connect to gRPC server'));
      };

      // Set a timeout to prevent hanging connections
      setTimeout(() => {
        ws.close();
        reject(new Error('Request timed out'));
      }, 5000);
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});