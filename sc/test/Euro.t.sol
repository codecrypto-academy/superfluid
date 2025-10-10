// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Euro.sol";

contract EuroTest is Test {
    Euro public euro;
    address public owner;
    address public alice;
    address public bob;

    function setUp() public {
        owner = address(this);
        alice = address(0x1);
        bob = address(0x2);

        euro = new Euro();
    }

    function testDeployment() public view {
        assertEq(euro.name(), "Euro Stablecoin");
        assertEq(euro.symbol(), "EUR");
        assertEq(euro.decimals(), 18);
        assertEq(euro.totalSupply(), 0);
    }

    function testMint() public {
        uint256 amount = 1000 * 10**18;

        euro.mint(alice, amount);

        assertEq(euro.balanceOf(alice), amount);
        assertEq(euro.totalSupply(), amount);
    }

    function testMintMultiple() public {
        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 2000 * 10**18;

        euro.mint(alice, amount1);
        euro.mint(bob, amount2);

        assertEq(euro.balanceOf(alice), amount1);
        assertEq(euro.balanceOf(bob), amount2);
        assertEq(euro.totalSupply(), amount1 + amount2);
    }

    function testOnlyOwnerCanMint() public {
        uint256 amount = 1000 * 10**18;

        // Try to mint as non-owner (should fail)
        vm.prank(alice);
        vm.expectRevert();
        euro.mint(alice, amount);

        // Mint as owner (should succeed)
        euro.mint(alice, amount);
        assertEq(euro.balanceOf(alice), amount);
    }

    function testBurn() public {
        uint256 mintAmount = 1000 * 10**18;
        uint256 burnAmount = 300 * 10**18;

        // Mint tokens to alice
        euro.mint(alice, mintAmount);

        // Alice burns some tokens
        vm.prank(alice);
        euro.burn(burnAmount);

        assertEq(euro.balanceOf(alice), mintAmount - burnAmount);
        assertEq(euro.totalSupply(), mintAmount - burnAmount);
    }

    function testTransfer() public {
        uint256 amount = 1000 * 10**18;
        uint256 transferAmount = 300 * 10**18;

        // Mint to alice
        euro.mint(alice, amount);

        // Alice transfers to bob
        vm.prank(alice);
        euro.transfer(bob, transferAmount);

        assertEq(euro.balanceOf(alice), amount - transferAmount);
        assertEq(euro.balanceOf(bob), transferAmount);
    }

    function testApproveAndTransferFrom() public {
        uint256 amount = 1000 * 10**18;
        uint256 transferAmount = 300 * 10**18;

        // Mint to alice
        euro.mint(alice, amount);

        // Alice approves bob
        vm.prank(alice);
        euro.approve(bob, transferAmount);

        assertEq(euro.allowance(alice, bob), transferAmount);

        // Bob transfers from alice to himself
        vm.prank(bob);
        euro.transferFrom(alice, bob, transferAmount);

        assertEq(euro.balanceOf(alice), amount - transferAmount);
        assertEq(euro.balanceOf(bob), transferAmount);
        assertEq(euro.allowance(alice, bob), 0);
    }

    function testMintLargeAmount() public {
        uint256 largeAmount = 10_000_000 * 10**18; // 10 million EUR

        euro.mint(alice, largeAmount);

        assertEq(euro.balanceOf(alice), largeAmount);
        assertEq(euro.totalSupply(), largeAmount);
    }

    function testOwnership() public view {
        assertEq(euro.owner(), owner);
    }
}
