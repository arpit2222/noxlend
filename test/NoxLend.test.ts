import { expect } from "chai";
import { ethers } from "hardhat";
import { MockUSDC } from "../typechain-types";

/**
 * Basic smoke tests for MockUSDC (local network only).
 * WrappedConfidentialUSDC and NoxLend require Arbitrum Sepolia
 * because the Nox TEE infrastructure is not available locally.
 */
describe("MockUSDC", function () {
  let mockUSDC: MockUSDC;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
  });

  it("has correct name and symbol", async function () {
    expect(await mockUSDC.name()).to.equal("Mock USDC");
    expect(await mockUSDC.symbol()).to.equal("mUSDC");
  });

  it("has 6 decimals", async function () {
    expect(await mockUSDC.decimals()).to.equal(6);
  });

  it("allows anyone to mint", async function () {
    const amount = ethers.parseUnits("1000", 6);
    await mockUSDC.mint(user.address, amount);
    expect(await mockUSDC.balanceOf(user.address)).to.equal(amount);
  });

  it("supports standard ERC-20 transfers", async function () {
    const amount = ethers.parseUnits("500", 6);
    await mockUSDC.mint(owner.address, amount);
    await mockUSDC.transfer(user.address, amount);
    expect(await mockUSDC.balanceOf(user.address)).to.equal(amount);
  });
});

describe("NoxLend (integration)", function () {
  it("requires Arbitrum Sepolia — run: npx hardhat run scripts/deploy.ts --network arbitrumSepolia", function () {
    console.log("  ℹ Confidential contract tests require the Nox TEE on Arbitrum Sepolia.");
    console.log("  ℹ After deployment, test the full flow via the frontend.");
  });
});
