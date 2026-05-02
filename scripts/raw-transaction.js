// Raw transaction approach to bypass viem validation
const { ethers } = require("ethers");

async function main() {
  console.log("=== RAW TRANSACTION TEST ===");
  
  const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
  const wallet = new ethers.Wallet("537cbb3b72ebdfeaa5442aaaea50c11b20af63cf94ef1ec26cfb105fb9a03bfd", provider);
  
  const mockUSDCAddress = "0x2c89f599E917B955c34E5a549772bbF06B7F2742";
  const wcUSDCAddress = "0xE8dC65Cf376565A07B0A1fed2C523b437B6e9792";
  
  // Build raw transaction data
  const approveMethodId = "0x095ea7b3"; // approve(address,uint256)
  const approveData = ethers.AbiCoder.defaultAbiCoder().encodeFunctionCall(
    "approve",
    [wcUSDCAddress, ethers.parseUnits("1", 6)]
  );
  
  console.log("Approve data:", approveData);
  console.log("Approve data length:", approveData.length);
  
  try {
    const tx = await wallet.sendTransaction({
      to: mockUSDCAddress,
      data: approveData,
      gasLimit: 300000
    });
    
    console.log("TX Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas Used:", receipt.gasUsed);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
