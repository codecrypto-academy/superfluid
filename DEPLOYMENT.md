# Guía de Deployment

## Anvil con Fork de Mainnet

Este proyecto utiliza **Anvil con un fork de Ethereum mainnet** para tener acceso a la infraestructura real de Superfluid en un entorno local de desarrollo.

### 1. Iniciar Anvil con Fork de Mainnet

**IMPORTANTE:** Especifica un bloque reciente para asegurar que Superfluid esté desplegado:

```bash
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY --fork-block-number 19000000
```

También puedes usar Infura:

```bash
anvil --fork-url https://mainnet.infura.io/v3/YOUR_INFURA_KEY --fork-block-number 19000000
```

O sin especificar bloque (usará el último):

```bash
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

**¿Por qué fork de mainnet?**
- Acceso completo a la infraestructura de Superfluid ya desplegada
- No necesitas desplegar contratos de Superfluid
- Puedes interactuar con Super Tokens existentes
- Entorno de desarrollo completamente local

**Nota:** Si obtienes errores de "non-contract address", verifica que:
1. Tu API key de Alchemy/Infura sea válida
2. Estés usando un bloque suficientemente reciente (>19000000)
3. Anvil se haya iniciado correctamente con el fork

### 2. Verificar que Superfluid esté disponible (Recomendado)

Antes de desplegar, verifica que Superfluid esté disponible en tu fork:

```bash
cd sc
forge script script/VerifySuperfluid.s.sol:VerifySuperfluidScript --rpc-url http://127.0.0.1:8545
```

Deberías ver:
```
✅ SUCCESS: Superfluid esta disponible!
```

Si ves un error, sigue las instrucciones que el script proporciona.

### 3. Desplegar Contratos

Tienes dos opciones:

#### Opción A: Deployment Completo (TODO EN UNO - Recomendado)

Un solo comando que despliega Euro y crea el Super Token EURx:

```bash
cd sc
forge script script/DeployAll.s.sol:DeployAllScript \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

El script mostrará toda la información necesaria:

```
====================================
DEPLOYMENT COMPLETE!
====================================

Account balances:
  EUR balance: 10000000 EUR
  Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

====================================
NEXT STEPS:
====================================

1. Update web/src/config/web3.ts with:

   export const euroAddress = ' 0x... ';
   export const euroXAddress = ' 0x... ';
```

**Copia las direcciones** que se muestran y salta al paso 5.

#### Opción B: Deployment Paso a Paso

**3a. Desplegar el Contrato Euro**

```bash
cd sc
forge script script/DeployEuro.s.sol:DeployEuroScript \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

**Copia la dirección** del contrato Euro desplegado.

**3b. Crear Super Token EURx**

Tienes dos opciones para crear el Super Token wrapper:

**Opción 1: Usando Script de Foundry (Recomendado - Automático)**

```bash
cd sc
forge script script/CreateEuroXWrapper.s.sol:CreateEuroXWrapperScript \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast \
  --sig "run(address)" <EURO_ADDRESS>
```

Reemplaza `<EURO_ADDRESS>` con la dirección del contrato Euro del paso 2.

El script creará automáticamente el Super Token EURx y mostrará:
```
EuroX Super Token created at: 0x...
```

**Copia esta dirección** para el siguiente paso.

**Opción 2: Usando Superfluid Console (Manual)**

1. Ve a https://console.superfluid.finance/
2. Conecta tu wallet de Anvil (MetaMask configurado en `http://127.0.0.1:8545`)
3. En el selector de red, elige "Custom RPC" y conecta a tu Anvil local
4. Navega a "Super Tokens" → "Deploy Wrapper"
5. Ingresa la dirección del token EUR que desplegaste
6. Nombre: `Super Euro`
7. Símbolo: `EURx`
8. Crea el wrapper

**Copia la dirección** del Super Token EURx creado.

### 4. Verificar Deployment (Opcional)

**Verificar Balance EUR:**

```bash
cast call <EURO_ADDRESS> \
  "balanceOf(address)(uint256)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://127.0.0.1:8545
```

Deberías ver: `10000000000000000000000000` (10 millones con 18 decimales)

**Verificar Ownership:**

```bash
cast call <EURO_ADDRESS> \
  "owner()(address)" \
  --rpc-url http://127.0.0.1:8545
```

**Verificar Total Supply:**

```bash
cast call <EURO_ADDRESS> \
  "totalSupply()(uint256)" \
  --rpc-url http://127.0.0.1:8545
```

### 5. Actualizar Configuración Web

Edita [web/src/config/web3.ts](web/src/config/web3.ts) y actualiza las direcciones:

```typescript
export const euroAddress = '0x...'; // Tu dirección EUR
export const euroXAddress = '0x...'; // Dirección del Super Token EURx
```

## Configurar MetaMask

### 1. Añadir Red Anvil (Mainnet Fork)

En MetaMask:

1. **Network Name:** `Anvil Mainnet Fork`
2. **RPC URL:** `http://127.0.0.1:8545`
3. **Chain ID:** `1` (usa el Chain ID de mainnet porque es un fork)
4. **Currency Symbol:** `ETH`

