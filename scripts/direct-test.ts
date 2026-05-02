import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
  const wallet = new ethers.Wallet("537cbb3b72ebdfeaa5442aaaea50c11b20af63cf94ef1ec26cfb105fb9a03bfd", provider);
  
  console.log("=== DIRECT CONTRACT TEST ===");
  console.log("Wallet:", wallet.address);
  console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)));
  
  // Test 1: Check if MockUSDC contract exists and is callable
  try {
    const mockUSDC = new ethers.Contract("0xdaa0675bf1592FE3A0a822b0194bA2b9e9BFfB92", [
      'function approve(address spender, uint256 amount) returns (bool)',
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ], provider);
    
    const balance = await mockUSDC.balanceOf(wallet.address);
    console.log("mUSDC Balance:", ethers.formatUnits(balance, 6));
    
    const decimals = await mockUSDC.decimals();
    console.log("Decimals:", decimals);
    
    const name = await mockUSDC.name();
    console.log("Token Name:", name);
    
    // Test 2: Try direct approve with small amount
    const amount = ethers.parseUnits("1", 6); // Just 1 mUSDC
    console.log("Approving 1 mUSDC...");
    
    const tx = await mockUSDC.approve("0x20e61A9CB6Bf904Af5F1374326bE426D3Fce399f", amount);
    console.log("Approve TX:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Gas Used:", receipt.gasUsed);
    console.log("Status:", receipt.status);
    
    if (receipt.status === 1) {
      console.log("✅ APPROVE SUCCESSFUL");
      
      // Check allowance after approve
      const allowance = await mockUSDC.allowance(wallet.address, "0x20e61A9CB6Bf904Af5F1374326bE426D3Fce399f");
      console.log("New allowance:", ethers.formatUnits(allowance, 6));
    } else {
      console.log("❌ APPROVE FAILED");
      console.log("Error details:", receipt);
    }
    
  } catch (error) {
    console.error("Contract interaction failed:", error);
  }
}

main().catch(console.error);
