import { Framework } from '@superfluid-finance/sdk-core';
import { ethers } from 'ethers';
import { euroAddress, euroXAddress, superfluidConfig, MONTHLY_FLOW_RATE } from '@/config/web3';

/**
 * Initialize Superfluid Framework with custom configuration
 * @param provider Ethers provider or signer
 * @param chainId Current chain ID
 */
async function createSuperfluidFramework(provider: any, chainId: number) {
  try {
    console.log('Initializing Superfluid Framework...');
    console.log('Chain ID:', chainId);
    console.log('Resolver:', superfluidConfig.resolver);
    
    const sf = await Framework.create({
      chainId,
      provider,
      resolverAddress: superfluidConfig.resolver,
      protocolReleaseVersion: 'v1',
    });
    
    console.log('Superfluid Framework initialized successfully');
    return sf;
  } catch (error) {
    console.error('Error creating Superfluid Framework:', error);
    throw error;
  }
}

/**
 * Upgrade EUR tokens to EURx Super Tokens
 * @param amount Amount to upgrade in wei
 * @param signer Ethers signer
 * @param chainId Current chain ID
 */
export async function upgradeToEuroX(
  amount: string,
  signer: ethers.Signer,
  chainId: number
) {
  try {
    console.log('Starting upgrade to EuroX...');
    console.log('Amount (wei):', amount);
    console.log('Amount (ETH):', ethers.utils.formatEther(amount));
    console.log('EuroX Address:', euroXAddress);
    console.log('Signer address:', await signer.getAddress());
    
    const sf = await createSuperfluidFramework(signer.provider!, chainId);
    
    console.log('Loading SuperToken at:', euroXAddress);
    const euroXToken = await sf.loadSuperToken(euroXAddress);
    console.log('SuperToken loaded successfully');

    const upgradeOperation = euroXToken.upgrade({
      amount: amount
    });

    console.log('Executing upgrade operation...');
    const tx = await upgradeOperation.exec(signer);
    
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed');

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Error upgrading to EuroX:', error);
    throw error;
  }
}

/**
 * Downgrade EURx Super Tokens to EUR
 * @param amount Amount to downgrade in wei
 * @param signer Ethers signer
 * @param chainId Current chain ID
 */
export async function downgradeFromEuroX(
  amount: string,
  signer: ethers.Signer,
  chainId: number
) {
  try {
    const sf = await createSuperfluidFramework(signer.provider!, chainId);
    const euroXToken = await sf.loadSuperToken(euroXAddress);

    const downgradeOperation = euroXToken.downgrade({
      amount : amount
    });
    console.log('downgradeOperation', downgradeOperation);
    const tx = await downgradeOperation.exec(signer);
    await tx.wait();

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Error downgrading from EuroX:', error);
    throw error;
  }
}

/**
 * Create a new Superfluid stream
 * @param receiver Recipient address
 * @param signer Ethers signer
 * @param chainId Current chain ID
 * @param flowRate Flow rate in wei/second (default: 2000 EUR/month)
 */
export async function createFlow(
  receiver: string,
  signer: ethers.Signer,
  chainId: number,
  flowRate: string = MONTHLY_FLOW_RATE
) {
  try {
    const sf = await createSuperfluidFramework(signer.provider!, chainId);
    const euroXToken = await sf.loadSuperToken(euroXAddress);

    const createFlowOperation = euroXToken.createFlow({
      sender: await signer.getAddress(),
      receiver,
      flowRate,
    });

    const tx = await createFlowOperation.exec(signer);
    await tx.wait();

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Error creating flow:', error);
    throw error;
  }
}

/**
 * Delete (stop) a Superfluid stream
 * @param receiver Recipient address
 * @param signer Ethers signer
 * @param chainId Current chain ID
 */
export async function deleteFlow(
  receiver: string,
  signer: ethers.Signer,
  chainId: number
) {
  try {
    const sf = await createSuperfluidFramework(signer.provider!, chainId);
    const euroXToken = await sf.loadSuperToken(euroXAddress);

    const deleteFlowOperation = euroXToken.deleteFlow({
      sender: await signer.getAddress(),
      receiver,
    });

    const tx = await deleteFlowOperation.exec(signer);
    await tx.wait();

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Error deleting flow:', error);
    throw error;
  }
}

/**
 * Get flow information for a specific receiver
 * @param sender Sender address
 * @param receiver Receiver address
 * @param provider Ethers provider
 * @param chainId Current chain ID
 */
export async function getFlow(
  sender: string,
  receiver: string,
  provider: ethers.providers.Provider,
  chainId: number
) {
  try {
    const sf = await createSuperfluidFramework(provider, chainId);
    const euroXToken = await sf.loadSuperToken(euroXAddress);

    const flow = await euroXToken.getFlow({
      sender,
      receiver,
      providerOrSigner: provider,
    });

    return flow;
  } catch (error) {
    console.error('Error getting flow:', error);
    throw error;
  }
}

/**
 * Get real-time balance of an account
 * @param account Account address
 * @param provider Ethers provider
 * @param chainId Current chain ID
 */
export async function getRealtimeBalance(
  account: string,
  provider: ethers.providers.Provider,
  chainId: number
) {
  try {
    const sf = await createSuperfluidFramework(provider, chainId);
    const euroXToken = await sf.loadSuperToken(euroXAddress);

    const balance = await euroXToken.realtimeBalanceOf({
      account,
      providerOrSigner: provider,
    });

    return balance;
  } catch (error) {
    console.error('Error getting realtime balance:', error);
    throw error;
  }
}

/**
 * Calculate monthly amount from flow rate
 * @param flowRate Flow rate in wei/second
 */
export function flowRateToMonthly(flowRate: string): string {
  const secondsInMonth = 30 * 24 * 60 * 60;
  const monthly = ethers.BigNumber.from(flowRate).mul(secondsInMonth);
  return ethers.utils.formatEther(monthly);
}

/**
 * Calculate flow rate from monthly amount
 * @param monthlyAmount Monthly amount in EUR
 */
export function monthlyToFlowRate(monthlyAmount: string): string {
  const secondsInMonth = 30 * 24 * 60 * 60;
  const amountWei = ethers.utils.parseEther(monthlyAmount);
  const flowRate = amountWei.div(secondsInMonth);
  return flowRate.toString();
}

