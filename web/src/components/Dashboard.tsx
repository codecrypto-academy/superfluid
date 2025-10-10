'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  createFlow,
  deleteFlow,
  getRealtimeBalance,
  upgradeToEuroX,
  downgradeFromEuroX,
  getFlow,
} from '@/lib/superfluid';
import { euroAddress, CHAIN_ID } from '@/config/web3';

interface Recipient {
  address: string;
  flowRate: string;
  balance: string;
  euroBalance: string;
  status: 'active' | 'paused' | 'none'; 
  // active: flow existe con flowRate > 0
  // paused: flow eliminado pero guardado en la lista (puede reanudarse)
  // none: sin flow
}

// Configuración de Anvil
const ANVIL_RPC_URL = 'http://127.0.0.1:8545';
const ANVIL_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ANVIL_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Mapeo de direcciones de Anvil a sus private keys
const ANVIL_ACCOUNTS: Record<string, string> = {
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906': '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65': '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc': '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
  '0x976EA74026E726554dB657fA54763abd0C3a0aa9': '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
  '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955': '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
  '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f': '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
  '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720': '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
};

export default function Dashboard() {
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Wallet | null>(null);
  const [account, setAccount] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newRecipient, setNewRecipient] = useState<string>('');
  const [euroBalance, setEuroBalance] = useState<string>('0');
  const [euroXBalance, setEuroXBalance] = useState<string>('0');
  const [upgradeAmount, setUpgradeAmount] = useState<string>('');
  const [downgradeAmount, setDowngradeAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (!provider || !account) return;

    const interval = setInterval(async () => {
      try {
        // Actualizar balance EURx del emisor
        const balance = await getRealtimeBalance(account, provider, chainId);
        if (balance && balance.availableBalance) {
          const formattedBalance = ethers.utils.formatEther(balance.availableBalance);
          setEuroXBalance(formattedBalance);
        }
      } catch (err) {
        console.error('Error updating sender balance:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [provider, account, chainId]);

  // Actualizar balances de destinatarios cada 5 segundos
  useEffect(() => {
    if (!provider || !account || recipients.length === 0) return;

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        recipients.map(async (recipient) => {
          try {
            // Obtener balance EURx
            const balance = await getRealtimeBalance(
              recipient.address,
              provider,
              chainId
            );

            // Obtener balance EUR
            const euroContract = new ethers.Contract(
              euroAddress,
              ['function balanceOf(address) view returns (uint256)'],
              provider
            );
            const euroBal = await euroContract.balanceOf(recipient.address);

            // Verificar el estado del flow en la blockchain
            const flow = await getFlow(account, recipient.address, provider, chainId);
            let status: 'active' | 'paused' | 'none' = recipient.status; // Mantener el estado actual por defecto
            let flowRateEurPerMonth = '0';
            
            if (flow && flow.flowRate !== '0') {
              // El flow existe y está activo
              status = 'active';
              
              // Calcular flowRate en EUR/mes desde wei/segundo
              const flowRatePerSecond = ethers.BigNumber.from(flow.flowRate);
              const secondsInMonth = 30 * 24 * 60 * 60;
              const flowRatePerMonth = flowRatePerSecond.mul(secondsInMonth);
              flowRateEurPerMonth = ethers.utils.formatEther(flowRatePerMonth);
            } else {
              // El flow no existe
              // Si en nuestra lista estaba como 'active', cambiar a 'paused' o 'none'
              // Si ya estaba como 'paused', mantenerlo así
              if (recipient.status === 'active') {
                status = 'paused'; // Se detuvo externamente
              }
              flowRateEurPerMonth = '0';
            }

            return {
              ...recipient,
              balance: balance?.availableBalance ? ethers.utils.formatEther(balance.availableBalance) : '0',
              euroBalance: euroBal ? ethers.utils.formatEther(euroBal) : '0',
              flowRate: flowRateEurPerMonth || '0',
              status,
            };
          } catch (err) {
            console.error('Error updating recipient:', err);
            return recipient;
          }
        })
      );
      setRecipients(updated);
    }, 5000);

    return () => clearInterval(interval);
  }, [provider, account, recipients.length, chainId]);

  // Cargar recipients desde localStorage al montar el componente
  useEffect(() => {
    const savedRecipients = localStorage.getItem('superfluid_recipients');
    if (savedRecipients) {
      try {
        const parsed = JSON.parse(savedRecipients);
        // Validar y limpiar los datos cargados
        const cleanedRecipients = parsed.map((r: any) => ({
          ...r,
          flowRate: r.flowRate || '0',
          balance: r.balance || '0',
          euroBalance: r.euroBalance || '0',
          status: r.status || 'none',
        }));
        console.log('Loaded recipients from localStorage:', cleanedRecipients);
        setRecipients(cleanedRecipients);
      } catch (err) {
        console.error('Error loading recipients from localStorage:', err);
        // Si hay error, limpiar localStorage
        localStorage.removeItem('superfluid_recipients');
      }
    }
  }, []);

  // Guardar recipients en localStorage cada vez que cambian
  useEffect(() => {
    if (recipients.length > 0) {
      localStorage.setItem('superfluid_recipients', JSON.stringify(recipients));
    }
  }, [recipients]);

  // Conectar automáticamente con la cuenta de Anvil
  const connectWallet = async () => {
    try {
      // Usar StaticJsonRpcProvider que no hace llamadas automáticas de red
      // Esto evita completamente los errores de ENS
      const jsonRpcProvider = new ethers.providers.StaticJsonRpcProvider(
        ANVIL_RPC_URL,
        {
          name: 'anvil',
          chainId: CHAIN_ID,
        }
      );

      // Crear wallet con la private key
      const wallet = new ethers.Wallet(ANVIL_PRIVATE_KEY, jsonRpcProvider);

      // Obtener el chain ID
      const network = await jsonRpcProvider.getNetwork();

      setProvider(jsonRpcProvider);
      setSigner(wallet);
      setAccount(ANVIL_ADDRESS);
      setChainId(network.chainId);

      // Verificar que los contratos existen
      console.log('Verificando contratos desplegados...');
      console.log('EUR address:', euroAddress);
      const { euroXAddress } = await import('@/config/web3');
      console.log('EURx address:', euroXAddress);
      
      // Intentar leer código del contrato EUR
      const euroCode = await jsonRpcProvider.getCode(euroAddress);
      if (euroCode === '0x') {
        throw new Error(`⚠️ El contrato EUR no existe en ${euroAddress}\n\n🔄 Redesplega los contratos:\n\ncd sc && forge script script/DeployAll.s.sol:DeployAllScript --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast`);
      }
      
      // Verificar contrato EURx
      const euroXCode = await jsonRpcProvider.getCode(euroXAddress);
      if (euroXCode === '0x') {
        throw new Error(`⚠️ El contrato EURx no existe en ${euroXAddress}\n\n🔄 Redesplega los contratos:\n\ncd sc && forge script script/DeployAll.s.sol:DeployAllScript --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast`);
      }
      
      console.log('✅ Contratos verificados correctamente');

      // Cargar balances
      await loadBalances(jsonRpcProvider, ANVIL_ADDRESS, network.chainId);

      alert(`✅ Conectado exitosamente!\n\nCuenta: ${ANVIL_ADDRESS}\nRed: Anvil Local (Chain ID: ${network.chainId})`);
    } catch (err: any) {
      const errorMsg = `Error conectando a Anvil: ${err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}\n\nAsegúrate de que Anvil esté corriendo en http://127.0.0.1:8545`);
    }
  };

  // Cargar balances EUR y EURx
  const loadBalances = async (
    jsonRpcProvider: ethers.providers.JsonRpcProvider,
    userAddress: string,
    networkChainId: number
  ) => {
    try {
      console.log('Loading balances for:', userAddress);
      
      // EUR balance
      const euroContract = new ethers.Contract(
        euroAddress,
        ['function balanceOf(address) view returns (uint256)'],
        jsonRpcProvider
      );
      const euroBal = await euroContract.balanceOf(userAddress);
      const eurBalFormatted = ethers.utils.formatEther(euroBal || '0');
      console.log('EUR balance loaded:', eurBalFormatted);
      setEuroBalance(eurBalFormatted);

      // EURx balance
      const balance = await getRealtimeBalance(userAddress, jsonRpcProvider, networkChainId);
      const eurxBalFormatted = ethers.utils.formatEther(balance.availableBalance || '0');
      console.log('EURx balance loaded:', eurxBalFormatted);
      setEuroXBalance(eurxBalFormatted);
    } catch (err: any) {
      console.error('Error loading balances:', err);
      // Establecer valores predeterminados en caso de error
      setEuroBalance('0');
      setEuroXBalance('0');
    }
  };

  // Upgrade EUR a EURx
  const handleUpgrade = async () => {
    if (!signer || !upgradeAmount || !provider) return;

    setLoading(true);
    setError('');

    try {
      // Validar y parsear el monto
      const amount = parseFloat(upgradeAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('❌ Por favor ingresa un monto válido mayor a 0');
        return;
      }

      const amountWei = ethers.utils.parseEther(upgradeAmount.trim());

      // Crear contrato EUR
      const euroContract = new ethers.Contract(
        euroAddress,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function balanceOf(address) view returns (uint256)',
          'function allowance(address owner, address spender) view returns (uint256)'
        ],
        signer
      );

      // Verificar balance suficiente
      const eurBalance = await euroContract.balanceOf(account);
      if (eurBalance.lt(amountWei)) {
        alert(`❌ Balance insuficiente!\n\nTienes: ${ethers.utils.formatEther(eurBalance)} EUR\nNecesitas: ${upgradeAmount} EUR`);
        return;
      }

      // Obtener dirección de EURx
      const { euroXAddress } = await import('@/config/web3');

      // Aprobar si es necesario
      const currentAllowance = await euroContract.allowance(account, euroXAddress);
      if (currentAllowance.lt(amountWei)) {
        alert(`🔄 Aprobando EUR para upgrade...\n\nEspera la confirmación.`);
        const approveTx = await euroContract.approve(euroXAddress, ethers.constants.MaxUint256);
        await approveTx.wait();
        alert(`✅ Aprobación exitosa!\n\nAhora haciendo upgrade de ${upgradeAmount} EUR a EURx...`);
      } else {
        alert(`🔄 Haciendo upgrade de ${upgradeAmount} EUR a EURx...\n\nEspera la confirmación.`);
      }

      // Realizar upgrade
      await upgradeToEuroX(amountWei.toString(), signer, chainId);

      // Recargar balances y limpiar input
      await loadBalances(provider, account, chainId);
      setUpgradeAmount('');
      alert(`✅ Upgrade completado!\n\nSe han convertido ${upgradeAmount} EUR a EURx exitosamente.`);
    } catch (err: any) {
      const errorMsg = `Error en upgrade: ${err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Downgrade EURx a EUR
  const handleDowngrade = async () => {
    if (!signer || !downgradeAmount) return;

    setLoading(true);
    setError('');

    try {
      // Validar que el monto sea un número válido
      const amount = parseFloat(downgradeAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('❌ Por favor ingresa un monto válido mayor a 0');
        setLoading(false);
        return;
      }

      const amountWei = ethers.utils.parseEther(downgradeAmount);

      alert(`🔄 Convirtiendo ${downgradeAmount} EURx a EUR...\n\nEspera la confirmación.`);

      // Downgrade
      await downgradeFromEuroX(amountWei.toString(), signer, chainId);

      // Recargar balances
      if (provider && account) {
        await loadBalances(provider, account, chainId);
      }

      setDowngradeAmount('');
      alert(`✅ Downgrade completado!\n\nSe han convertido ${downgradeAmount} EURx a EUR exitosamente.`);
    } catch (err: any) {
      const errorMsg = `Error en downgrade: ${err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Agregar destinatario y comenzar stream
  const handleAddRecipient = async () => {
    if (!signer || !newRecipient || !provider) return;

    setLoading(true);
    setError('');

    try {
      // Validar dirección
      if (!ethers.utils.isAddress(newRecipient)) {
        throw new Error('Dirección Ethereum inválida');
      }

      // Verificar si ya está en la lista
      if (recipients.find((r) => r.address.toLowerCase() === newRecipient.toLowerCase())) {
        alert(`⚠️ Este destinatario ya está en tu lista.`);
        setLoading(false);
        return;
      }

      // Verificar si ya existe un flujo
      const existingFlow = await getFlow(account, newRecipient, provider, chainId);
      
      if (existingFlow && existingFlow.flowRate !== '0') {
        // Si ya existe un flujo activo, agregarlo a la lista sin crear uno nuevo
        const flowRatePerSecond = ethers.BigNumber.from(existingFlow.flowRate);
        const secondsInMonth = 30 * 24 * 60 * 60;
        const flowRatePerMonth = flowRatePerSecond.mul(secondsInMonth);
        const flowRateEurPerMonth = ethers.utils.formatEther(flowRatePerMonth);

        const balance = await getRealtimeBalance(newRecipient, provider, chainId);
        
        // Obtener balance EUR
        const euroContract = new ethers.Contract(
          euroAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const euroBal = await euroContract.balanceOf(newRecipient);
        
        const newRec: Recipient = {
          address: newRecipient,
          flowRate: flowRateEurPerMonth,
          balance: ethers.utils.formatEther(balance.availableBalance),
          euroBalance: ethers.utils.formatEther(euroBal),
          status: 'active',
        };
        setRecipients([...recipients, newRec]);
        setNewRecipient('');
        
        alert(`✅ Se agregó el destinatario a tu lista!\n\nYa existe un stream activo de ${parseFloat(flowRateEurPerMonth).toFixed(2)} EUR/mes`);
        setLoading(false);
        return;
      }

      alert(`🚀 Creando stream de 2000 EUR/mes a:\n${newRecipient}\n\nEspera la confirmación...`);

      // Crear flow (2000 EUR/month)
      await createFlow(newRecipient, signer, chainId);

      // Agregar a la lista local
      const newRec: Recipient = {
        address: newRecipient,
        flowRate: '2000',
        balance: '0',
        euroBalance: '0',
        status: 'active',
      };
      setRecipients([...recipients, newRec]);
      setNewRecipient('');

      alert(`✅ Stream creado exitosamente!\n\nEstás enviando 2000 EUR/mes a:\n${newRecipient}`);
    } catch (err: any) {
      const errorMsg = `Error creando stream: ${err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Pausar stream (eliminar flow pero mantener en la lista)
  const handlePauseStream = async (recipient: string) => {
    if (!signer || !provider) return;

    setLoading(true);
    setError('');

    try {
      alert(`⏸️ Pausando stream a:\n${recipient}\n\nEspera la confirmación...`);

      // En Superfluid no se puede poner flowRate a 0, hay que eliminar el flow
      // Pero lo mantenemos en la lista para poder reanudarlo después
      await deleteFlow(recipient, signer, chainId);

      // Actualizar lista local - mantener destinatario pero cambiar estado a pausado
      setRecipients(
        recipients.map((r) =>
          r.address === recipient ? { ...r, flowRate: '0', status: 'paused' } : r
        )
      );

      alert(`✅ Stream pausado exitosamente!\n\nEl flujo se eliminó pero puedes reanudarlo cuando quieras.`);
    } catch (err: any) {
      const errorMsg = `Error pausando stream: ${err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Downgrade EURx a EUR para un destinatario específico
  const handleDowngradeRecipient = async (recipientAddress: string) => {
    if (!provider) return;

    setLoading(true);
    setError('');

    try {
      // Verificar si la dirección está en las cuentas de Anvil
      const privateKey = ANVIL_ACCOUNTS[recipientAddress];
      
      if (!privateKey) {
        alert(`⚠️ Esta dirección no está en las cuentas de Anvil.\n\nSolo se puede hacer downgrade automático de cuentas de Anvil.`);
        setLoading(false);
        return;
      }

      // Crear un signer temporal con la private key del destinatario
      const recipientSigner = new ethers.Wallet(privateKey, provider);

      // Obtener el balance EURx del destinatario desde el contrato
      const { euroXAddress } = await import('@/config/web3');
      const euroXContract = new ethers.Contract(
        euroXAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const contractBalance = await euroXContract.balanceOf(recipientAddress);

      if (contractBalance.eq(0)) {
        alert(`⚠️ El destinatario no tiene EURx para hacer downgrade.`);
        setLoading(false);
        return;
      }

      // Para estar seguros, hacer downgrade solo del 80% del balance
      // Esto evita problemas con depósitos bloqueados y flujos activos
      const downgradeAmount = contractBalance.mul(80).div(100);

      if (downgradeAmount.eq(0)) {
        alert(`⚠️ El destinatario no tiene suficiente EURx disponible para hacer downgrade.`);
        setLoading(false);
        return;
      }

      const downgradeAmountFormatted = ethers.utils.formatEther(downgradeAmount);
      
      alert(`🔄 Haciendo downgrade de ${parseFloat(downgradeAmountFormatted).toFixed(4)} EURx a EUR\n\nDesde: ${recipientAddress}\n\nEspera la confirmación...`);

      // Hacer downgrade desde la cuenta del destinatario
      await downgradeFromEuroX(downgradeAmount.toString(), recipientSigner, chainId);

      alert(`✅ Downgrade completado!\n\n${parseFloat(downgradeAmountFormatted).toFixed(4)} EURx convertidos a EUR\nEn la cuenta: ${recipientAddress}`);
    } catch (err: any) {
      const errorMsg = `Error en downgrade: ${err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar destinatario de la lista
  const handleRemoveRecipient = async (recipient: string) => {
    if (!signer || !provider) return;

    setLoading(true);
    setError('');

    try {
      // Verificar si hay un flow activo
      const existingFlow = await getFlow(account, recipient, provider, chainId);
      
      if (existingFlow && existingFlow.flowRate !== '0') {
        // Si hay un flow activo, eliminarlo primero
        alert(`🗑️ Eliminando stream y destinatario:\n${recipient}\n\nEspera la confirmación...`);
        await deleteFlow(recipient, signer, chainId);
      }

      // Remover de la lista local
      setRecipients(recipients.filter((r) => r.address !== recipient));

      alert(`✅ Destinatario eliminado de tu lista.`);
    } catch (err: any) {
      const errorMsg = `Error eliminando destinatario: ${err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Reanudar stream
  const handleResumeStream = async (recipient: string) => {
    if (!signer || !provider) return;

    setLoading(true);
    setError('');

    try {
      alert(`▶️ Reanudando stream de 2000 EUR/mes a:\n${recipient}\n\nEspera la confirmación...`);

      // Si está pausado, el flow fue eliminado, así que crear uno nuevo
      // Importar MONTHLY_FLOW_RATE
      const { MONTHLY_FLOW_RATE } = await import('@/config/web3');

      // Verificar si ya existe un flujo activo
      const existingFlow = await getFlow(account, recipient, provider, chainId);
      
      if (existingFlow && existingFlow.flowRate !== '0') {
        // Ya existe un flujo activo, solo actualizar la lista local
        const flowRatePerSecond = ethers.BigNumber.from(existingFlow.flowRate);
        const secondsInMonth = 30 * 24 * 60 * 60;
        const flowRatePerMonth = flowRatePerSecond.mul(secondsInMonth);
        const flowRateEurPerMonth = ethers.utils.formatEther(flowRatePerMonth);
        
        setRecipients(
          recipients.map((r) =>
            r.address === recipient ? { ...r, flowRate: flowRateEurPerMonth, status: 'active' } : r
          )
        );
        
        alert(`✅ Ya existe un stream activo de ${parseFloat(flowRateEurPerMonth).toFixed(2)} EUR/mes`);
      } else {
        // No existe flujo, crear uno nuevo
        await createFlow(recipient, signer, chainId);
        
        // Actualizar lista local
        setRecipients(
          recipients.map((r) =>
            r.address === recipient ? { ...r, flowRate: '2000', status: 'active' } : r
          )
        );
        
        alert(`✅ Stream reanudado exitosamente!\n\nEstás enviando 2000 EUR/mes a:\n${recipient}`);
      }
    } catch (err: any) {
      const errorMsg = `Error reanudando stream: ${err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar balances del emisor cada 5 segundos
 
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Superfluid EUR Streaming Dashboard
        </h1>

        {!account ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-4">
              Esta aplicación usa automáticamente la cuenta de Anvil para desarrollo.
            </p>
            <button
              onClick={connectWallet}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Conectar con Anvil
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Cuenta</h2>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Address:</span> {account}
              </p>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Network:</span>{' '}
                {chainId === CHAIN_ID ? 'Anvil Local (Chain 31337)' : `Chain ${chainId}`}
              </p>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">EUR Balance:</span> {parseFloat(euroBalance).toFixed(2)} EUR
              </p>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">EURx Balance:</span>{' '}
                <span className="text-xl font-mono font-bold text-blue-600">
                  {parseFloat(euroXBalance).toFixed(6)} EURx
                </span>
                {recipients.some(r => r.status === 'active') && (
                  <span className="ml-2 text-xs text-orange-600 animate-pulse">
                    ⬇️ Streaming...
                  </span>
                )}
              </p>
              {recipients.some(r => r.status === 'active') && (
                <>
                  <p className="text-gray-600">
                    <span className="font-medium">Flujo Total Saliente:</span>{' '}
                    <span className="text-lg font-semibold text-red-600">
                      {recipients
                        .filter(r => r.status === 'active')
                        .reduce((sum, r) => sum + parseFloat(r.flowRate), 0)
                        .toFixed(2)} EUR/mes
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 El balance se actualiza cada 5 segundos mientras hay streams activos
                  </p>
                </>
              )}
            </div>

            {/* Debug: Clear localStorage */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-yellow-800">
                  💡 Si tienes problemas, limpia los datos guardados
                </p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    setRecipients([]);
                    alert('✅ Datos locales limpiados.\n\nRecarga la página.');
                  }}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm"
                >
                  🗑️ Limpiar Datos
                </button>
              </div>
            </div>

            {/* Upgrade EUR to EURx */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Convertir EUR ↔ EURx</h2>
              
              {/* Upgrade */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">📈 Upgrade EUR → EURx</h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={upgradeAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Evitar guardar "NaN" o valores inválidos
                      setUpgradeAmount(val === '' || isNaN(parseFloat(val)) ? '' : val);
                    }}
                    placeholder="Cantidad en EUR (ej: 1000)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleUpgrade}
                    disabled={loading || !upgradeAmount}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    Upgrade
                  </button>
                </div>
              </div>

              {/* Downgrade */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">📉 Downgrade EURx → EUR</h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={downgradeAmount}
                    onChange={(e) => setDowngradeAmount(e.target.value)}
                    placeholder="Cantidad en EURx (ej: 500)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleDowngrade}
                    disabled={loading || !downgradeAmount}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
                  >
                    Downgrade
                  </button>
                </div>
              </div>
            </div>

            {/* Add Recipient */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Agregar Destinatario</h2>
              <p className="text-sm text-gray-600 mb-4">
                Ingresa una dirección para crear un nuevo stream de 2000 EUR/mes, o para agregar un stream existente a tu lista.
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value.trim())}
                  placeholder="0x... (dirección Ethereum)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddRecipient}
                  disabled={loading || !newRecipient}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Recipients List */}
            {recipients.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Destinatarios</h2>
                <div className="space-y-4">
                  {recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {recipient.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          Flow Rate: {parseFloat(recipient.flowRate).toFixed(2)} EUR/mes
                        </p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <p>
                            EURx: {parseFloat(recipient.balance).toFixed(4)}
                          </p>
                          <p>
                            EUR: {parseFloat(recipient.euroBalance).toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm">
                          Estado:{' '}
                          <span
                            className={
                              recipient.status === 'active'
                                ? 'text-green-600 font-medium'
                                : recipient.status === 'paused'
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-600 font-medium'
                            }
                          >
                            {recipient.status === 'active' && '▶️ Activo'}
                            {recipient.status === 'paused' && '⏸️ Pausado'}
                            {recipient.status === 'none' && '⏹️ Sin flujo'}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {recipient.status === 'active' && (
                            <button
                              onClick={() => handlePauseStream(recipient.address)}
                              disabled={loading}
                              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 flex items-center gap-2"
                            >
                              ⏸️ Pausar
                            </button>
                          )}
                          {recipient.status === 'paused' && (
                            <>
                              <button
                                onClick={() => handleResumeStream(recipient.address)}
                                disabled={loading}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center gap-2"
                              >
                                ▶️ Reanudar
                              </button>
                              <button
                                onClick={() => handleRemoveRecipient(recipient.address)}
                                disabled={loading}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 flex items-center gap-2"
                              >
                                🗑️ Eliminar
                              </button>
                            </>
                          )}
                          {recipient.status === 'none' && (
                            <>
                              <button
                                onClick={() => handleResumeStream(recipient.address)}
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2"
                              >
                                ▶️ Iniciar Stream
                              </button>
                              <button
                                onClick={() => handleRemoveRecipient(recipient.address)}
                                disabled={loading}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400 flex items-center gap-2"
                              >
                                🗑️ Eliminar
                              </button>
                            </>
                          )}
                        </div>
                        {/* Botón de Downgrade para cuentas de Anvil */}
                        {ANVIL_ACCOUNTS[recipient.address] && parseFloat(recipient.balance) > 0 && (
                          <button
                            onClick={() => handleDowngradeRecipient(recipient.address)}
                            disabled={loading}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 flex items-center gap-2 text-sm"
                          >
                            📉 Downgrade 80% EURx → EUR
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">Procesando transacción...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
