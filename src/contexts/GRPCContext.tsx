
import React, { createContext, useContext } from "react";

interface GRPCContextType {
  isConnected: boolean;
}

const GRPCContext = createContext<GRPCContextType | undefined>(undefined);

export function GRPCProvider({ children }: { children: React.ReactNode }) {
  return (
    <GRPCContext.Provider value={{ isConnected: false }}>
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
