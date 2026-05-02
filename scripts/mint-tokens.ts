import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const MOCKUSDC = process.env.NEXT_PUBLIC_MOCKUSDC_ADDRESS!;

const MockUSDCABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address) external view returns (uint256)",
];

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log("Minting from:", deployer.address);

  const mockUSDC = new ethers.Contract(MOCKUSDC, MockUSDCABI, deployer);

  const before = await mockUSDC.balanceOf(deployer.address);
  console.log("Balance before:", ethers.formatUnits(before, 6), "mUSDC");

  const amount = ethers.parseUnits("1000", 6);
  const tx = await mockUSDC.mint(deployer.address, amount);
  console.log("Tx hash:", tx.hash);
  await tx.wait();

  const after = await mockUSDC.balanceOf(deployer.address);
  console.log("Balance after:", ethers.formatUnits(after, 6), "mUSDC");
  console.log("Done — 1,000 mUSDC minted to", deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
