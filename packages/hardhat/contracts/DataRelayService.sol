// SPDX-License-Identifier: MIT
// written by @tfius <3
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract DataRelayService {
    address public owner; // service provider
    address public beneficiary; // data owner
    IERC20 public bzzToken;

    uint256 private constant FEE_PRECISION = 1e5;  
    uint256 public marketFee = 10000; // 10%
    uint256 public feesCollected = 0;

    mapping(address => uint256) public payments;

    event PaymentReceived(address indexed user, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _bzzTokenAddress) {
        owner = msg.sender;
        beneficiary = msg.sender;
        bzzToken = IERC20(_bzzTokenAddress);
    }

    function getFee(uint256 _fee, uint256 amount) public pure returns (uint256) {
        return (amount * _fee) / FEE_PRECISION;
    }
    function setFee(uint256 newFee) onlyOwner public  {
        marketFee = newFee; 
    }

    function payForService(uint256 amount) public {
        uint256 feeAmount = amount * marketFee / FEE_PRECISION;
        require(bzzToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        require(bzzToken.transfer(address(beneficiary), feeAmount), "Fee failed");

        feesCollected += feeAmount;
        payments[msg.sender] += amount;
        emit PaymentReceived(msg.sender, amount);
    }

    function verifyPayment(address user, uint256 amount) external view returns (bool) {
        return payments[user] >= amount;
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= bzzToken.balanceOf(address(this)), "Insufficient balance");
        require(bzzToken.transfer(owner, amount), "Transfer failed");
        emit Withdrawn(owner, amount);
    }

    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    function changeBeneficiary(address newBeneficiary) external onlyOwner {
        require(newBeneficiary != address(0), "Invalid address");
        beneficiary = newBeneficiary;
    }

    // Additional function to handle emergency situation
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = bzzToken.balanceOf(address(this));
        require(bzzToken.transfer(owner, balance), "Transfer failed");
        emit Withdrawn(owner, balance);
    }
}
