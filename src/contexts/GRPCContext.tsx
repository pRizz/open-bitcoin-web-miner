
import React, { createContext, useContext, useEffect } from "react";

interface GRPCContextType {
  isConnected: boolean;
  getNetworkInfo: () => Promise<{
    blockHeight?: number;
    networkDifficulty?: number;
  }>;
}

const GRPCContext = createContext<GRPCContextType | undefined>(undefined);

export function GRPCProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const response = await fetch('https://btc-mining-webapp.lightningfaucet.us:443/network-info');
        const data = await response.json();
        console.log('Network info response:', data);
      } catch (error) {
        console.error('Error fetching network info:', error);
      }
    };

    // Initial fetch
    fetchNetworkInfo();

    // Set up interval for subsequent fetches
    const intervalId = setInterval(fetchNetworkInfo, 7000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

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
