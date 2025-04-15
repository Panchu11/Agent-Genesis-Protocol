import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "./components/layout/Layout";
import { NotificationProvider } from "./context/NotificationContext";
import ClientFloatingChat from "./components/chat/ClientFloatingChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Genesis Protocol",
  description: "The protocol of AI civilization — A zero-cost, decentralized AI ecosystem to create, evolve, socialize, transact, and govern sentient digital agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NotificationProvider>
          <Layout>{children}</Layout>
          <ClientFloatingChat />
        </NotificationProvider>
      </body>
    </html>
  );
}
