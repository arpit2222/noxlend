"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import PrivacyBadge from "@/components/PrivacyBadge";

const PRESET_PROMPTS = [
  "Add a flash loan feature to NoxLend using confidential tokens",
  "Generate an ERC-7984 governance token for NoxLend voting",
  "Add a fixed 10% liquidation penalty to NoxLend when LTV exceeds 80%",
  "Add variable interest rates based on pool utilization",
  "Create a confidential price oracle for NoxLend collateral",
];

export default function AIAssistPage() {
  const { isConnected } = useAccount();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateContract() {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError("");
    setResponse("");
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      if (!res.ok) throw new Error("Failed to generate contract");
      
      const data = await res.json();
      setResponse(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(response);
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">AI Contract Assistant</h1>
        <p className="text-nox-muted mb-6">Connect your wallet to access the AI contract generator.</p>
        <PrivacyBadge text="Powered by ChainGPT — Generate smart contracts with AI" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Contract Assistant</h1>
          <p className="text-nox-muted mt-1">Generate smart contract code with ChainGPT AI</p>
        </div>
        <PrivacyBadge text="Powered by ChainGPT" />
      </div>

      <div className="bg-nox-card border border-nox-border rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Describe Your Contract</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a contract modification or new feature... For example: 'Add a liquidation mechanism to NoxLend with 10% penalty'"
          className="w-full h-32 bg-nox-surface border border-nox-border rounded-lg px-4 py-3 text-nox-text placeholder:text-nox-muted resize-none focus:outline-none focus:ring-2 focus:ring-nox-accent/50"
        />
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset, i) => (
              <button
                key={i}
                onClick={() => setPrompt(preset)}
                className="text-xs bg-nox-surface hover:bg-nox-border border border-nox-border px-3 py-1.5 rounded-full text-nox-muted hover:text-nox-text transition-colors"
              >
                {preset.slice(0, 40)}...
              </button>
            ))}
          </div>
          
          <button
            onClick={generateContract}
            disabled={loading || !prompt.trim()}
            className="bg-nox-accent hover:bg-nox-accent-dark disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            {loading ? "Generating..." : "Generate with ChainGPT"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">Error: {error}</p>
        </div>
      )}

      {response && (
        <div className="bg-nox-card border border-nox-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Generated Contract Code</h2>
            <button
              onClick={copyCode}
              className="bg-nox-surface hover:bg-nox-border border border-nox-border text-nox-text px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Copy Code
            </button>
          </div>
          
          <div className="bg-nox-surface border border-nox-border rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-nox-text font-mono whitespace-pre">
              <code>{response}</code>
            </pre>
          </div>
          
          <div className="mt-4 p-4 bg-nox-accent/10 border border-nox-accent/30 rounded-lg">
            <p className="text-nox-accent text-sm">
              <strong className="font-semibold">⚠️ Important:</strong> Contracts generated here are for reference only. 
              Review thoroughly and deploy via Hardhat after testing.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-nox-surface border border-nox-border rounded-xl text-sm text-nox-muted">
        <h3 className="text-nox-text font-semibold mb-2">About ChainGPT Integration</h3>
        <p>
          This AI assistant uses ChainGPT's Smart Contract Generator API to create Solidity code based on your descriptions. 
          The generated contracts include proper iExec Nox imports and are optimized for Arbitrum Sepolia deployment.
        </p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>All generated contracts use Solidity ^0.8.28</li>
          <li>Includes iExec Nox library imports for confidential operations</li>
          <li>Optimized for Arbitrum Sepolia deployment</li>
          <li>Follows best practices for DeFi lending protocols</li>
        </ul>
      </div>
    </div>
  );
}
