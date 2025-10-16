/**
 * Web3 Configuration
 * Update these addresses after deployment
 */
export const euroAddress = '0x6384D5F8999EaAC8bcCfae137D4e535075b47494';
export const euroXAddress = '0x357f63DB7C18C99051f9507532F426c2A070975a';
// Deployed contract addresses
// Superfluid Framework addresses (mainnet - available via Anvil fork)
export const superfluidConfig = {
  resolver: '0xeE4cD028f5fdaAdeA99f8fc38e8bA8A57c90Be53',
  host: '0x4E583d9390082B65Bef884b629DFA426114CED6d',
  governance: '0xe2E14e2C4518cB06c32Cd0818B4C01f53E1Ba653',
  cfaV1: '0x2844c1BBdA121E9E43105630b9C8310e5c72744b',
  cfaV1Forwarder: '0xcfA132E353cB4E398080B9700609bb008eceB125',
  idaV1: '0xbCF9cfA8Da20B591790dF27DE65C1254Bf91563d',
  gdaV1: '0xAAdBB3Eee3Bd080f5353d86DdF1916aCA3fAC842',
  superTokenFactory: '0x0422689cc4087b6B7280e0a7e7F655200ec86Ae1',
};

// Streaming rate: 2000 EUR/month
// Calculation: 2000 EUR * 10^18 / (30 * 24 * 60 * 60) = 771604938271604 wei/second
export const MONTHLY_FLOW_RATE = '771604938271604'; // 2000 EUR/month in wei/second

// Chain ID - Anvil local (31337)
export const CHAIN_ID = 31337;
 