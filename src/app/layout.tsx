import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/contexts/WalletProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AutoRebalanceProvider } from "@/contexts/AutoRebalanceContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DLMM Pro Manager | Saros Finance",
  description: "Professional DLMM position management, automated rebalancing, and advanced analytics for Saros Finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <WalletContextProvider>
            <AutoRebalanceProvider>
              {children}
            </AutoRebalanceProvider>
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
