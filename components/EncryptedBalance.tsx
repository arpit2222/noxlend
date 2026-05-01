"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getNoxClient, decryptHandle, formatUSDC } from "@/lib/noxClient";

interface EncryptedBalanceProps {
  handle: `0x${string}` | null | undefined;
  label: string;
}

export default function EncryptedBalance({ handle, label }: EncryptedBalanceProps) {
  const { isConnected } = useAccount();
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle || !isConnected || !window.ethereum) return;

    // Skip zero handle (uninitialized)
    if (handle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      setValue("0.00");
      return;
    }

    setLoading(true);
    setError(null);

    getNoxClient(window.ethereum)
      .then((client) => decryptHandle(client, handle))
      .then((amount) => setValue(formatUSDC(amount)))
      .catch((err) => {
        console.error("Decrypt failed:", err);
        setError("Could not decrypt — check ACL permissions");
      })
      .finally(() => setLoading(false));
  }, [handle, isConnected]);

  return (
    <div className="bg-nox-card border border-nox-border rounded-xl p-4">
      <p className="text-nox-muted text-sm mb-1">{label}</p>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-nox-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-nox-muted text-sm">Decrypting via Nox TEE...</span>
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : value !== null ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-nox-text">{value}</span>
          <span className="text-nox-muted text-sm">wcUSDC</span>
          <span className="text-nox-accent text-xs ml-1">🔒 decrypted</span>
        </div>
      ) : (
        <p className="text-nox-muted text-sm">🔒 Private — connect wallet to view</p>
      )}
    </div>
  );
}
