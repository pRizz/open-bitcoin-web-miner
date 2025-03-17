import { createContext, useContext, useState } from "react";

interface MinerInfoContextType {
    maybeMinerAddress: string | null;
    setMinerAddress: (minerAddress: string | null) => void;
    maybeBlockchainMessage: string | null;
    setBlockchainMessage: (message: string | null) => void;
}

const defaultContext: MinerInfoContextType = {
  maybeMinerAddress: null,
  setMinerAddress: () => {},
  maybeBlockchainMessage: null,
  setBlockchainMessage: () => {},
}

export const MinerInfoContext = createContext<MinerInfoContextType>(defaultContext);

export function MinerInfoProvider({ children }: { children: React.ReactNode }) {
  const [maybeMinerAddress, setMinerAddress] = useState<string | null>(null);
  const [maybeBlockchainMessage, setBlockchainMessage] = useState<string | null>(null);

  return (
    <MinerInfoContext.Provider value={{
      maybeMinerAddress,
      setMinerAddress,
      maybeBlockchainMessage,
      setBlockchainMessage
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
