
import React, { createContext, useContext } from "react";

interface GRPCContextType {
  isConnected: boolean;
  getNetworkInfo: () => Promise<{
    blockHeight?: number;
    networkDifficulty?: number;
  }>;
}

const GRPCContext = createContext<GRPCContextType | undefined>(undefined);

export function GRPCProvider({ children }: { children: React.ReactNode }) {
  const getNetworkInfo = async () => {
    // Since we've removed the GRPC integration, return mock data
    return {
      blockHeight: 0,
      networkDifficulty: 0
    };
  };

  return (
    <GRPCContext.Provider value={{ 
      isConnected: false,
      getNetworkInfo
    }}>
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
