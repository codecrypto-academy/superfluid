// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Euro.sol";

/**
 * @title DeployEuroScript
 * @dev Script to deploy Euro stablecoin and mint initial supply
 *
 * Usage:
 * forge script script/DeployEuro.s.sol:DeployEuroScript \
 *   --rpc-url http://127.0.0.1:8545 \
 *   --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 *   --broadcast
 */
contract DeployEuroScript is Script {
    // Anvil's first default account
    address constant INITIAL_HOLDER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    // 10 million EUR tokens (with 18 decimals)
    uint256 constant INITIAL_SUPPLY = 10_000_000 * 10**18;

    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy the Euro contract
        Euro euro = new Euro();
        console.log("Euro token deployed at:", address(euro));

        // Mint initial supply to the first Anvil account
        euro.mint(INITIAL_HOLDER, INITIAL_SUPPLY);
        console.log("Minted", INITIAL_SUPPLY / 10**18, "EUR tokens to:", INITIAL_HOLDER);

        // Log final balance
        uint256 balance = euro.balanceOf(INITIAL_HOLDER);
        console.log("Final balance:", balance / 10**18, "EUR");

        vm.stopBroadcast();
    }
}
