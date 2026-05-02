// Test direct contract call to bypass viem validation
const { ethers } = require("ethers");

async function main() {
  console.log("=== BYPASS VIEM VALIDATION ===");
  
  const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
  const wallet = new ethers.Wallet("537cbb3b72ebdfeaa5442aaaea50c11b20af63cf94ef1ec26cfb105fb9a03bfd", provider);
  
  const mockUSDCAddress = "0x2c89f599E917B955c34E5a549772bbF06B7F2742";
  
  // Create contract instance without validation
  const mockUSDC = {
    address: mockUSDCAddress,
    abi: [
      'function approve(address spender, uint256 amount) returns (bool)',
      'function balanceOf(address owner) view returns (uint256)'
    ],
    connectSigner: wallet
  };
  
  try {
    const amount = ethers.parseUnits("1", 6);
    console.log("Approving 1 mUSDC...");
    
    const tx = await mockUSDC.approve("0xE8dC65Cf376565A07B0A1fed2C523b437B6e9792", amount);
    console.log("TX Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
