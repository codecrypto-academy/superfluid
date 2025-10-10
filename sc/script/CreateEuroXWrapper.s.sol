// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

/**
 * @title CreateEuroXWrapper
 * @dev Script to create a Superfluid Super Token wrapper for the Euro token
 *
 * Usage:
 * forge script script/CreateEuroXWrapper.s.sol:CreateEuroXWrapperScript \
 *   --rpc-url http://127.0.0.1:8545 \
 *   --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 *   --broadcast \
 *   --sig "run(address)" <EURO_TOKEN_ADDRESS>
 */

// Superfluid interfaces
interface ISuperTokenFactory {
    function createERC20Wrapper(
        address underlyingToken,
        uint8 underlyingDecimals,
        uint8 upgradability,
        string calldata name,
        string calldata symbol
    ) external returns (address);
}

interface ISuperfluid {
    function getSuperTokenFactory() external view returns (ISuperTokenFactory);
}

contract CreateEuroXWrapperScript is Script {
    // Superfluid Host on Ethereum Mainnet (available via fork)
    address constant SUPERFLUID_HOST = 0x4E583d9390082B65Bef884b629DFA426114CED6d;

    function run(address euroToken) external {
        require(euroToken != address(0), "Invalid Euro token address");

        vm.startBroadcast();

        // Get the Super Token Factory from Superfluid Host
        ISuperfluid host = ISuperfluid(SUPERFLUID_HOST);
        ISuperTokenFactory factory = host.getSuperTokenFactory();

        console.log("Creating Super Token wrapper for Euro at:", euroToken);
        console.log("Using Super Token Factory at:", address(factory));

        // Create the ERC20 wrapper
        // Parameters:
        // - underlyingToken: the Euro ERC20 token address
        // - underlyingDecimals: 18 (Euro has 18 decimals)
        // - upgradability: 1 (SEMI_UPGRADABLE)
        // - name: "Super Euro"
        // - symbol: "EURx"
        address euroX = factory.createERC20Wrapper(
            euroToken,
            18,
            1, // SEMI_UPGRADABLE
            "Super Euro",
            "EURx"
        );

        console.log("===================================");
        console.log("EuroX Super Token created at:", euroX);
        console.log("===================================");
        console.log("");
        console.log("Update web/src/config/web3.ts with:");
        console.log("  euroAddress:", euroToken);
        console.log("  euroXAddress:", euroX);

        vm.stopBroadcast();
    }
}
