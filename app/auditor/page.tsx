"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { DEPLOYED_ADDRESSES, NoxLendABI } from "@/lib/contracts";
import { getNoxClient, decryptHandle, formatUSDC } from "@/lib/noxClient";
import EncryptedBalance from "@/components/EncryptedBalance";
import AuditPanel from "@/components/AuditPanel";
import PrivacyBadge from "@/components/PrivacyBadge";

export default function AuditorPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [totalSupplyHandle, setTotalSupplyHandle] = useState<`0x${string}` | null>(null);
  const [auditorAddress, setAuditorAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient) return;

    publicClient.readContract({
      address: DEPLOYED_ADDRESSES.NoxLend,
      abi: NoxLendABI,
      functionName: "auditor",
    }).then((a) => setAuditorAddress(a as string)).catch(() => {});

    publicClient.readContract({
      address: DEPLOYED_ADDRESSES.NoxLend,
      abi: NoxLendABI,
      functionName: "getTotalSupply",
    }).then((h) => setTotalSupplyHandle(h as `0x${string}`)).catch(() => {});
  }, [publicClient]);

  const isAuditor = address && auditorAddress &&
    address.toLowerCase() === auditorAddress.toLowerCase();

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Auditor View</h1>
        <p className="text-nox-muted mb-6">Connect the auditor wallet to access compliance data.</p>
        <PrivacyBadge text="Auditor access is granted via Nox ACL" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Auditor View</h1>
          <p className="text-nox-muted mt-1">Compliance dashboard — full transparency for authorized auditors.</p>
        </div>
        <PrivacyBadge text="Nox ACL Authorized" />
      </div>

      {/* Access status */}
      <div className={`rounded-xl p-4 mb-6 border ${
        isAuditor
          ? "bg-nox-accent/10 border-nox-accent/30"
          : "bg-red-900/20 border-red-500/30"
      }`}>
        {isAuditor ? (
          <p className="text-nox-accent text-sm font-medium">
            ✓ Auditor wallet confirmed — you have full decryption access to all positions.
          </p>
        ) : (
          <div>
            <p className="text-red-400 text-sm font-medium mb-1">
              ✗ Connected wallet is not the auditor.
            </p>
            <p className="text-nox-muted text-xs">
              Auditor address: <span className="font-mono">{auditorAddress || "loading..."}</span>
            </p>
            <p className="text-nox-muted text-xs mt-1">
              You may still attempt decryption — it will fail if you are not in the ACL.
            </p>
          </div>
        )}
      </div>

      {/* Total Pool Supply */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Total Pool Liquidity</h2>
        <EncryptedBalance handle={totalSupplyHandle} label="Total Supply (encrypted)" />
      </div>

      {/* Per-user lookup */}
      <div className="bg-nox-card border border-nox-border rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1">Inspect User Position</h2>
        <p className="text-nox-muted text-sm mb-4">
          Enter any wallet address to fetch and decrypt their supply and borrow balances.
          This call will fail if your wallet is not in the ACL for those handles.
        </p>
        <AuditPanel />
      </div>

      {/* How it works */}
      <div className="bg-nox-surface border border-nox-border rounded-xl p-5">
        <h3 className="text-nox-text font-semibold mb-2">How Auditor Access Works</h3>
        <ul className="space-y-2 text-nox-muted text-sm">
          <li>• When NoxLend creates or updates a position, it calls <code className="text-nox-accent">Nox.allow(handle, auditorAddress)</code></li>
          <li>• This registers the auditor in the Nox on-chain ACL (Access Control List)</li>
          <li>• The Nox TEE checks this ACL before delegating decryption</li>
          <li>• Only registered addresses receive the decryption key — no one else</li>
          <li>• Raw handle bytes (bytes32) are visible on-chain but cryptographically unreadable</li>
        </ul>
      </div>
    </div>
  );
}
