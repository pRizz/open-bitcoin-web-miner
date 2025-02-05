import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// import * as pb from "@/generated/external/degen_server_pb";
// import * as pb from "../../../external/src/degen_server_pb";

interface GRPCContextType {
  isConnected: boolean;
  sendMessage: (message: string) => void;
  lastMessage: string | null;
  getNetworkInfo: () => Promise<any>;
}

const GRPCContext = createContext<GRPCContextType | undefined>(undefined);

export function GRPCProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // useEffect(() => {
  //   const connectWebSocket = async () => {
  //     try {
  //       const { data, error } = await supabase.functions.invoke('grpc-relay');
  //       console.log('Supabase function response:', { data, error });

  //       if (error) {
  //         console.error('Error getting WebSocket URL:', error);
  //         throw error;
  //       }

  //       if (!data?.wsUrl) {
  //         throw new Error('No WebSocket URL returned from server');
  //       }

  //       console.log('Retrieved WebSocket URL:', data.wsUrl);
  //       console.log('Waiting 2 seconds before connecting...');
        
  //       // Add 2 second delay
  //       await new Promise(resolve => setTimeout(resolve, 2000));
        
  //       console.log('Connecting to WebSocket URL:', data.wsUrl);
  //       const socket = new WebSocket(data.wsUrl);

  //       socket.onopen = () => {
  //         console.log('WebSocket connected');
  //         setIsConnected(true);
  //         toast({
  //           title: "Connected to GRPC server",
  //           description: "WebSocket connection established",
  //         });
  //       };

  //       socket.onmessage = (event) => {
  //         console.log('Received message:', event.data);
  //         setLastMessage(event.data);
  //       };

  //       socket.onclose = () => {
  //         console.log('WebSocket disconnected');
  //         setIsConnected(false);
  //         toast({
  //           title: "Disconnected from GRPC server",
  //           description: "WebSocket connection closed",
  //           variant: "destructive",
  //         });
  //       };

  //       socket.onerror = (error) => {
  //         console.error('WebSocket error:', error);
  //         toast({
  //           title: "WebSocket Error",
  //           description: "Failed to connect to GRPC server",
  //           variant: "destructive",
  //         });
  //       };

  //       socketRef.current = socket;
  //     } catch (error) {
  //       console.error('Error connecting to WebSocket:', error);
  //       toast({
  //         title: "Connection Error",
  //         description: error instanceof Error ? error.message : "Failed to connect to GRPC server",
  //         variant: "destructive",
  //       });
  //     }
  //   };

  //   connectWebSocket();

  //   return () => {
  //     if (socketRef.current) {
  //       socketRef.current.close();
  //     }
  //   };
  // }, [toast]);

  const sendMessage = (message: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(message);
    } else {
      toast({
        title: "Cannot send message",
        description: "WebSocket is not connected",
        variant: "destructive",
      });
    }
  };

  const getNetworkInfo = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('grpc-relay');
      
      if (error) throw error;
      
      // {      responseData = {
      //         status: 'ok',
      //         blockHeight: response.ok.blockHeight,
      //         networkDifficulty: response.ok.networkDifficulty
      //       };
      return data;
    } catch (error) {
      console.error('Error getting network info:', error);
      throw error;
    }
  };

  return (
    <GRPCContext.Provider value={{ isConnected, sendMessage, lastMessage, getNetworkInfo }}>
      {children}
    </GRPCContext.Provider>
  );
}

export function useGRPC() {
  const context = useContext(GRPCContext);
  if (!context) {
    throw new Error("useGRPC must be used within a GRPCProvider");
  }
  return context;
}