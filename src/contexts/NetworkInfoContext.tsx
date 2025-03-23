import React, { createContext, useContext, useEffect, useState } from "react";
import API_CONFIG from "@/config/api";
import { calculateRequiredBinaryZeroes } from "@/utils/mining";

interface NetworkInfoResponse {
  data: {
    block_height: number;
    network_difficulty: number;
    server_starting_min_leading_zero_count: number;
  };
  status: string;
}

interface WebsocketCountResponse {
  status: string;
  data: {
    connected_websocket_count: number;
    connected_miner_count: number;
  };
}

export interface NetworkInfoContextType {
  maybeBlockHeight: number | undefined;
  maybeNetworkDifficulty: number | undefined;
  maybeRequiredBinaryZeroes: number | undefined;
  maybeConnectedWebsocketCount: number | undefined;
  maybeConnectedMinerCount: number | undefined;
  maybeServerStartingMinLeadingZeroCount: number | undefined;
}

const NetworkInfoContext = createContext<NetworkInfoContextType | undefined>(undefined);

export function NetworkInfoProvider({ children }: { children: React.ReactNode }) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoContextType>({
    maybeBlockHeight: undefined,
    maybeNetworkDifficulty: undefined,
    maybeRequiredBinaryZeroes: undefined,
    maybeConnectedWebsocketCount: undefined,
    maybeConnectedMinerCount: undefined,
    maybeServerStartingMinLeadingZeroCount: undefined
  });

  useEffect(() => {
    const fetchAndSetNetworkInfo = async () => {
      try {
        const [networkResponse, websocketResponse] = await Promise.all([
          fetch(`${API_CONFIG.baseUrl}/network-info`),
          fetch(`${API_CONFIG.baseUrl}/websocket-count`)
        ]);

        const networkData: NetworkInfoResponse = await networkResponse.json();
        const websocketData: WebsocketCountResponse = await websocketResponse.json();

        if (networkData.status !== 'success' || websocketData.status !== 'success') {
          console.error('One or more responses not successful:', { networkData, websocketData });
          return;
        }

        console.log('Network data:', networkData);

        if (!networkData.data) {
          console.error('Network info response is not Ok:', networkData);
          return;
        }

        const { block_height, network_difficulty, server_starting_min_leading_zero_count } = networkData.data;
        const { connected_websocket_count, connected_miner_count } = websocketData.data;
        console.log('Connected websocket count:', connected_websocket_count);
        console.log('Connected miners count:', connected_miner_count);
        console.log('Network difficulty:', network_difficulty);
        console.log('Block height:', block_height);

        // Only update if values are different
        if (block_height !== networkInfo.maybeBlockHeight ||
            network_difficulty !== networkInfo.maybeNetworkDifficulty ||
            connected_websocket_count !== networkInfo.maybeConnectedWebsocketCount ||
            connected_miner_count !== networkInfo.maybeConnectedMinerCount) {
          const requiredZeroes = calculateRequiredBinaryZeroes(network_difficulty);
          setNetworkInfo({
            maybeBlockHeight: block_height,
            maybeNetworkDifficulty: network_difficulty,
            maybeRequiredBinaryZeroes: requiredZeroes,
            maybeConnectedWebsocketCount: connected_websocket_count,
            maybeConnectedMinerCount: connected_miner_count,
            maybeServerStartingMinLeadingZeroCount: server_starting_min_leading_zero_count
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
