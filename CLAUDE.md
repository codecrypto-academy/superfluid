# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing a Superfluid-based application with:
- **sc/**: Foundry smart contract project for Ethereum smart contracts (including a custom EUR stablecoin and Superfluid streaming)
- **web/**: Next.js 15 frontend application with React 19 and Tailwind CSS 4 y ethers para gestionar las transacciones.

## Smart Contracts (sc/)

### Development Commands

Build contracts:
```bash
cd sc && forge build
```

Run all tests:
```bash
cd sc && forge test
```

Run specific test:
```bash
cd sc && forge test --match-test testFunctionName
```

Run tests with verbosity (shows console.log output):
```bash
cd sc && forge test -vvv
```

Format contracts:
```bash
cd sc && forge fmt
```

Generate gas snapshots:
```bash
cd sc && forge snapshot
```

### Local Development

Start local Ethereum node:
```bash
anvil
```

Deploy Euro stablecoin to Anvil (local development):
```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy and mint tokens
cd sc && forge script script/DeployEuro.s.sol:DeployEuroScript --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

This deploys the Euro stablecoin and mints 10,000,000 EUR tokens to `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Anvil's first default account).

### Structure

- **src/**: Smart contract source files
- **test/**: Test files (using Forge testing framework)
- **script/**: Deployment scripts
- **lib/**: Dependencies (managed via git submodules)
- **out/**: Build artifacts (generated)

## Web Application (web/)

### Development Commands

Start development server:
```bash
cd web && npm run dev
```

Build for production:
```bash
cd web && npm run build
```

Start production server:
```bash
cd web && npm start
```

Run linter:
```bash
cd web && npm run lint
```

### Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **React**: 19.1.0
- **Styling**: Tailwind CSS 4 with PostCSS
- **TypeScript**: Enabled
- **Build**: Turbopack (enabled by default)
- **Web3**: Ethers
- **Superfluid**: @superfluid-finance/sdk-core v0.9.0

### Structure

- **src/app/**: Next.js App Router pages and layouts
- **src/components/**: React components (Dashboard, etc.)
- **src/lib/**: Utility libraries (Superfluid integration)
- **src/config/**: Configuration files (web3, Superfluid)
- **public/**: Static assets

## Project Context

The application is designed to create a dashboard for managing Superfluid streams with a custom EUR stablecoin, enabling continuous money streams of 2000 EUR/month to specified Ethereum addresses. Usar ethers para gestionar las transacciones. El usuario puede add address de ethereum para realizar un flow de superfluid de 2000 euros / mes de una stablecoin que llamaremos euro y que tendremos habremos creado en el smart contract.

Copiar el address del smart contract de euro para usarlo en la web app.

Vamos a usar anvil para con un fork de la mainet para tener acceso a la infraestructura de superfluid. El anvil ya esta levantado.

Hacer un script  para desplegar el token erc 20 euro y mintear 10 millones de tokens a la 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

La clave privada para el deployer es 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

El proyecto se usa con anvil y fork de mainnet y por lo tanto chainid 1

No tocar nunca la configuracion de nextjs en lo que tiene que ver con tailwind, react, css

## Application Features

### Dashboard Functionality
- **Wallet Connection**: Connect MetaMask or other Web3 wallets
- **Add Recipients**: Add Ethereum addresses to start streaming EURx tokens
- **Automatic Flow Creation**: When an address is added, a Superfluid stream automatically starts at 2000 EUR/month
- **Real-time Balance Updates**: Recipient balances update every 5 seconds showing live streaming
- **Stop Streams**: Ability to stop streaming to any recipient

### Superfluid Integration
- **Token Wrapping**: EUR (ERC20) → EURx (Super Token)
- **Streaming Rate**: 2000 EUR/month = 771604938271604 wei/second
- **Network**: Anvil local node with mainnet fork

### Key Configuration
Update EuroX Super Token address in `web/src/config/web3.ts` after deployment:
```typescript
euroXAddress: '0x...' // Replace with deployed EuroX address
```

## Deployment Steps

1. **Start Anvil with mainnet fork**: `anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY`
2. **Deploy Euro stablecoin** (see Smart Contracts section above)
3. **Create EuroX Super Token** using Superfluid Console (connect to Anvil local network)
4. **Update configuration** in `web/src/config/web3.ts` with deployed addresses
5. **Start web app** with `npm run dev` in the web directory
6. **Connect wallet** to Anvil network (Chain ID: 31337)
7. **Upgrade EUR to EURx** using the dashboard
8. **Start adding recipients** to begin streaming



addresses de superfluid en mainnet

resolver: 0xeE4cD028f5fdaAdeA99f8fc38e8bA8A57c90Be53
host: 0x4E583d9390082B65Bef884b629DFA426114CED6d
governance: 0xe2E14e2C4518cB06c32Cd0818B4C01f53E1Ba653
cfaV1: 0x2844c1BBdA121E9E43105630b9C8310e5c72744b
cfaV1Forwarder: 0xcfA132E353cB4E398080B9700609bb008eceB125
idaV1: 0xbCF9cfA8Da20B591790dF27DE65C1254Bf91563d
gdaV1: 0xAAdBB3Eee3Bd080f5353d86DdF1916aCA3fAC842
gdaV1Forwarder: 0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08
superTokenFactory: 0x0422689cc4087b6B7280e0a7e7F655200ec86Ae1
superfluidLoader: 0xcb05535bd212eCFC4B7b9db81d6C2C768b726776
toga: 0x8B5a2CF69a56d7F8Fa027edcA23594cdDF544dDc
batchLiquidator: 0x42B709822F18595443c308c1BE5E63CbFEf06481
flowScheduler: 0xAA0cD305eD020137E302CeCede7b18c0A05aCCDA
vestingScheduler: 0x39D5cBBa9adEBc25085a3918d36D5325546C001B
vestingSchedulerV3: 0xbeEDf563D41dcb3e1b7e0B0f7a86685Fd73Ce84C
autowrap:
manager: 0x30aE282CF477E2eF28B14d0125aCEAd57Fe1d7a1
wrapStrategy: 0x1D65c6d3AD39d454Ea8F682c49aE7744706eA96d
macroForwarder: 0xFD0268E33111565dE546af2675351A4b1587F89F


cuentas de anvil
Available Accounts
==================

(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000.000000000000000000 ETH)
(2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000.000000000000000000 ETH)
(3) 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000.000000000000000000 ETH)
(4) 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000.000000000000000000 ETH)
(5) 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc (10000.000000000000000000 ETH)
(6) 0x976EA74026E726554dB657fA54763abd0C3a0aa9 (10000.000000000000000000 ETH)
(7) 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 (10000.000000000000000000 ETH)
(8) 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f (10000.000000000000000000 ETH)
(9) 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 (10000.000000000000000000 ETH)

Private Keys
==================

(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
(2) 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
(3) 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
(4) 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
(5) 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
(6) 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
(7) 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
(8) 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97
(9) 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6

