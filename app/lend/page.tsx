"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient, useChainId } from "wagmi";
import { getNoxClient, decryptHandle, formatUSDC } from "@/lib/noxClient";
import { useEnsureChain } from "@/lib/useEnsureChain";
import { DEPLOYED_ADDRESSES, NoxLendABI, MockUSDCABI } from "@/lib/contracts";
import { parseUnits, encodeFunctionData } from "viem";
import EncryptedBalance from "@/components/EncryptedBalance";
import DepositForm from "@/components/DepositForm";
import WithdrawForm from "@/components/WithdrawForm";
import PrivacyBadge from "@/components/PrivacyBadge";
import TxToast from "@/components/TxToast";

export default function LendPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const ensureChain = useEnsureChain();
  const [supplyHandle, setSupplyHandle] = useState<`0x${string}` | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [mintLoading, setMintLoading] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSupplyBalance = useCallback(async () => {
    if (!address || !publicClient) return;
    try {
      const handle = await publicClient.readContract({
        address: DEPLOYED_ADDRESSES.NoxLend,
        abi: NoxLendABI,
        functionName: "getSupplyBalance",
        args: [address],
      });
      setSupplyHandle(handle as `0x${string}`);
    } catch {
      // no deposit yet
    }
  }, [address, publicClient]);

  useState(() => {
    loadSupplyBalance();
  });

  async function mintTestTokens() {
    if (!walletClient || !publicClient || !address) return;
    setMintLoading(true);
    setMintError(null);
    try {
      await ensureChain();
      const gasPrice = await publicClient.getGasPrice();
      const amount = parseUnits("1000", 6);

      const data = encodeFunctionData({
        abi: MockUSDCABI,
        functionName: "mint",
        args: [address, amount],
      });
      const tx = await walletClient.sendTransaction({
        to: DEPLOYED_ADDRESSES.MockUSDC,
        data,
        gas: 100000n,
        gasPrice,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      setMintTxHash(tx);
    } catch (err: any) {
      console.error("Mint error:", err);
      const detail = err?.cause?.reason || err?.cause?.message || err?.shortMessage || err?.message || "Mint failed";
      setMintError(detail);
    } finally {
      setMintLoading(false);
    }
  }

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
    loadSupplyBalance();
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Lender Dashboard</h1>
        <p className="text-nox-muted mb-6">Connect your wallet to start lending privately.</p>
        <PrivacyBadge text="Your deposit balance will be encrypted — only you can see it" />
      </div>
    );
  }

  const wrongNetwork = chainId !== 421614;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {wrongNetwork && (
        <div className="mb-6 bg-yellow-900/30 border border-yellow-500/40 rounded-xl p-4 flex items-center justify-between">
          <p className="text-yellow-300 text-sm">
            ⚠️ Wrong network detected. Switch to <strong>Arbitrum Sepolia</strong> (chain ID 421614) to interact.
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
          <h1 className="text-3xl font-bold">Lender Dashboard</h1>
          <p className="text-nox-muted mt-1">Supply liquidity and earn 5% APY — privately.</p>
        </div>
        <PrivacyBadge />
      </div>

      {/* My Supply Balance */}
      <div className="mb-6">
        <EncryptedBalance key={refreshKey} handle={supplyHandle} label="My Supply Balance" />
        <div className="mt-2 flex items-center gap-2">
          <span className="bg-nox-accent/10 text-nox-accent text-xs font-medium px-2 py-0.5 rounded-full">
            5% APY
          </span>
          <span className="text-nox-muted text-xs">
            Only you and the auditor can decrypt this value
          </span>
        </div>
      </div>

      {/* Test token faucet */}
      <div className="bg-nox-card border border-nox-border rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1">Step 1 — Get Test mUSDC</h2>
        <p className="text-nox-muted text-sm mb-4">
          Mint 1,000 test mUSDC (6 decimals, like real USDC) to your wallet for testing.
        </p>
        <button
          onClick={mintTestTokens}
          disabled={mintLoading}
          className="bg-nox-surface hover:bg-nox-border border border-nox-border text-nox-text font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          {mintLoading ? "Minting..." : "Mint 1,000 mUSDC"}
        </button>
        {mintError && (
          <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{mintError}</p>
          </div>
        )}
        <TxToast hash={mintTxHash} onClose={() => setMintTxHash(null)} />
      </div>

      {/* Deposit */}
      <div className="bg-nox-card border border-nox-border rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1">Step 2 — Deposit to Pool</h2>
        <p className="text-nox-muted text-sm mb-4">
          Enter an amount. The flow: approve → wrap to wcUSDC → encrypt → deposit.
          Your balance is private on-chain immediately.
        </p>
        <DepositForm onSuccess={handleSuccess} />
      </div>

      {/* Withdraw */}
      <div className="bg-nox-card border border-nox-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-1">Withdraw</h2>
        <p className="text-nox-muted text-sm mb-4">
          Withdraw up to your current supply balance. Amount is encrypted before submission.
        </p>
        <WithdrawForm onSuccess={handleSuccess} />
      </div>

      <div className="mt-6 p-4 bg-nox-surface border border-nox-border rounded-xl text-sm text-nox-muted">
        <p>
          🔒 <strong className="text-nox-text">Privacy guarantee:</strong> Your deposit balance is stored
          as an encrypted euint256 handle on-chain. The Nox TEE handles decryption — only addresses
          you have explicitly authorized (you + the auditor) can read the plaintext value.
        </p>
      </div>
    </div>
  );
}
