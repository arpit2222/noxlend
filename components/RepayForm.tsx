"use client";

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { getNoxClient, encryptAmount } from "@/lib/noxClient";
import { useEnsureChain } from "@/lib/useEnsureChain";
import { DEPLOYED_ADDRESSES, NoxLendABI, WrappedConfidentialUSDCABI } from "@/lib/contracts";
import TxToast from "./TxToast";

export default function RepayForm({ onSuccess }: { onSuccess?: () => void }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const ensureChain = useEnsureChain();
  const [principalAmount, setPrincipalAmount] = useState("");
  const [step, setStep] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalWithInterest = principalAmount
    ? (parseFloat(principalAmount) * 1.05).toFixed(6)
    : "";

  async function handleRepay() {
    if (!address || !walletClient || !publicClient || !principalAmount) return;

    setLoading(true);
    setError(null);

    try {
      setStep("Checking network...");
      await ensureChain();

      // Total repay = principal + 5% interest
      const repayAmount = parseUnits(totalWithInterest, 6);

      // Ensure NoxLend can pull tokens for repayment
      setStep("Setting pool as operator (1/2)...");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const operatorTx = await walletClient.writeContract({
        address: DEPLOYED_ADDRESSES.WrappedConfidentialUSDC,
        abi: WrappedConfidentialUSDCABI,
        functionName: "setOperator",
        args: [DEPLOYED_ADDRESSES.NoxLend, deadline],
      });
      await publicClient.waitForTransactionReceipt({ hash: operatorTx });

      setStep("Encrypting repay amount...");
      const nox = await getNoxClient(window.ethereum);
      const { handle, proof } = await encryptAmount(nox, repayAmount, DEPLOYED_ADDRESSES.NoxLend);

      setStep("Submitting repayment...");
      const tx = await walletClient.writeContract({
        address: DEPLOYED_ADDRESSES.NoxLend,
        abi: NoxLendABI,
        functionName: "repay",
        args: [handle, proof],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      setTxHash(tx);
      setPrincipalAmount("");
      setStep("");
      onSuccess?.();
    } catch (err: any) {
      setError(err?.shortMessage || err?.message || "Repayment failed");
      setStep("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-nox-muted text-sm block mb-1">Principal to Repay (wcUSDC)</label>
        <input
          type="number"
          value={principalAmount}
          onChange={(e) => setPrincipalAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          className="w-full bg-nox-surface border border-nox-border rounded-lg px-4 py-2 text-nox-text placeholder-nox-muted focus:outline-none focus:border-nox-accent"
        />
      </div>

      {principalAmount && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 text-sm">
          <p className="text-orange-300">
            Total sent (principal + 5% interest): <strong>{totalWithInterest} wcUSDC</strong>
          </p>
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
        onClick={handleRepay}
        disabled={loading || !principalAmount || !address}
        className="w-full bg-nox-surface hover:bg-nox-card border border-orange-500/40 text-orange-400 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Processing..." : "Repay Loan"}
      </button>

      <TxToast hash={txHash} onClose={() => setTxHash(null)} />
    </div>
  );
}
