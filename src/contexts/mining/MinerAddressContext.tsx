import { createContext, useContext, useState } from "react";

interface MinerAddressContextType {
    minerAddress: string | null;
    setMinerAddress: (minerAddress: string | null) => void;
}

const defaultContext: MinerAddressContextType = {
  minerAddress: null,
  setMinerAddress: () => {},
}

export const MinerAddressContext = createContext<MinerAddressContextType>(defaultContext);

export function MinerAddressProvider({ children }: { children: React.ReactNode }) {
  const [minerAddress, setMinerAddress] = useState<string | null>(null);

  return (
    <MinerAddressContext.Provider value={{ minerAddress, setMinerAddress }}>
      {children}
    </MinerAddressContext.Provider>
  );
}

export function useMinerAddress() {
  const context = useContext(MinerAddressContext);
  if (!context) {
    throw new Error("useMinerAddress must be used within a MinerAddressProvider");
  }
  return context;
}
