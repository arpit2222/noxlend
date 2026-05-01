import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Running setup with account:", deployer.address);

  const deploymentPath = path.join(__dirname, "../deployments/arbitrumSepolia.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No deployment found. Run deploy.ts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("Using deployment:", deployment);

  const mockUSDC = await ethers.getContractAt("MockUSDC", deployment.MockUSDC);
  const wcUSDC = await ethers.getContractAt("WrappedConfidentialUSDC", deployment.WrappedConfidentialUSDC);

  // Mint 10,000 mUSDC to deployer
  console.log("\nMinting 10,000 mUSDC to deployer...");
  const mintAmount = ethers.parseUnits("10000", 6);
  const mintTx = await mockUSDC.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted", ethers.formatUnits(mintAmount, 6), "mUSDC");

  // Approve wcUSDC to spend mUSDC
  console.log("\nApproving wcUSDC to spend mUSDC...");
  const approveTx = await mockUSDC.approve(deployment.WrappedConfidentialUSDC, mintAmount);
  await approveTx.wait();
  console.log("Approved", ethers.formatUnits(mintAmount, 6), "mUSDC for wcUSDC");

  // Wrap 1000 mUSDC into confidential wcUSDC
  const wrapAmount = ethers.parseUnits("1000", 6);
  console.log("\nWrapping 1000 mUSDC into wcUSDC...");
  const wrapTx = await (wcUSDC as any).wrap(deployer.address, wrapAmount);
  await wrapTx.wait();
  console.log("Wrapped", ethers.formatUnits(wrapAmount, 6), "mUSDC → wcUSDC");

  console.log("\nSetup complete! Deployer has:");
  console.log(" - 9,000 remaining mUSDC (plaintext)");
  console.log(" - 1,000 wcUSDC (confidential ERC-7984)");
  console.log("\nNext: connect wallet in the frontend and interact with NoxLend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
