# Superfluid EUR Streaming Application

Aplicación de streaming de tokens EUR usando Superfluid Protocol con frontend en Next.js 15.

## Estructura del Proyecto

```
35_superfluid/
├── sc/              # Smart contracts (Foundry)
│   ├── src/         # Código fuente de contratos
│   ├── script/      # Scripts de deployment
│   ├── test/        # Tests
│   └── lib/         # Dependencias
└── web/             # Frontend (Next.js 15)
    ├── src/
    │   ├── app/       # Next.js App Router
    │   ├── components/# Componentes React
    │   ├── config/    # Configuración
    │   └── lib/       # Utilidades y bibliotecas
    └── public/        # Assets estáticos
```

## Smart Contracts

### Desarrollo

```bash
# Build
cd sc && forge build

# Test
cd sc && forge test

# Test con logs
cd sc && forge test -vvv
```

### Deployment

1. **Iniciar Anvil con fork de mainnet**

```bash
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

Esto crea un fork local de Ethereum mainnet con acceso a la infraestructura de Superfluid.

2. **Desplegar todos los contratos (TODO EN UNO)**

```bash
cd sc
forge script script/DeployAll.s.sol:DeployAllScript \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Este comando:
- Despliega el contrato Euro (ERC20 stablecoin)
- Mintea 10,000,000 EUR tokens a `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Crea el Super Token EURx wrapper automáticamente
- Muestra las direcciones a copiar

3. **Copiar las direcciones**

El script mostrará las direcciones de Euro y EURx para copiar a la configuración.

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas paso a paso.

## Web Application

### Configuración

1. **Instalar dependencias**

```bash
cd web
npm install
```

2. **Actualizar direcciones de contratos**

Edita `web/src/config/web3.ts` y actualiza:

```typescript
// Pega la dirección del contrato Euro desplegado
export const euroAddress = '0x...';

// Pega la dirección del Super Token EURx
export const euroXAddress = '0x...';
```

### Desarrollo

```bash
cd web
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Uso de la Aplicación

### 1. Conectar Wallet

- Haz clic en "Connect Wallet"
- Conecta MetaMask u otro wallet Web3
- Asegúrate de estar en la red correcta:
  - RPC URL: `http://127.0.0.1:8545`
  - Chain ID: `1` (mantiene el ID de mainnet porque es un fork)

### 2. Actualizar EUR a EURx

Para hacer streaming, primero necesitas convertir tus tokens EUR a EURx (Super Token):

1. Ingresa la cantidad de EUR que quieres convertir
2. Haz clic en "Upgrade"
3. Aprueba la transacción en tu wallet

### 3. Agregar Destinatarios

1. Ingresa una dirección Ethereum en el campo "Add Recipient"
2. Haz clic en "Add & Start Stream"
3. Se iniciará automáticamente un stream de **2000 EUR/mes** a esa dirección

### 4. Ver Balances en Tiempo Real

- Los balances de los destinatarios se actualizan cada 5 segundos
- Puedes ver el balance aumentando en tiempo real

### 5. Detener un Stream

- Haz clic en el botón "Stop" junto a cualquier destinatario
- El stream se detendrá inmediatamente

## Configuración de Superfluid

### Flow Rate

El flow rate está configurado en `web/src/config/web3.ts`:

```typescript
// 2000 EUR/month = 771604938271604 wei/second
export const MONTHLY_FLOW_RATE = '771604938271604';
```

Cálculo: `2000 * 10^18 / (30 * 24 * 60 * 60) = 771604938271604 wei/segundo`

### Red

- **Anvil con fork de Ethereum mainnet** (desarrollo local con infraestructura de Superfluid)

## Tecnologías

### Smart Contracts
- Solidity ^0.8.13
- OpenZeppelin Contracts (ERC20, Ownable)
- Foundry (Forge, Anvil)

### Frontend
- Next.js 15.5.4 (App Router)
- React 19.1.0
- TypeScript
- Tailwind CSS 4
- Ethers.js v5
- Superfluid SDK Core v0.9.0

## Notas Importantes

1. **Anvil debe estar corriendo** para desarrollo local
2. **Actualiza las direcciones** en `web/src/config/web3.ts` después del deployment
3. **Asegúrate de tener suficiente EURx** antes de crear streams
4. Los **balances se actualizan cada 5 segundos** automáticamente
5. El **flow rate es fijo** a 2000 EUR/mes por destinatario

## Troubleshooting

### "Insufficient EURx balance"
- Primero haz upgrade de EUR a EURx
- Asegúrate de tener suficiente balance para el stream

### "Transaction failed"
- Verifica que Anvil esté corriendo
- Confirma que estás en la red correcta
- Revisa que las direcciones de contratos estén actualizadas

### "Cannot connect wallet"
- Instala MetaMask
- Añade la red Anvil Fork (RPC: `http://127.0.0.1:8545`, Chain ID: `1`)
- Importante: Usa Chain ID `1` no `31337` (mantiene el ID de mainnet)
- Importa la cuenta de Anvil con la private key proporcionada
- Asegúrate de tener ETH para gas

## Licencias

- Smart Contracts: MIT
- Web App: MIT
