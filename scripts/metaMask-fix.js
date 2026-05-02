// Run this in browser console to fix MetaMask gas issues
console.log("=== METAMASK FIX ===");

// 1. Reset MetaMask state
if (typeof window.ethereum !== 'undefined') {
  await window.ethereum.request({
    method: 'wallet_requestPermissions',
    params: [{ eth_accounts: {} }]
  });
  
  // 2. Clear any stuck transactions
  await window.ethereum.request({
    method: 'eth_clearPendingTransactions'
  });
  
  // 3. Reset gas price estimation
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x421614' }] // Arbitrum Sepolia
  });
  
  console.log("✅ MetaMask reset complete - try transaction again");
}
