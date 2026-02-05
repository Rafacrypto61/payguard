"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  connect: () => {},
  disconnect: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletMultiButton() {
  const { connected, publicKey, connect, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <button
        onClick={disconnect}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      Connect Wallet
    </button>
  );
}

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connect = () => {
    // Simulate wallet connection
    setConnected(true);
    setPublicKey("7xKXm9HgLpqR2nWvF5tYkBcJdZqN3mNpL8sK2kLqP9fG");
  };

  const disconnect = () => {
    setConnected(false);
    setPublicKey(null);
  };

  return (
    <WalletContext.Provider value={{ connected, publicKey, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