**Nota:** Al hacer fork de mainnet, Anvil mantiene el Chain ID original (1). Si conectas MetaMask a mainnet real por error, asegúrate de cambiar el RPC URL a `http://127.0.0.1:8545`.

### 2. Importar Cuenta de Anvil

Importa la primera cuenta de Anvil usando su private key:

```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Esta cuenta tendrá:**
- ~10,000 ETH para gas (del fork)
- 10,000,000 EUR tokens (minteados en el deployment)

### 3. Añadir Token EUR a MetaMask

1. Abre MetaMask
2. Click en "Import tokens"
3. Pega la dirección del contrato Euro
4. **Symbol:** `EUR`
5. **Decimals:** `18`

## Direcciones de Superfluid en Mainnet

El fork de Anvil incluye estos contratos de Superfluid ya desplegados:

- **Resolver:** `0xeE4cD028f5fdaAdeA99f8fc38e8bA8A57c90Be53`
- **Host:** `0x4E583d9390082B65Bef884b629DFA426114CED6d`
- **Governance:** `0xe2E14e2C4518cB06c32Cd0818B4C01f53E1Ba653`
- **CFA v1:** `0x2844c1BBdA121E9E43105630b9C8310e5c72744b`
- **CFA v1 Forwarder:** `0xcfA132E353cB4E398080B9700609bb008eceB125`
- **IDA v1:** `0xbCF9cfA8Da20B591790dF27DE65C1254Bf91563d`
- **GDA v1:** `0xAAdBB3Eee3Bd080f5353d86DdF1916aCA3fAC842`
- **Super Token Factory:** `0x0422689cc4087b6B7280e0a7e7F655200ec86Ae1`

Estas direcciones ya están configuradas en [web/src/config/web3.ts](web/src/config/web3.ts).

## Troubleshooting

### "Anvil not found"
Instala Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### "Transaction failed"
- ✅ Verifica que Anvil esté corriendo
- ✅ Confirma que la dirección tenga ETH para gas
- ✅ Revisa los logs de Anvil en la terminal

### "Insufficient funds"
- ✅ Asegúrate de estar usando la cuenta `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- ✅ Verifica el balance con `cast call`

### "Cannot connect to Superfluid"
- ✅ Confirma que Anvil tenga fork de mainnet activo
- ✅ Verifica las direcciones en `web/src/config/web3.ts`

### "MetaMask no se conecta"
- ✅ Usa Chain ID: 1 (no 31337, porque es un fork de mainnet)
- ✅ Verifica que el RPC URL sea `http://127.0.0.1:8545`
- ✅ Si estás conectado a mainnet real, cambia el RPC a localhost
- ✅ Reinicia MetaMask si es necesario

### "Fork URL error"
- ✅ Verifica que tu API key de Alchemy/Infura sea válida
- ✅ Confirma que tengas conexión a internet
- ✅ Prueba con otra URL de RPC

### "call to non-contract address" o "Superfluid Host no encontrado"
Este error significa que Superfluid no está disponible en el bloque que estás usando:

**Solución 1: Especificar un bloque reciente**
```bash
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY --fork-block-number 19000000
```

**Solución 2: Verificar que el contrato existe**
```bash
# En otra terminal, con Anvil corriendo:
cast code 0x4E583d9390082B65Bef884b629DFA426114CED6d --rpc-url http://127.0.0.1:8545
```

Si devuelve `0x`, el contrato no está en ese bloque. Reinicia Anvil con un bloque más reciente.

**Solución 3: Usar Polygon en lugar de Mainnet**
Superfluid es más activo en Polygon. Puedes hacer fork de Polygon:
```bash
anvil --fork-url https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
```

Luego actualiza en [web/src/config/web3.ts](web/src/config/web3.ts):
- Chain ID: 137 (Polygon)
- Host: `0x3E14dC1b13c488a8d5D310918780c983bD5982E7`

## Próximos Pasos

Después del deployment exitoso:

1. ✅ **Copiar direcciones** a [web/src/config/web3.ts](web/src/config/web3.ts)
2. ✅ **Instalar dependencias:** `cd web && npm install`
3. ✅ **Iniciar app:** `npm run dev`
4. ✅ **Abrir navegador:** `http://localhost:3000`
5. ✅ **Conectar wallet** (MetaMask con red Anvil)
6. ✅ **Upgrade EUR → EURx** (necesario para streaming)
7. ✅ **Agregar destinatarios** y ver streams en tiempo real

## Comandos Útiles

### Ver logs de Anvil
Los logs se muestran automáticamente en la terminal donde ejecutaste `anvil`

### Resetear Anvil
Simplemente detén el proceso (`Ctrl+C`) y vuelve a iniciar:
```bash
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

### Ver transacciones en Anvil
Todas las transacciones se muestran en tiempo real en la terminal de Anvil

### Cambiar cuenta de deployment
Usa cualquiera de las 10 cuentas pre-financiadas de Anvil. Las private keys están en la salida inicial de `anvil`.
