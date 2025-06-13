import { createContext, useContext, useState } from "react";
import {
  loadMinerAddress,
  saveMinerAddress,
  loadBlockchainMessage,
  saveBlockchainMessage,
  loadLeaderboardUsername,
  saveLeaderboardUsername,
  loadLeaderboardMessage,
  saveLeaderboardMessage,
  STORAGE_KEYS
} from "@/utils/localStorage";

interface MinerInfoContextType {
    maybeMinerAddress: string | null;
    setMinerAddress: (minerAddress: string | null) => void;
    maybeBlockchainMessage: string | null;
    setBlockchainMessage: (message: string | null) => void;
    maybeLeaderboardUsername: string | null;
    setLeaderboardUsername: (username: string | null) => void;
    maybeLeaderboardMessage: string | null;
    setLeaderboardMessage: (message: string | null) => void;
    resetSettings: () => void;
    resetLeaderboardInfo: () => void;
}

const defaultContext: MinerInfoContextType = {
  maybeMinerAddress: null,
  setMinerAddress: () => {},
  maybeBlockchainMessage: null,
  setBlockchainMessage: () => {},
  maybeLeaderboardUsername: null,
  setLeaderboardUsername: () => {},
  maybeLeaderboardMessage: null,
  setLeaderboardMessage: () => {},
  resetSettings: () => {},
  resetLeaderboardInfo: () => {},
}

export const MinerInfoContext = createContext<MinerInfoContextType>(defaultContext);

export function MinerInfoProvider({ children }: { children: React.ReactNode }) {
  const [maybeMinerAddress, setMinerAddressState] = useState<string | null>(() => loadMinerAddress());
  const [maybeBlockchainMessage, setBlockchainMessageState] = useState<string | null>(() => loadBlockchainMessage());
  const [maybeLeaderboardUsername, setLeaderboardUsernameState] = useState<string | null>(() => loadLeaderboardUsername());
  const [maybeLeaderboardMessage, setLeaderboardMessageState] = useState<string | null>(() => loadLeaderboardMessage());

  const setMinerAddress = (minerAddress: string | null) => {
    setMinerAddressState(minerAddress);
    saveMinerAddress(minerAddress);
  };

  const setBlockchainMessage = (message: string | null) => {
    setBlockchainMessageState(message);
    saveBlockchainMessage(message);
  };

  const setLeaderboardUsername = (username: string | null) => {
    setLeaderboardUsernameState(username);
    saveLeaderboardUsername(username);
  };

  const setLeaderboardMessage = (message: string | null) => {
    setLeaderboardMessageState(message);
    saveLeaderboardMessage(message);
  };

  const resetSettings = () => {
    setMinerAddressState(null);
    setBlockchainMessageState(null);
    setLeaderboardUsernameState(null);
    setLeaderboardMessageState(null);
    localStorage.removeItem(STORAGE_KEYS.MINER_ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.BLOCKCHAIN_MESSAGE);
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD_USERNAME);
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD_MESSAGE);
  };

  const resetLeaderboardInfo = () => {
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD_USERNAME);
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD_MESSAGE);
  };

  return (
    <MinerInfoContext.Provider value={{
      maybeMinerAddress,
      setMinerAddress,
      maybeBlockchainMessage,
      setBlockchainMessage,
      maybeLeaderboardUsername,
      setLeaderboardUsername,
      maybeLeaderboardMessage,
      setLeaderboardMessage,
      resetSettings,
      resetLeaderboardInfo
    }}>
      {children}
    </MinerInfoContext.Provider>
  );
}

export function useMinerInfo() {
  const context = useContext(MinerInfoContext);
  if (!context) {
    throw new Error("useMinerInfo must be used within a MinerInfoProvider");
  }
  return context;
}
