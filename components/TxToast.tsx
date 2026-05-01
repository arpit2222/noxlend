"use client";

import { useState, useEffect } from "react";

interface TxToastProps {
  hash: string | null;
  onClose: () => void;
}

export default function TxToast({ hash, onClose }: TxToastProps) {
  useEffect(() => {
    if (hash) {
      const t = setTimeout(onClose, 8000);
      return () => clearTimeout(t);
    }
  }, [hash, onClose]);

  if (!hash) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-nox-card border border-nox-accent/40 rounded-xl p-4 shadow-2xl max-w-sm animate-in slide-in-from-bottom">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-nox-accent font-semibold text-sm mb-1">Transaction Submitted</p>
          <a
            href={`https://sepolia.arbiscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nox-muted hover:text-nox-text text-xs font-mono break-all"
          >
            {hash.slice(0, 20)}...{hash.slice(-8)}
          </a>
          <p className="text-nox-muted text-xs mt-1">View on Arbiscan →</p>
        </div>
        <button onClick={onClose} className="text-nox-muted hover:text-nox-text text-lg leading-none">×</button>
      </div>
    </div>
  );
}
