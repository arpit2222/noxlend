"use client";

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits, encodeFunctionData } from "viem";
import { ethers } from "ethers";
import { getNoxClient, encryptAmount } from "@/lib/noxClient";
import { useEnsureChain } from "@/lib/useEnsureChain";
import { DEPLOYED_ADDRESSES, MockUSDCABI, WrappedConfidentialUSDCABI, NoxLendABI } from "@/lib/contracts";
import TxToast from "./TxToast";

export default function DepositForm({ onSuccess }: { onSuccess?: () => void }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const ensureChain = useEnsureChain();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDeposit() {
    if (!address || !walletClient || !publicClient || !amount) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      setStep("Checking network...");
      await ensureChain();

      // Fetch gas price from our RPC so MetaMask can't set it too low
      const gasPrice = await publicClient.getGasPrice();

      const amountWei = parseUnits(amount, 6);

      // Step 1: approve mUSDC for wcUSDC using manual transaction to bypass viem validation
      setStep("Approving mUSDC...");
      try {
        // Use raw transaction to bypass viem address validation
        const approveData = encodeFunctionData({
          abi: MockUSDCABI,
          functionName: "approve",
          args: [DEPLOYED_ADDRESSES.WrappedConfidentialUSDC, amountWei]
        });
        
        const approveTx = await walletClient.sendTransaction({
          to: DEPLOYED_ADDRESSES.MockUSDC,
          data: approveData,
          gas: 300000n
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      } catch (approveError: any) {
        console.error("Approve error:", approveError);
        throw new Error(`Failed to approve mUSDC: ${approveError?.shortMessage || approveError?.message}`);
      }

      // Step 2: wrap mUSDC → confidential wcUSDC (1:1)
      setStep("Wrapping mUSDC → wcUSDC (2/4)...");
      const wrapTx = await walletClient.writeContract({
        address: DEPLOYED_ADDRESSES.WrappedConfidentialUSDC,
        abi: WrappedConfidentialUSDCABI,
        functionName: "wrap",
        args: [address, amountWei],
        gas: 300000n,
        gasPrice,
      });
      await publicClient.waitForTransactionReceipt({ hash: wrapTx });

      // Step 3: set NoxLend as operator on wcUSDC (allows pool to pull tokens)
      setStep("Authorising pool as operator (3/4)...");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600 * 24);
      const operatorTx = await walletClient.writeContract({
        address: DEPLOYED_ADDRESSES.WrappedConfidentialUSDC,
        abi: WrappedConfidentialUSDCABI,
        functionName: "setOperator",
        args: [DEPLOYED_ADDRESSES.NoxLend, deadline],
        gas: 100000n,
        gasPrice,
      });
      await publicClient.waitForTransactionReceipt({ hash: operatorTx });

      // Step 4: encrypt amount client-side then deposit to pool
      setStep("Encrypting amount with Nox TEE (4/4)...");
      const nox = await getNoxClient(window.ethereum);
      const { handle, proof } = await encryptAmount(nox, amountWei, DEPLOYED_ADDRESSES.NoxLend);

      const depositTx = await walletClient.writeContract({
        address: DEPLOYED_ADDRESSES.NoxLend,
        abi: NoxLendABI,
        functionName: "depositToPool",
        args: [handle, proof],
        gas: 1000000n,
        gasPrice,
      });
      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      setTxHash(depositTx);
      setAmount("");
      setStep("");
      onSuccess?.();
    } catch (err: any) {
      console.error("Deposit error:", err);
      const detail = err?.cause?.reason || err?.cause?.message || err?.shortMessage || err?.message || "Transaction failed";
      setError(detail);
      setStep("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-nox-muted text-sm block mb-1">Amount (mUSDC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          className="w-full bg-nox-surface border border-nox-border rounded-lg px-4 py-2 text-nox-text placeholder-nox-muted focus:outline-none focus:border-nox-accent"
        />
      </div>

      {step && (
        <div className="flex items-center gap-2 text-nox-muted text-sm">
          <div className="w-3 h-3 border-2 border-nox-accent border-t-transparent rounded-full animate-spin" />
          {step}
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleDeposit}
        disabled={loading || !amount || !address}
        className="w-full bg-nox-accent hover:bg-nox-accent-dark disabled:opacity-50 text-black font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? "Processing..." : "Approve, Wrap & Deposit"}
      </button>

      <p className="text-nox-muted text-xs">
        4-step flow: approve → wrap to wcUSDC → authorise pool → encrypt & deposit.
        Your on-chain balance is private immediately after deposit.
      </p>

      <TxToast hash={txHash} onClose={() => setTxHash(null)} />
    </div>
  );
}
