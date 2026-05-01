"use client";

import { useChainId, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";

/**
 * Returns a function that ensures the wallet is on Arbitrum Sepolia
 * before any write transaction. Throws if the switch fails.
 */
export function useEnsureChain() {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  return async function ensureArbitrumSepolia() {
    if (chainId !== arbitrumSepolia.id) {
      await switchChainAsync({ chainId: arbitrumSepolia.id });
    }
  };
}
