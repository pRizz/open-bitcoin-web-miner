import { createContext, useContext, useState } from "react";
import { loadMinerAddress, saveMinerAddress, loadBlockchainMessage, saveBlockchainMessage, STORAGE_KEYS } from "@/utils/localStorage";

interface MinerInfoContextType {
    maybeMinerAddress: string | null;
    setMinerAddress: (minerAddress: string | null) => void;
    maybeBlockchainMessage: string | null;
    setBlockchainMessage: (message: string | null) => void;
    resetSettings: () => void;
}

const defaultContext: MinerInfoContextType = {
  maybeMinerAddress: null,
  setMinerAddress: () => {},
  maybeBlockchainMessage: null,
  setBlockchainMessage: () => {},
  resetSettings: () => {},
}

export const MinerInfoContext = createContext<MinerInfoContextType>(defaultContext);

export function MinerInfoProvider({ children }: { children: React.ReactNode }) {
  const [maybeMinerAddress, setMinerAddressState] = useState<string | null>(() => loadMinerAddress());
  const [maybeBlockchainMessage, setBlockchainMessageState] = useState<string | null>(() => loadBlockchainMessage());

  const setMinerAddress = (minerAddress: string | null) => {
    setMinerAddressState(minerAddress);
    saveMinerAddress(minerAddress);
  };

  const setBlockchainMessage = (message: string | null) => {
    setBlockchainMessageState(message);
    saveBlockchainMessage(message);
  };

  const resetSettings = () => {
    setMinerAddressState(null);
    setBlockchainMessageState(null);
    localStorage.removeItem(STORAGE_KEYS.MINER_ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.BLOCKCHAIN_MESSAGE);
  };

  return (
    <MinerInfoContext.Provider value={{
      maybeMinerAddress,
      setMinerAddress,
      maybeBlockchainMessage,
      setBlockchainMessage,
      resetSettings
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
