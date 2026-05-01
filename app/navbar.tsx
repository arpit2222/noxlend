"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectWallet from "@/components/ConnectWallet";

const links = [
  { href: "/lend", label: "Lend" },
  { href: "/borrow", label: "Borrow" },
  { href: "/auditor", label: "Auditor" },
  { href: "/ai-assist", label: "AI Assist" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-nox-bg/80 backdrop-blur border-b border-nox-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-nox-accent font-bold text-xl">🔒 NoxLend</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-nox-accent/10 text-nox-accent"
                    : "text-nox-muted hover:text-nox-text"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <ConnectWallet />
      </div>
    </nav>
  );
}
