"use client";

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { getNoxClient, encryptAmount } from "@/lib/noxClient";
import { useEnsureChain } from "@/lib/useEnsureChain";
import { DEPLOYED_ADDRESSES, NoxLendABI, WrappedConfidentialUSDCABI } from "@/lib/contracts";
import TxToast from "./TxToast";

export default function BorrowForm({ onSuccess }: { onSuccess?: () => void }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const ensureChain = useEnsureChain();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const interestAmount = amount ? (parseFloat(amount) * 0.05).toFixed(2) : "0.00";
  const totalRepay = amount ? (parseFloat(amount) * 1.05).toFixed(2) : "0.00";

  async function handleBorrow() {
    if (!address || !walletClient || !publicClient || !amount) return;

    setLoading(true);
    setError(null);

    try {
      setStep("Checking network...");
      await ensureChain();

      // Set NoxLend as operator so it can transfer tokens out to borrower
      setStep("Setting pool as operator on wcUSDC (1/2)...");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600 * 24);
      const operatorTx = await walletClient.writeContract({
        address: DEPLOYED_ADDRESSES.WrappedConfidentialUSDC,
        abi: WrappedConfidentialUSDCABI,
        functionName: "setOperator",
        args: [DEPLOYED_ADDRESSES.NoxLend, deadline],
      });
      await publicClient.waitForTransactionReceipt({ hash: operatorTx });

      setStep("Encrypting borrow amount with Nox...");
      const amountWei = parseUnits(amount, 6);
      const nox = await getNoxClient(window.ethereum);
      const { handle, proof } = await encryptAmount(nox, amountWei, DEPLOYED_ADDRESSES.NoxLend);

      setStep("Submitting borrow transaction...");
      const tx = await walletClient.writeContract({
        address: DEPLOYED_ADDRESSES.NoxLend,
        abi: NoxLendABI,
        functionName: "borrow",
        args: [handle, proof],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      setTxHash(tx);
      setAmount("");
      setStep("");
      onSuccess?.();
    } catch (err: any) {
      setError(err?.shortMessage || err?.message || "Borrow failed");
      setStep("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-nox-muted text-sm block mb-1">Borrow Amount (wcUSDC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          className="w-full bg-nox-surface border border-nox-border rounded-lg px-4 py-2 text-nox-text placeholder-nox-muted focus:outline-none focus:border-nox-accent"
        />
      </div>

      {amount && (
        <div className="bg-nox-surface border border-nox-border rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between text-nox-muted">
            <span>Interest (5% APY)</span>
            <span>{interestAmount} wcUSDC</span>
          </div>
          <div className="flex justify-between text-nox-text font-medium border-t border-nox-border pt-1 mt-1">
            <span>Total to repay</span>
            <span>{totalRepay} wcUSDC</span>
          </div>
        </div>
      )}

      {step && (
        <div className="flex items-center gap-2 text-nox-muted text-sm">
          <div className="w-3 h-3 border-2 border-nox-accent border-t-transparent rounded-full animate-spin" />
          {step}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleBorrow}
        disabled={loading || !amount || !address}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? "Processing..." : "Borrow"}
      </button>

      <TxToast hash={txHash} onClose={() => setTxHash(null)} />
    </div>
  );
}
