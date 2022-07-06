pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 
import "@openzeppelin/contracts/access/AccessControl.sol";

/*
 This is proxy contract
 Hooked up to the current contract of Carbon Offsets that have expiry time 

*/
 
contract CarbonOffsetProtocol is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Carbon Offset Protocol Token Proxy", "COP") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
    } 

    function mint(address to, uint256 amount) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not the minter");
        _mint(to, amount);
    } 
}   