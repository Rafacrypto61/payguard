"use client";

import WalletProviderWrapper from "@/components/WalletProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletProviderWrapper>{children}</WalletProviderWrapper>;
}
