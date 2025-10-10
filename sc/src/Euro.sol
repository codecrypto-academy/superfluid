// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Euro
 * @dev ERC20 stablecoin representing EUR
 */
contract Euro is ERC20, Ownable {
    constructor() ERC20("Euro Stablecoin", "EUR") Ownable(msg.sender) {
        // Initial supply is 0, owner can mint tokens
    }

    /**
     * @dev Mint new EUR tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint (in wei)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn EUR tokens
     * @param amount Amount of tokens to burn (in wei)
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Returns the number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
