// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20ToERC7984Wrapper} from "@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol";
import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Wraps MockUSDC (ERC-20) into a confidential ERC-7984 token.
 * Users approve this contract, call wrap(to, amount) to receive
 * confidential cUSDC tokens with hidden balances.
 * Two-step unwrap: unwrap() queues the burn (encrypted),
 * finalizeUnwrap() completes transfer after off-chain decryption.
 */
contract WrappedConfidentialUSDC is ERC20ToERC7984Wrapper {
    constructor(IERC20 usdc)
        ERC20ToERC7984Wrapper(usdc)
        ERC7984("Wrapped Confidential USDC", "wcUSDC", "")
    {}
}
