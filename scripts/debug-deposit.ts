import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const WCUSDC = process.env.NEXT_PUBLIC_WCUSDC_ADDRESS!;
const NOXLEND = process.env.NEXT_PUBLIC_NOXLEND_ADDRESS!;
const MOCKUSDC = process.env.NEXT_PUBLIC_MOCKUSDC_ADDRESS!;

const ERC20ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) external",
];
const WcUSDCABI = [
  "function wrap(address,uint256) external",
  "function setOperator(address,uint48) external",
  "function isOperator(address,address) view returns (bool)",
];

async function main() {
  const { ethers } = hre;
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const mockUSDC = new ethers.Contract(MOCKUSDC, ERC20ABI, signer);
  const wcUSDC = new ethers.Contract(WCUSDC, WcUSDCABI, signer);

  const balance = await mockUSDC.balanceOf(signer.address);
  console.log("mUSDC balance:", ethers.formatUnits(balance, 6));

  const amount = ethers.parseUnits("10", 6); // small test amount

  // Step 1: setOperator (test this first, it should be cheap)
  console.log("\n--- Testing setOperator standalone ---");
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600 * 24);
  console.log("Deadline:", deadline.toString());
  try {
    const tx = await wcUSDC.setOperator(NOXLEND, deadline);
    console.log("setOperator tx:", tx.hash);
    await tx.wait();
    console.log("setOperator SUCCESS");
  } catch (e: any) {
    console.error("setOperator FAILED:", e.message);
  }

  // Check if operator is set
  try {
    const isOp = await wcUSDC.isOperator(signer.address, NOXLEND);
    console.log("isOperator(user, NoxLend):", isOp);
  } catch (e: any) {
    console.log("isOperator check error:", e.message);
  }

  // Step 2: approve + wrap
  console.log("\n--- Testing approve + wrap ---");
  try {
    const approveTx = await mockUSDC.approve(WCUSDC, amount);
    await approveTx.wait();
    console.log("approve SUCCESS");
  } catch (e: any) {
    console.error("approve FAILED:", e.message);
  }

  try {
    const wrapTx = await wcUSDC.wrap(signer.address, amount);
    console.log("wrap tx:", wrapTx.hash);
    await wrapTx.wait();
    console.log("wrap SUCCESS");
  } catch (e: any) {
    console.error("wrap FAILED:", e.message);
  }

  console.log("\nmUSDC balance after:", ethers.formatUnits(await mockUSDC.balanceOf(signer.address), 6));
}

main().catch((e) => { console.error(e); process.exit(1); });
