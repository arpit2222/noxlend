const { ethers } = require("hardhat");

async function main() {
  console.log("=== HARDHAT CONTRACT TEST ===");
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  // Get contract
  const mockUSDC = await ethers.getContractAt("MockUSDC", "0xdaa0675bf1592FE3A0a822b0194bA2b9e9BFfB92");
  console.log("Contract:", await mockUSDC.getAddress());
  
  // Check balance
  const balance = await mockUSDC.balanceOf(signer.address);
  console.log("Balance:", ethers.formatUnits(balance, 6));
  
  // Test approve
  try {
    const amount = ethers.parseUnits("1", 6);
    console.log("Approving 1 mUSDC...");
    
    const tx = await mockUSDC.approve("0x20e61A9CB6Bf904Af5F1374326bE426D3Fce399f", amount);
    console.log("TX Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Gas Used:", receipt.gasUsed);
    console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    
    if (receipt.status === 1) {
      const allowance = await mockUSDC.allowance(signer.address, "0x20e61A9CB6Bf904Af5F1374326bE426D3Fce399f");
      console.log("New allowance:", ethers.formatUnits(allowance, 6));
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
