import { createContext, useContext, useCallback, useState, ReactNode } from 'react';

export type MiningEventType = 
  | 'onNewChallengeReceived'
  | 'onNewDifficultyUpdate'
  | 'onSubmitSolution'
  | 'onReceiveSubmissionResponse';

export type SubmissionResponse = {
  accepted: boolean;
  hash: string;
};

type MiningEventCallback = (eventType: MiningEventType, data?: any) => void;

interface MiningEventsContextType {
  subscribe: (eventType: MiningEventType, callback: MiningEventCallback) => () => void;
  emit: (eventType: MiningEventType, data?: any) => void;
}

const MiningEventsContext = createContext<MiningEventsContextType | null>(null);

export const useMiningEvents = () => {
  const context = useContext(MiningEventsContext);
  if (!context) {
    throw new Error('useMiningEvents must be used within a MiningEventsProvider');
  }
  return context;
};

export const MiningEventsProvider = ({ children }: { children: ReactNode }) => {
  const [subscribers, setSubscribers] = useState<Record<MiningEventType, MiningEventCallback[]>>({
    onNewChallengeReceived: [],
    onNewDifficultyUpdate: [],
    onSubmitSolution: [],
    onReceiveSubmissionResponse: [],
  });

  const subscribe = useCallback((eventType: MiningEventType, callback: MiningEventCallback) => {
    console.log("MiningEventsProvider: subscribe", eventType, callback);
    setSubscribers(prev => ({
      ...prev,
      [eventType]: [...prev[eventType], callback],
    }));

    return () => {
      console.log("MiningEventsProvider: unsubscribe", eventType, callback);
      setSubscribers(prev => ({
        ...prev,
        [eventType]: prev[eventType].filter(cb => cb !== callback),
      }));
    };
  }, []);

  const emit = useCallback((eventType: MiningEventType, data?: any) => {
    console.log("MiningEventsProvider: emit", eventType, data);
    subscribers[eventType].forEach(callback => callback(eventType, data));
  }, [subscribers]);

  return (
    <MiningEventsContext.Provider value={{ subscribe, emit }}>
      {children}
    </MiningEventsContext.Provider>
  );
}; 