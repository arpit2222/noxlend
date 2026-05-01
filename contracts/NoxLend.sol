// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Nox, euint256, externalEuint256, ebool} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {IERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984.sol";
import {IERC7984Receiver} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * NoxLend — Private lending pool using ERC-7984 confidential tokens.
 *
 * KEY CONCEPTS:
 * - euint256: encrypted uint256 handle stored on-chain
 * - externalEuint256: encrypted input from frontend JS SDK
 * - Nox.fromExternal(): validate + unwrap user-encrypted input
 * - Nox.add() / Nox.sub(): arithmetic on encrypted values
 * - Nox.isInitialized(): check if euint256 has been set
 * - Nox.allowThis(): let this contract reuse handle across txs
 * - Nox.allow(): grant address decryption rights on a handle
 * - Nox.allowTransient(): one-tx access (for token transfer calls)
 * - IERC7984Receiver: called when contract receives confidential tokens
 *
 * FLOW:
 * - Lenders: depositToPool() → supply cUSDC, earn yield
 * - Borrowers: borrow() → take loan, repay() → repay with 5% interest
 * - Auditor: can decrypt all position handles via ACL
 */
contract NoxLend is IERC7984Receiver, Ownable {

    IERC7984 public immutable token;

    address public auditor;

    // Encrypted per-user deposit balances
    mapping(address => euint256) private _supplyBalance;

    // Encrypted per-user borrow balances
    mapping(address => euint256) private _borrowBalance;

    // Encrypted total pool liquidity
    euint256 private _totalSupply;

    // 5% annual interest rate (simplified fixed rate for demo)
    uint256 public constant INTEREST_RATE_BPS = 500;

    event Deposited(address indexed lender);
    event Borrowed(address indexed borrower);
    event Repaid(address indexed borrower);
    event Withdrawn(address indexed lender);

    constructor(IERC7984 _token, address _auditor) Ownable(msg.sender) {
        token = _token;
        auditor = _auditor;
        _totalSupply = Nox.toEuint256(0);
        Nox.allowThis(_totalSupply);
        Nox.allow(_totalSupply, msg.sender);
        Nox.allow(_totalSupply, _auditor);
    }

    // ─── LENDER: deposit cUSDC into pool ────────────────────────────
    // User must first call token.setOperator(address(this), deadline)
    // so this contract can pull tokens via confidentialTransferFrom.
    // Amount is encrypted: user encrypts off-chain with JS SDK,
    // passes (encryptedAmount, inputProof) from handleClient.encryptInput().
    function depositToPool(
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint256 amount = Nox.fromExternal(encryptedAmount, inputProof);

        // Pull cUSDC from user into this contract
        Nox.allowTransient(amount, address(token));
        token.confidentialTransferFrom(msg.sender, address(this), amount);

        // Update lender's supply balance
        euint256 current = _supplyBalance[msg.sender];
        if (!Nox.isInitialized(current)) {
            current = Nox.toEuint256(0);
            Nox.allowThis(current);
        }
        euint256 newBalance = Nox.add(current, amount);
        Nox.allowThis(newBalance);
        Nox.allow(newBalance, msg.sender);
        Nox.allow(newBalance, auditor);
        Nox.allow(newBalance, owner());
        _supplyBalance[msg.sender] = newBalance;

        // Update total pool supply
        euint256 newTotal = Nox.add(_totalSupply, amount);
        Nox.allowThis(newTotal);
        Nox.allow(newTotal, owner());
        Nox.allow(newTotal, auditor);
        _totalSupply = newTotal;

        emit Deposited(msg.sender);
    }

    // ─── BORROWER: borrow from pool ──────────────────────────────────
    // Borrower requests an encrypted loan amount.
    // NOTE: In this prototype we trust the borrower's encrypted amount
    // is within pool capacity. Production would use Nox comparison
    // primitives (Nox.le()) once available for encrypted comparisons.
    function borrow(
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint256 amount = Nox.fromExternal(encryptedAmount, inputProof);

        // Record borrow position
        euint256 current = _borrowBalance[msg.sender];
        if (!Nox.isInitialized(current)) {
            current = Nox.toEuint256(0);
            Nox.allowThis(current);
        }
        euint256 newDebt = Nox.add(current, amount);
        Nox.allowThis(newDebt);
        Nox.allow(newDebt, msg.sender);
        Nox.allow(newDebt, auditor);
        Nox.allow(newDebt, owner());
        _borrowBalance[msg.sender] = newDebt;

        // Reduce pool supply
        euint256 newTotal = Nox.sub(_totalSupply, amount);
        Nox.allowThis(newTotal);
        Nox.allow(newTotal, owner());
        Nox.allow(newTotal, auditor);
        _totalSupply = newTotal;

        // Transfer cUSDC to borrower
        Nox.allowTransient(amount, address(token));
        token.confidentialTransfer(msg.sender, amount);

        emit Borrowed(msg.sender);
    }

    // ─── BORROWER: repay loan ─────────────────────────────────────────
    // User repays principal + interest (calculated in UI).
    // User must setOperator on wcUSDC before calling this.
    // Full repay clears the borrow balance to zero.
    function repay(
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint256 amount = Nox.fromExternal(encryptedAmount, inputProof);

        // Pull repayment tokens into pool
        Nox.allowTransient(amount, address(token));
        token.confidentialTransferFrom(msg.sender, address(this), amount);

        // Clear borrow balance (full repay — set to zero)
        euint256 zeroed = Nox.toEuint256(0);
        Nox.allowThis(zeroed);
        Nox.allow(zeroed, msg.sender);
        Nox.allow(zeroed, auditor);
        Nox.allow(zeroed, owner());
        _borrowBalance[msg.sender] = zeroed;

        // Increase pool supply
        euint256 newTotal = Nox.add(_totalSupply, amount);
        Nox.allowThis(newTotal);
        Nox.allow(newTotal, owner());
        Nox.allow(newTotal, auditor);
        _totalSupply = newTotal;

        emit Repaid(msg.sender);
    }

    // ─── LENDER: withdraw deposited funds ────────────────────────────
    function withdraw(
        externalEuint256 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint256 amount = Nox.fromExternal(encryptedAmount, inputProof);

        euint256 current = _supplyBalance[msg.sender];
        require(Nox.isInitialized(current), "no deposit");

        euint256 newBalance = Nox.sub(current, amount);
        Nox.allowThis(newBalance);
        Nox.allow(newBalance, msg.sender);
        Nox.allow(newBalance, auditor);
        Nox.allow(newBalance, owner());
        _supplyBalance[msg.sender] = newBalance;

        euint256 newTotal = Nox.sub(_totalSupply, amount);
        Nox.allowThis(newTotal);
        Nox.allow(newTotal, owner());
        Nox.allow(newTotal, auditor);
        _totalSupply = newTotal;

        Nox.allowTransient(amount, address(token));
        token.confidentialTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender);
    }

    // ─── VIEW: encrypted balance handles ─────────────────────────────
    // Frontend reads these handles then decrypts client-side with Nox SDK.
    // Only ACL-authorized addresses can successfully decrypt.
    function getSupplyBalance(address user) external view returns (euint256) {
        require(msg.sender == user || msg.sender == auditor || msg.sender == owner(), "unauthorized");
        return _supplyBalance[user];
    }

    function getBorrowBalance(address user) external view returns (euint256) {
        require(msg.sender == user || msg.sender == auditor || msg.sender == owner(), "unauthorized");
        return _borrowBalance[user];
    }

    function getTotalSupply() external view returns (euint256) {
        return _totalSupply;
    }

    // ─── ERC-7984 Receiver hook ───────────────────────────────────────
    // Called when this contract receives tokens via confidentialTransferAndCall.
    // Differentiates deposit vs repay via the data parameter.
    function onConfidentialTransferReceived(
        address /* operator */,
        address from,
        euint256 amount,
        bytes calldata data
    ) external override returns (ebool) {
        require(msg.sender == address(token), "only wcUSDC");

        bytes32 action = data.length > 0 ? abi.decode(data, (bytes32)) : bytes32(0);

        if (action == keccak256("repay")) {
            // Repay path: clear borrow balance, add to pool supply
            euint256 zeroed = Nox.toEuint256(0);
            Nox.allowThis(zeroed);
            Nox.allow(zeroed, from);
            Nox.allow(zeroed, auditor);
            Nox.allow(zeroed, owner());
            _borrowBalance[from] = zeroed;

            euint256 newTotal = Nox.add(_totalSupply, amount);
            Nox.allowThis(newTotal);
            Nox.allow(newTotal, owner());
            Nox.allow(newTotal, auditor);
            _totalSupply = newTotal;

            emit Repaid(from);
        } else {
            // Default: deposit path
            euint256 current = _supplyBalance[from];
            if (!Nox.isInitialized(current)) {
                current = Nox.toEuint256(0);
                Nox.allowThis(current);
            }
            euint256 newBalance = Nox.add(current, amount);
            Nox.allowThis(newBalance);
            Nox.allow(newBalance, from);
            Nox.allow(newBalance, auditor);
            Nox.allow(newBalance, owner());
            _supplyBalance[from] = newBalance;

            euint256 newTotal = Nox.add(_totalSupply, amount);
            Nox.allowThis(newTotal);
            Nox.allow(newTotal, owner());
            Nox.allow(newTotal, auditor);
            _totalSupply = newTotal;

            emit Deposited(from);
        }

        ebool accepted = Nox.toEbool(true);
        Nox.allowTransient(accepted, msg.sender);
        return accepted;
    }

    // ─── Admin ────────────────────────────────────────────────────────
    function setAuditor(address _auditor) external onlyOwner {
        auditor = _auditor;
    }
}
