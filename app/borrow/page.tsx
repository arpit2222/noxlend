"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { useEnsureChain } from "@/lib/useEnsureChain";
import { DEPLOYED_ADDRESSES, NoxLendABI } from "@/lib/contracts";
import EncryptedBalance from "@/components/EncryptedBalance";
import BorrowForm from "@/components/BorrowForm";
import RepayForm from "@/components/RepayForm";
import PrivacyBadge from "@/components/PrivacyBadge";

export default function BorrowPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const ensureChain = useEnsureChain();
  const [borrowHandle, setBorrowHandle] = useState<`0x${string}` | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadBorrowBalance = useCallback(async () => {
    if (!address || !publicClient) return;
    try {
      const handle = await publicClient.readContract({
        address: DEPLOYED_ADDRESSES.NoxLend,
        abi: NoxLendABI,
        functionName: "getBorrowBalance",
        args: [address],
      });
      setBorrowHandle(handle as `0x${string}`);
    } catch {
      // no borrow yet
    }
  }, [address, publicClient]);

  useState(() => {
    loadBorrowBalance();
  });

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
    loadBorrowBalance();
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Borrower Dashboard</h1>
        <p className="text-nox-muted mb-6">Connect your wallet to borrow from the private pool.</p>
        <PrivacyBadge text="Your borrow position is encrypted — only you can see it" />
      </div>
    );
  }

  const wrongNetwork = chainId !== 421614;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {wrongNetwork && (
        <div className="mb-6 bg-yellow-900/30 border border-yellow-500/40 rounded-xl p-4 flex items-center justify-between">
          <p className="text-yellow-300 text-sm">
            ⚠️ Wrong network. Switch to <strong>Arbitrum Sepolia</strong> (chain ID 421614).
          </p>
          <button
            onClick={() => ensureChain()}
            className="ml-4 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold px-3 py-1.5 rounded-lg"
          >
            Switch Network
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Borrower Dashboard</h1>
          <p className="text-nox-muted mt-1">Take a private loan from the liquidity pool.</p>
        </div>
        <PrivacyBadge />
      </div>

      {/* My Borrow Balance */}
      <div className="mb-6">
        <EncryptedBalance key={refreshKey} handle={borrowHandle} label="My Borrow Balance (Debt)" />
        <p className="text-nox-muted text-xs mt-2">
          Your borrow position is invisible to other users. Only you and the protocol auditor can see your balance.
        </p>
      </div>

      {/* Borrow */}
      <div className="bg-nox-card border border-nox-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Borrow wcUSDC</h2>
          <span className="bg-orange-500/10 text-orange-400 text-xs font-medium px-2 py-0.5 rounded-full">
            5% Fixed APY
          </span>
        </div>
        <p className="text-nox-muted text-sm mb-4">
          Enter the amount to borrow. The Nox SDK encrypts it client-side before the transaction —
          the pool only sees a ciphertext handle, never the plaintext amount.
        </p>
        <BorrowForm onSuccess={handleSuccess} />
      </div>

      {/* Repay */}
      <div className="bg-nox-card border border-nox-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-1">Repay Loan</h2>
        <p className="text-nox-muted text-sm mb-4">
          Enter your principal amount — the form auto-calculates principal + 5% interest.
          Full repayment clears your borrow position.
        </p>
        <RepayForm onSuccess={handleSuccess} />
      </div>

      <div className="mt-6 p-4 bg-nox-surface border border-nox-border rounded-xl text-sm text-nox-muted">
        <p>
          🔒 <strong className="text-nox-text">Privacy guarantee:</strong> Your borrow position is stored
          as an encrypted euint256. Other users querying the contract see only a bytes32 ciphertext handle.
          Decryption requires TEE delegation — only authorized addresses (you + auditor) can read the value.
        </p>
      </div>
    </div>
  );
}
