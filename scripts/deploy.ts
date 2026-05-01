import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const auditorAddress = process.env.AUDITOR_ADDRESS || deployer.address;
  console.log("Auditor address:", auditorAddress);

  // 1. Deploy MockUSDC
  console.log("\n[1/4] Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed:", mockUSDCAddress);

  // 2. Deploy WrappedConfidentialUSDC
  console.log("\n[2/4] Deploying WrappedConfidentialUSDC...");
  const WrappedConfidentialUSDC = await ethers.getContractFactory("WrappedConfidentialUSDC");
  const wcUSDC = await WrappedConfidentialUSDC.deploy(mockUSDCAddress);
  await wcUSDC.waitForDeployment();
  const wcUSDCAddress = await wcUSDC.getAddress();
  console.log("WrappedConfidentialUSDC deployed:", wcUSDCAddress);

  // 3. Deploy NoxLend
  console.log("\n[3/4] Deploying NoxLend...");
  const NoxLend = await ethers.getContractFactory("NoxLend");
  const noxLend = await NoxLend.deploy(wcUSDCAddress, auditorAddress);
  await noxLend.waitForDeployment();
  const noxLendAddress = await noxLend.getAddress();
  console.log("NoxLend deployed:", noxLendAddress);

  // 4. Set NoxLend as operator on wcUSDC
  console.log("\n[4/4] Setting NoxLend as operator on wcUSDC...");
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60);
  const setOperatorTx = await (wcUSDC as any).setOperator(noxLendAddress, deadline);
  await setOperatorTx.wait();
  console.log("NoxLend set as operator on wcUSDC, deadline:", new Date(Number(deadline) * 1000).toISOString());

  // 5. Mint test tokens to deployer
  console.log("\nMinting 1,000,000 mUSDC to deployer...");
  const mintAmount = ethers.parseUnits("1000000", 6);
  const mintTx = await mockUSDC.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted 1,000,000 mUSDC to", deployer.address);

  // Save deployment addresses
  const deploymentInfo = {
    MockUSDC: mockUSDCAddress,
    WrappedConfidentialUSDC: wcUSDCAddress,
    NoxLend: noxLendAddress,
    auditor: auditorAddress,
    deployer: deployer.address,
    network: "arbitrumSepolia",
    chainId: 421614,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, "arbitrumSepolia.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment saved to deployments/arbitrumSepolia.json");

  console.log("\n═══ Deployment Summary ═══");
  console.log("MockUSDC:               ", mockUSDCAddress);
  console.log("WrappedConfidentialUSDC:", wcUSDCAddress);
  console.log("NoxLend:                ", noxLendAddress);
  console.log("\nAdd these to your .env:");
  console.log(`NEXT_PUBLIC_MOCKUSDC_ADDRESS=${mockUSDCAddress}`);
  console.log(`NEXT_PUBLIC_WCUSDC_ADDRESS=${wcUSDCAddress}`);
  console.log(`NEXT_PUBLIC_NOXLEND_ADDRESS=${noxLendAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
