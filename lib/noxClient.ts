import { createViemHandleClient } from "@iexec-nox/handle";
import { createWalletClient, custom } from "viem";
import { arbitrumSepolia } from "viem/chains";

export type HandleClient = Awaited<ReturnType<typeof createViemHandleClient>>;

export async function getNoxClient(ethereum: any): Promise<HandleClient> {
  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    transport: custom(ethereum),
  });
  return createViemHandleClient(walletClient);
}

/**
 * Encrypt a uint256 value for a specific contract.
 * Actual SDK signature: encryptInput(value, solidityType, applicationContract)
 * Returns { handle, handleProof } — pass as (externalEuint256, inputProof) to contracts.
 */
export async function encryptAmount(
  handleClient: HandleClient,
  amount: bigint,
  contractAddress: `0x${string}`
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  const result = await handleClient.encryptInput(amount, "uint256", contractAddress);
  return {
    handle: result.handle as `0x${string}`,
    proof: result.handleProof as `0x${string}`,
  };
}

/**
 * Decrypt a euint256 handle. The connected wallet must have ACL
 * viewer permission (granted via Nox.allow() in the contract).
 * Actual SDK signature: decrypt(handle) — takes handle directly, not an object.
 */
export async function decryptHandle(
  handleClient: HandleClient,
  handle: `0x${string}`
): Promise<bigint> {
  const result = await handleClient.decrypt(handle);
  return result.value as bigint;
}

/** Format a bigint mUSDC amount (6 decimals) to a display string. */
export function formatUSDC(amount: bigint): string {
  const whole = amount / BigInt(1_000_000);
  const frac = amount % BigInt(1_000_000);
  const fracStr = frac.toString().padStart(6, "0").slice(0, 2);
  return `${whole.toString()}.${fracStr}`;
}
