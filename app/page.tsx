import Link from "next/link";
import PrivacyBadge from "@/components/PrivacyBadge";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-nox-accent/10 border border-nox-accent/30 rounded-full px-4 py-1.5 mb-6">
          <span className="text-nox-accent text-sm font-medium">Built for iExec Vibe Coding Challenge 2026</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          <span className="text-nox-accent">NoxLend</span>
        </h1>
        <p className="text-2xl text-nox-text mb-3">The First Private Lending Protocol on Arbitrum</p>
        <p className="text-nox-muted text-lg max-w-2xl mx-auto mb-8">
          Lend, borrow, and earn yield — all with fully encrypted positions.
          Nobody on-chain can see your balances except you and a designated auditor.
          Powered by iExec Nox Confidential Tokens (ERC-7984).
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/lend"
            className="bg-nox-accent hover:bg-nox-accent-dark text-black font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Start Lending
          </Link>
          <Link
            href="/borrow"
            className="bg-nox-surface hover:bg-nox-card border border-nox-border text-nox-text font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Take a Loan
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-nox-card border border-nox-border rounded-2xl p-6">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="text-nox-text font-semibold text-lg mb-2">Private Positions</h3>
          <p className="text-nox-muted text-sm">
            All deposit and borrow balances are encrypted on-chain using ERC-7984
            confidential tokens. No one can see your amounts — not even validators.
          </p>
        </div>
        <div className="bg-nox-card border border-nox-border rounded-2xl p-6">
          <div className="text-3xl mb-3">🔍</div>
          <h3 className="text-nox-text font-semibold text-lg mb-2">Selective Disclosure</h3>
          <p className="text-nox-muted text-sm">
            The Nox ACL system lets you grant decrypt access to specific addresses.
            Only you and a designated auditor can see your positions — no one else.
          </p>
        </div>
        <div className="bg-nox-card border border-nox-border rounded-2xl p-6">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-nox-text font-semibold text-lg mb-2">DeFi Composable</h3>
          <p className="text-nox-muted text-sm">
            Built on standard interfaces (ERC-7984, ERC-20) so it integrates with
            the broader DeFi ecosystem. Deployed live on Arbitrum Sepolia.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-nox-card border border-nox-border rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-nox-text mb-6">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-nox-accent font-semibold mb-3">For Lenders</h3>
            <ol className="space-y-2 text-nox-muted text-sm">
              <li><span className="text-nox-accent font-mono mr-2">1.</span>Mint test mUSDC from the faucet</li>
              <li><span className="text-nox-accent font-mono mr-2">2.</span>Wrap mUSDC → confidential wcUSDC (ERC-7984)</li>
              <li><span className="text-nox-accent font-mono mr-2">3.</span>Encrypt your deposit amount client-side with Nox SDK</li>
              <li><span className="text-nox-accent font-mono mr-2">4.</span>Deposit to the pool — balance is private on-chain</li>
              <li><span className="text-nox-accent font-mono mr-2">5.</span>Earn 5% APY, withdraw any time</li>
            </ol>
          </div>
          <div>
            <h3 className="text-orange-400 font-semibold mb-3">For Borrowers</h3>
            <ol className="space-y-2 text-nox-muted text-sm">
              <li><span className="text-orange-400 font-mono mr-2">1.</span>Connect wallet on Arbitrum Sepolia</li>
              <li><span className="text-orange-400 font-mono mr-2">2.</span>Encrypt your borrow amount with Nox SDK</li>
              <li><span className="text-orange-400 font-mono mr-2">3.</span>Call borrow() — receive wcUSDC directly</li>
              <li><span className="text-orange-400 font-mono mr-2">4.</span>Your debt position is invisible to other users</li>
              <li><span className="text-orange-400 font-mono mr-2">5.</span>Repay principal + 5% interest to close position</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Architecture */}
      <div className="bg-nox-surface border border-nox-border rounded-2xl p-6 mb-12">
        <h2 className="text-xl font-bold text-nox-text mb-4">Architecture</h2>
        <pre className="text-nox-accent text-xs font-mono overflow-x-auto whitespace-pre">
{`  User Wallet
      │
      ├─ mUSDC (ERC-20, plaintext)
      │         │
      │         ▼ wrap()
      │   wcUSDC (ERC-7984, confidential)
      │         │
      │         ▼ confidentialTransferFrom()
      └──── NoxLend Pool ──────────────────────┐
                │                               │
                │  _supplyBalance[user]          │  euint256 handles
                │  _borrowBalance[user]          │  (encrypted on-chain)
                │  _totalSupply                  │
                │                               │
            Only YOU + AUDITOR can decrypt ─────┘
            (via Nox ACL: Nox.allow(handle, address))`}
        </pre>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/lend", label: "Lender Dashboard", color: "text-nox-accent" },
          { href: "/borrow", label: "Borrower Dashboard", color: "text-orange-400" },
          { href: "/auditor", label: "Auditor View", color: "text-purple-400" },
          { href: "/ai-assist", label: "AI Contract Assistant", color: "text-blue-400" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-nox-card hover:bg-nox-border border border-nox-border rounded-xl p-4 text-center transition-colors group"
          >
            <span className={`text-sm font-medium ${item.color} group-hover:underline`}>
              {item.label} →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <PrivacyBadge text="Powered by iExec Nox — Your positions are private" />
      </div>
    </div>
  );
}
