import React, { createContext, useContext, useState } from "react";

interface ShareContextType {
  includeAutoStart: boolean;
  includeAddress: boolean;
  setIncludeAutoStart: (value: boolean) => void;
  setIncludeAddress: (value: boolean) => void;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export function ShareProvider({ children }: { children: React.ReactNode }) {
  const [includeAutoStart, setIncludeAutoStart] = useState(false);
  const [includeAddress, setIncludeAddress] = useState(false);

  return (
    <ShareContext.Provider
      value={{
        includeAutoStart,
        includeAddress,
        setIncludeAutoStart,
        setIncludeAddress,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
}

export function useShare() {
  const context = useContext(ShareContext);
  if (!context) {
    throw new Error("useShare must be used within a ShareProvider");
  }
  return context;
}