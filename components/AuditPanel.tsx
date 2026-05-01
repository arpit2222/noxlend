"use client";

import { useState } from "react";
import { usePublicClient } from "wagmi";
import { getNoxClient, decryptHandle, formatUSDC } from "@/lib/noxClient";
import { DEPLOYED_ADDRESSES, NoxLendABI } from "@/lib/contracts";

export default function AuditPanel() {
  const [targetAddress, setTargetAddress] = useState("");
  const [supplyBalance, setSupplyBalance] = useState<string | null>(null);
  const [borrowBalance, setBorrowBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  async function lookupUser() {
    if (!targetAddress || !publicClient || !window.ethereum) return;

    setLoading(true);
    setError(null);
    setSupplyBalance(null);
    setBorrowBalance(null);

    try {
      const nox = await getNoxClient(window.ethereum);

      const [supplyHandle, borrowHandle] = await Promise.all([
        publicClient.readContract({
          address: DEPLOYED_ADDRESSES.NoxLend,
          abi: NoxLendABI,
          functionName: "getSupplyBalance",
          args: [targetAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: DEPLOYED_ADDRESSES.NoxLend,
          abi: NoxLendABI,
          functionName: "getBorrowBalance",
          args: [targetAddress as `0x${string}`],
        }),
      ]);

      const [supply, borrow] = await Promise.all([
        decryptHandle(nox, supplyHandle as `0x${string}`),
        decryptHandle(nox, borrowHandle as `0x${string}`),
      ]);

      setSupplyBalance(formatUSDC(supply));
      setBorrowBalance(formatUSDC(borrow));
    } catch (err: any) {
      setError(err?.message || "Failed to fetch balances. Ensure you are the auditor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          placeholder="0x... wallet address to inspect"
          className="flex-1 bg-nox-surface border border-nox-border rounded-lg px-4 py-2 text-nox-text placeholder-nox-muted text-sm font-mono focus:outline-none focus:border-nox-accent"
        />
        <button
          onClick={lookupUser}
          disabled={loading || !targetAddress}
          className="bg-nox-accent hover:bg-nox-accent-dark disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {loading ? "Decrypting..." : "Inspect"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {supplyBalance !== null && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-nox-card border border-nox-border rounded-xl p-4">
            <p className="text-nox-muted text-xs mb-1">Supply Balance</p>
            <p className="text-xl font-bold text-nox-accent">{supplyBalance} wcUSDC</p>
          </div>
          <div className="bg-nox-card border border-nox-border rounded-xl p-4">
            <p className="text-nox-muted text-xs mb-1">Borrow Balance</p>
            <p className="text-xl font-bold text-orange-400">{borrowBalance} wcUSDC</p>
          </div>
        </div>
      )}
    </div>
  );
}
