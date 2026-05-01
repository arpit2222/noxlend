import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Navbar from "./navbar";

export const metadata: Metadata = {
  title: "NoxLend — Private DeFi Lending",
  description: "Private lending protocol powered by iExec Nox Confidential Tokens (ERC-7984) on Arbitrum Sepolia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-nox-bg text-nox-text min-h-screen font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
          <footer className="border-t border-nox-border py-6 text-center text-nox-muted text-xs">
            <p>NoxLend — Built for iExec Vibe Coding Challenge 2026 | Powered by iExec Nox (ERC-7984) | Arbitrum Sepolia</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
