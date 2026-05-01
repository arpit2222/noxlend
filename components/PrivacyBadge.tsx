"use client";

export default function PrivacyBadge({ text }: { text?: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-nox-accent/10 border border-nox-accent/30 rounded-full px-3 py-1">
      <span className="text-nox-accent text-sm">🔒</span>
      <span className="text-nox-accent text-xs font-medium">
        {text || "Encrypted by iExec Nox"}
      </span>
    </div>
  );
}
