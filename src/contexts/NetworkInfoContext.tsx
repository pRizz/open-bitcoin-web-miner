import React, { createContext, useContext, useEffect, useState } from "react";
import API_CONFIG from "@/config/api";
import { calculateRequiredBinaryZeroes } from "@/utils/mining";

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

export interface NetworkInfoContextType {
  maybeBlockHeight: number | undefined;
  maybeNetworkDifficulty: number | undefined;
  maybeRequiredBinaryZeroes: number | undefined;
}

const NetworkInfoContext = createContext<NetworkInfoContextType | undefined>(undefined);

export function NetworkInfoProvider({ children }: { children: React.ReactNode }) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoContextType>({
    maybeBlockHeight: undefined,
    maybeNetworkDifficulty: undefined,
    maybeRequiredBinaryZeroes: undefined
  });

  useEffect(() => {
    const fetchAndSetNetworkInfo = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}/network-info`);
        const data: NetworkInfoResponse = await response.json();

        if (data.status !== 'success') {
          console.error('Network info response is not success:', data);
          return;
        }

        if (!data.data.result.Ok) {
          console.error('Network info response is not Ok:', data);
          return;
        }

        const { block_height, network_difficulty } = data.data.result.Ok;

        // Only update if values are different
        if (block_height !== networkInfo.maybeBlockHeight ||
              network_difficulty !== networkInfo.maybeNetworkDifficulty) {
          const requiredZeroes = calculateRequiredBinaryZeroes(network_difficulty);
          setNetworkInfo({
            maybeBlockHeight: block_height,
            maybeNetworkDifficulty: network_difficulty,
            maybeRequiredBinaryZeroes: requiredZeroes
          });
        }

      } catch (error) {
        console.error('Error fetching network info:', error);
      }
    };

    // Initial fetch
    fetchAndSetNetworkInfo();

    // Set up interval for subsequent fetches
    const intervalId = setInterval(fetchAndSetNetworkInfo, 7000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [networkInfo]); // Added networkInfo to dependencies since we're using it in the comparison

  return (
    <NetworkInfoContext.Provider value={networkInfo}>
      {children}
    </NetworkInfoContext.Provider>
  );
}

export function useNetworkInfo() {
  const context = useContext(NetworkInfoContext);
  if (!context) {
    throw new Error("useNetworkInfo must be used within a NetworkInfoProvider");
  }
  return context;
}
