import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
  const wallet = new ethers.Wallet("537cbb3b72ebdfeaa5442aaaea50c11b20af63cf94ef1ec26cfb105fb9a03bfd", provider);
  
  const mockUSDCAddress = "0xdaa0675bf1592FE3A0a822b0194bA2b9e9BFfB92";
  const wcUSDCAddress = "0x20e61A9CB6Bf904Af5F1374326bE426D3Fce399f";
  
  const mockUSDC = new ethers.Contract(mockUSDCAddress, [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ], provider);
  
  console.log("Testing approve transaction...");
  console.log("Your balance:", ethers.formatUnits(await mockUSDC.balanceOf(wallet.address), 6));
  
  try {
    const amount = ethers.parseUnits("10", 6); // Small amount for testing
    const tx = await mockUSDC.approve(wcUSDCAddress, amount);
    console.log("Approve tx hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Approve successful! Gas used:", receipt.gasUsed);
    
    // Check allowance after approve
    const allowance = await mockUSDC.allowance(wallet.address, wcUSDCAddress);
    console.log("New allowance:", ethers.formatUnits(allowance, 6));
    
  } catch (error) {
    console.error("Approve failed:", error);
  }
}

main().catch(console.error);
