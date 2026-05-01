# NoxLend — Private Lending Protocol on iExec Nox

The first private lending protocol on Arbitrum where all positions are fully confidential using iExec Nox Confidential Tokens (ERC-7984).

## 🌟 Features

- **🔒 Private Positions**: All deposit and borrow balances are encrypted on-chain
- **🔍 Selective Disclosure**: Only you and a designated auditor can see your positions
- **⚡ DeFi Composable**: Built on standard interfaces for seamless integration
- **🤖 AI Assistant**: ChainGPT-powered smart contract generation
- **🏦 Fixed 5% APY**: Simple, transparent lending and borrowing

## 🏗️ Architecture

```
  User Wallet
      │
      ├─ mUSDC (ERC-20, plaintext)
      │         │
      │         ▼ wrap()
      │   wcUSDC (ERC-7984, confidential)
      │         │
      │         ▼ confidentialTransferFrom()
      └──── NoxLend Pool ──────────────────────┐
                │                               │
                │  _supplyBalance[user]          │  euint256 handles
                │  _borrowBalance[user]          │  (encrypted on-chain)
                │  _totalSupply                  │
                │                               │
            Only YOU + AUDITOR can decrypt ─────┘
            (via Nox ACL: Nox.allow(handle, address))
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or compatible wallet
- Arbitrum Sepolia ETH for gas

### Installation

1. **Clone and install contracts**
```bash
git clone <repository>
cd noxlend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Fill in your private key and ChainGPT API key
```

3. **Compile contracts**
```bash
npm run compile
```

4. **Deploy to Arbitrum Sepolia**
```bash
npm run deploy
```

5. **Setup frontend**
```bash
cd frontend
npm install
```

6. **Start the frontend**
```bash
npm run dev
```

Visit `http://localhost:3000` to access the dApp.

## 📋 Contract Addresses (Arbitrum Sepolia)

*After deployment, these will be filled automatically:*

- MockUSDC: `0x_TO_BE_FILLED_AFTER_DEPLOY`
- WrappedConfidentialUSDC: `0x_TO_BE_FILLED_AFTER_DEPLOY`
- NoxLend: `0x_TO_BE_FILLED_AFTER_DEPLOY`

## 🎯 How It Works

### For Lenders

1. **Get Test Tokens**: Mint 1,000 mUSDC from the faucet
2. **Wrap to Confidential**: Convert mUSDC → wcUSDC (ERC-7984)
3. **Encrypt Amount**: Client-side encryption using Nox SDK
4. **Deposit to Pool**: Supply wcUSDC and earn 5% APY
5. **Withdraw Anytime**: Your balance remains private throughout

### For Borrowers

1. **Connect Wallet**: Ensure you're on Arbitrum Sepolia
2. **Borrow**: Specify amount (encrypted) and receive wcUSDC
3. **Private Position**: Your debt is invisible to other users
4. **Repay**: Return principal + 5% interest to clear position

### Privacy Guarantee

- All balances are stored as `euint256` encrypted handles
- Only addresses explicitly granted ACL access can decrypt
- The auditor can view all positions for compliance
- No plaintext amounts ever appear on-chain

## 🤖 AI Contract Assistant

Access the AI assistant at `/ai-assist` to:

- Generate new smart contract features
- Modify existing contracts with natural language
- Get Solidity code optimized for Nox integration
- Copy generated code for deployment via Hardhat

**Example Prompts:**
- "Add a flash loan feature to NoxLend"
- "Generate liquidation mechanism with 10% penalty"
- "Create governance token for protocol voting"

## 🔧 Development

### Smart Contracts

```bash
# Compile
npm run compile

# Test
npm run test

# Deploy
npm run deploy

# Setup after deployment
npm run setup
```

### Frontend

```bash
cd frontend

# Development
npm run dev

# Build
npm run build

# Start production
npm start
```

## 📚 Technical Details

### Key Technologies

- **iExec Nox**: Confidential computing with TEEs
- **ERC-7984**: Confidential token standard
- **Nox SDK**: Client-side encryption/decryption
- **Hardhat**: Smart contract development
- **Next.js**: Frontend framework
- **wagmi**: Web3 React hooks
- **ChainGPT**: AI contract generation

### Security Model

1. **Encryption**: All amounts encrypted client-side before submission
2. **ACL System**: Fine-grained access control via Nox.allow()
3. **TEE Security**: Decryption only in trusted execution environments
4. **Auditor Access**: Compliance view for authorized addresses
5. **No Plaintext Leaks**: Amounts never appear in events or logs

### Contract Architecture

- **MockUSDC**: Standard ERC-20 for testing
- **WrappedConfidentialUSDC**: ERC-20 to ERC-7984 wrapper
- **NoxLend**: Core lending pool with encrypted balances

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Note: Full confidential contract testing requires Arbitrum Sepolia due to Nox TEE infrastructure.

## 📖 Getting Test Tokens

1. Visit Arbitrum Sepolia faucet for ETH
2. Use the built-in mUSDC faucet in the Lender dashboard
3. Mint up to 1,000,000 mUSDC for testing

## 🔗 Links

- **Frontend**: `http://localhost:3000`
- **Arbitrum Sepolia Explorer**: https://sepolia.arbiscan.io
- **iExec Nox Docs**: https://docs.iex.ec/nox
- **ChainGPT**: https://chaingpt.org

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🏆 Built for iExec Vibe Coding Challenge 2026

This project demonstrates the power of confidential DeFi using iExec Nox technology, enabling truly private lending and borrowing on public blockchains.

---

**⚠️ Important**: This is a demo project for educational purposes. Always audit contracts before using with real funds.
