import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GRPCContextType {
  isConnected: boolean;
  sendMessage: (message: string) => void;
  lastMessage: string | null;
}

const GRPCContext = createContext<GRPCContextType | undefined>(undefined);

export function GRPCProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // Construct WebSocket URL directly
        const wsUrl = `wss://hewfqryvvczqdsnsqzxs.supabase.co/functions/v1/grpc-relay`;
        
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          toast({
            title: "Connected to GRPC server",
            description: "WebSocket connection established",
          });
        };

        socket.onmessage = (event) => {
          console.log('Received message:', event.data);
          setLastMessage(event.data);
        };

        socket.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          toast({
            title: "Disconnected from GRPC server",
            description: "WebSocket connection closed",
            variant: "destructive",
          });
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast({
            title: "WebSocket Error",
            description: "Failed to connect to GRPC server",
            variant: "destructive",
          });
        };

        socketRef.current = socket;
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        toast({
          title: "Connection Error",
          description: error instanceof Error ? error.message : "Failed to connect to GRPC server",
          variant: "destructive",
        });
      }
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [toast]);

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

  return (
    <GRPCContext.Provider value={{ isConnected, sendMessage, lastMessage }}>
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