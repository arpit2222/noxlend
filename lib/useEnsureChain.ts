"use client";

import { useChainId } from "wagmi";

const ARB_SEPOLIA_CHAIN_ID = 421614;
const ARB_SEPOLIA_HEX = "0x66eee";

/**
 * Returns a function that ensures the wallet is on Arbitrum Sepolia.
 * Uses wallet_addEthereumChain so MetaMask registers our public RPC
 * instead of its default Infura endpoint (which causes Internal JSON-RPC errors).
 */
export function useEnsureChain() {
  const chainId = useChainId();

  return async function ensureArbitrumSepolia() {
    if (typeof window === "undefined" || !window.ethereum) return;

    // wallet_addEthereumChain: adds if missing, prompts switch if present.
    // Crucially it also registers the rpcUrls we provide, replacing Infura.
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARB_SEPOLIA_HEX,
            chainName: "Arbitrum Sepolia",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
            blockExplorerUrls: ["https://sepolia.arbiscan.io"],
          },
        ],
      });
    } catch (addErr: any) {
      // If already on correct chain, ignore "already added" errors
      if (chainId !== ARB_SEPOLIA_CHAIN_ID) {
        throw addErr;
      }
    }
  };
}
