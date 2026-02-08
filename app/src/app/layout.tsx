import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PayGuard - Intelligent Escrow on Solana",
  description: "Trustless escrow for AI agents with milestone-based payments and AI-powered dispute resolution",
  openGraph: {
    title: "PayGuard - Trustless Escrow for AI Agents",
    description: "Milestone-based escrow with AI-powered dispute resolution on Solana",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PayGuard",
    description: "Trustless Escrow for AI Agents",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
