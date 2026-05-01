"use client";

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { getNoxClient, encryptAmount } from "@/lib/noxClient";
import { useEnsureChain } from "@/lib/useEnsureChain";
import { DEPLOYED_ADDRESSES, NoxLendABI } from "@/lib/contracts";
import TxToast from "./TxToast";

export default function WithdrawForm({ onSuccess }: { onSuccess?: () => void }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const ensureChain = useEnsureChain();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleWithdraw() {
    if (!address || !walletClient || !publicClient || !amount) return;

    setLoading(true);
    setError(null);

    try {
      setStep("Checking network...");
      await ensureChain();

      const amountWei = parseUnits(amount, 6);

      setStep("Encrypting amount with Nox TEE...");
      const nox = await getNoxClient(window.ethereum);
      const { handle, proof } = await encryptAmount(nox, amountWei, DEPLOYED_ADDRESSES.NoxLend);

      setStep("Submitting withdrawal...");
      const tx = await walletClient.writeContract({
        address: DEPLOYED_ADDRESSES.NoxLend,
        abi: NoxLendABI,
        functionName: "withdraw",
        args: [handle, proof],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      setTxHash(tx);
      setAmount("");
      setStep("");
      onSuccess?.();
    } catch (err: any) {
      console.error("Withdraw error:", err);
      setError(err?.shortMessage || err?.message || "Withdrawal failed");
      setStep("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-nox-muted text-sm block mb-1">Withdraw Amount (wcUSDC)</label>
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
        onClick={handleWithdraw}
        disabled={loading || !amount || !address}
        className="w-full bg-nox-surface hover:bg-nox-card border border-nox-border text-nox-text font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Processing..." : "Withdraw"}
      </button>

      <TxToast hash={txHash} onClose={() => setTxHash(null)} />
    </div>
  );
}
