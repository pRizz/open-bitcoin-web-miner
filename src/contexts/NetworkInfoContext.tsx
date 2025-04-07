import React, { createContext, useContext, useEffect, useState } from "react";
import API_CONFIG from "@/config/api";
import { calculateRequiredLeadingBinaryZeroes } from "@/utils/mining";

interface NetworkInfoResponse {
  data: {
    block_height: number;
    network_difficulty: number;
    server_starting_min_leading_zero_count: number;
    base_block_reward_sats: number;
    miner_reward_sats: number;
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
  maybeFormattedNetworkDifficulty: string | undefined;
  maybeNetworkRequiredLeadingZeroes: number | undefined;
  maybeConnectedWebsocketCount: number | undefined;
  maybeConnectedMinerCount: number | undefined;
  maybeServerStartingMinLeadingZeroCount: number | undefined;
  maybeBaseBlockReward: number | undefined;
  maybeMiningReward: number | undefined;
}

const NetworkInfoContext = createContext<NetworkInfoContextType | undefined>(undefined);

export function NetworkInfoProvider({ children }: { children: React.ReactNode }) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoContextType>({
    maybeBlockHeight: undefined,
    maybeFormattedNetworkDifficulty: undefined,
    maybeNetworkRequiredLeadingZeroes: undefined,
    maybeConnectedWebsocketCount: undefined,
    maybeConnectedMinerCount: undefined,
    maybeServerStartingMinLeadingZeroCount: undefined,
    maybeBaseBlockReward: undefined,
    maybeMiningReward: undefined
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

        const { block_height, network_difficulty, server_starting_min_leading_zero_count, base_block_reward_sats: base_block_reward, miner_reward_sats: mining_reward } = networkData.data;
        const { connected_websocket_count, connected_miner_count } = websocketData.data;
        console.log('Connected websocket count:', connected_websocket_count);
        console.log('Connected miners count:', connected_miner_count);
        console.log('Network difficulty:', network_difficulty);
        console.log('Block height:', block_height);

        // Only update if values are different
        if (block_height !== networkInfo.maybeBlockHeight ||
            connected_websocket_count !== networkInfo.maybeConnectedWebsocketCount ||
            connected_miner_count !== networkInfo.maybeConnectedMinerCount ||
            server_starting_min_leading_zero_count !== networkInfo.maybeServerStartingMinLeadingZeroCount ||
            base_block_reward !== networkInfo.maybeBaseBlockReward ||
            mining_reward !== networkInfo.maybeMiningReward) {
          console.log('network_difficulty', network_difficulty);
          const requiredZeroes = calculateRequiredLeadingBinaryZeroes(network_difficulty);
          console.log('requiredZeroes', requiredZeroes);

          // Format network difficulty with appropriate suffix
          let formattedDifficulty: string | undefined = undefined;
          if (network_difficulty !== undefined) {
            formattedDifficulty = formatNetworkDifficulty(network_difficulty);
          }

          setNetworkInfo({
            maybeBlockHeight: block_height,
            maybeFormattedNetworkDifficulty: formattedDifficulty,
            maybeNetworkRequiredLeadingZeroes: requiredZeroes,
            maybeConnectedWebsocketCount: connected_websocket_count,
            maybeConnectedMinerCount: connected_miner_count,
            maybeServerStartingMinLeadingZeroCount: server_starting_min_leading_zero_count,
            maybeBaseBlockReward: base_block_reward,
            maybeMiningReward: mining_reward
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

// Helper function to format network difficulty with appropriate suffix
function formatNetworkDifficulty(difficulty: number): string {
  if (difficulty < 1) {
    console.log('difficulty < 1', difficulty);
    // Use scientific notation for very small numbers
    return difficulty.toExponential(3);
  }

  // Define thresholds for different magnitudes
  const THRESHOLDS = [
    { threshold: 1e18, suffix: 'E' }, // Exa
    { threshold: 1e15, suffix: 'P' }, // Peta
    { threshold: 1e12, suffix: 'T' }, // Tera
    { threshold: 1e9, suffix: 'G' },  // Giga
    { threshold: 1e6, suffix: 'M' },  // Mega
    { threshold: 1e3, suffix: 'K' },  // Kilo
    { threshold: 1, suffix: '' }      // Base unit
  ];

  // Find the appropriate threshold
  for (const { threshold, suffix } of THRESHOLDS) {
    if (difficulty >= threshold) {
      // Format to 3 decimal places and append suffix
      return `${(difficulty / threshold).toFixed(3)}${suffix}`;
    }
  }

  // Fallback to base unit
  return difficulty.toFixed(3);
}
