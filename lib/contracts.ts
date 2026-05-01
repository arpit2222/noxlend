import { usePublicClient, useWalletClient } from "wagmi";
import { getContract } from "viem";
import NoxLendABI from "./abis/NoxLend.json";
import MockUSDCABI from "./abis/MockUSDC.json";
import WrappedConfidentialUSDCABI from "./abis/WrappedConfidentialUSDC.json";

export const DEPLOYED_ADDRESSES = {
  MockUSDC: (process.env.NEXT_PUBLIC_MOCKUSDC_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  WrappedConfidentialUSDC: (process.env.NEXT_PUBLIC_WCUSDC_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  NoxLend: (process.env.NEXT_PUBLIC_NOXLEND_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
};

export { NoxLendABI, MockUSDCABI, WrappedConfidentialUSDCABI };

export function useNoxLendContract() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  if (!publicClient) return null;

  return getContract({
    address: DEPLOYED_ADDRESSES.NoxLend,
    abi: NoxLendABI,
    client: walletClient || publicClient,
  });
}

export function useMockUSDCContract() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  if (!publicClient) return null;

  return getContract({
    address: DEPLOYED_ADDRESSES.MockUSDC,
    abi: MockUSDCABI,
    client: walletClient || publicClient,
  });
}

export function useWrappedUSDCContract() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  if (!publicClient) return null;

  return getContract({
    address: DEPLOYED_ADDRESSES.WrappedConfidentialUSDC,
    abi: WrappedConfidentialUSDCABI,
    client: walletClient || publicClient,
  });
}
