
import React, { createContext, useContext, useEffect, useState } from "react";

interface NetworkInfoResponse {
  data: {
    result: {
      Ok: {
        block_height: number;
        network_difficulty: number;
      }
    }
  };
  status: string;
}

interface GRPCContextType {
  isConnected: boolean;
  getNetworkInfo: () => Promise<{
    blockHeight?: number;
    networkDifficulty?: number;
  }>;
}

const GRPCContext = createContext<GRPCContextType | undefined>(undefined);

export function GRPCProvider({ children }: { children: React.ReactNode }) {
  const [networkInfo, setNetworkInfo] = useState<{
    blockHeight?: number;
    networkDifficulty?: number;
  }>({});

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const response = await fetch('https://btc-mining-webapp.lightningfaucet.us:443/network-info');
        const data: NetworkInfoResponse = await response.json();
        console.log('Network info response:', data);

        if (data.status === 'success' && data.data.result.Ok) {
          const { block_height, network_difficulty } = data.data.result.Ok;
          setNetworkInfo({
            blockHeight: block_height,
            networkDifficulty: network_difficulty
          });
        }
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
    return networkInfo;
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
