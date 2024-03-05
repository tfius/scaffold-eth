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
    IERC20 public erc20Token;

    uint256 private constant FEE_PRECISION = 1e5;  
    uint256 public marketFee = 10000; // 10%
    uint256 public feesCollected = 0;

    //mapping(address => uint256) public payments;
    mapping(address => mapping(bytes32 => uint256)) public confirmations;
    mapping(address => bytes32[]) public confirmationsList;

    mapping(address => mapping(bytes32 => uint256)) public payments;
    mapping(address => bytes32[]) public paymentDigests;
    //mapping(address => bytes32[]) public payments;

    event PaymentReceived(address indexed user, address indexed dataOwner, uint256 amount);
    event PaymentForStorage(address indexed user, uint256 size, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _erc20TokenAddress) {
        owner = msg.sender;
        beneficiary = msg.sender;
        erc20Token = IERC20(_erc20TokenAddress);
    }

    function getFee(uint256 _fee, uint256 amount) public pure returns (uint256) {
        return (amount * _fee) / FEE_PRECISION;
    }
    function setFee(uint256 newFee) onlyOwner public  {
        marketFee = newFee; 
    }

    fallback() external payable {
        // This function is executed on a call to the contract if none of
        // the other functions match the given function identifier
    }

    receive() external payable {
        // This function is executed on a plain Ether transfer (i.e., for any call with empty calldata)
    }

    function payForDownloadInEth(bytes32 paymentConfirmationId, uint256 amount) public payable {
        uint256 feeAmount = amount * marketFee / FEE_PRECISION;
        require(msg.value >= amount, "Insufficient amount");
        payable(beneficiary).transfer(amount-feeAmount);
        payable(owner).transfer(feeAmount);
        feesCollected += feeAmount;
        
        confirmations[msg.sender][paymentConfirmationId] = amount;
        confirmationsList[msg.sender].push(paymentConfirmationId);
        
        emit PaymentReceived(msg.sender, beneficiary, amount);
    }

    function payForDownloadForOwnerInEth(bytes32 paymentConfirmationId, address dataOwner, uint256 amount) public payable {
        uint256 feeAmount = amount * marketFee / FEE_PRECISION;
        require(msg.value >= amount, "Insufficient amount");
        payable(dataOwner).transfer(amount-feeAmount);
        payable(owner).transfer(feeAmount);
        feesCollected += feeAmount;
        
        confirmations[msg.sender][paymentConfirmationId] = amount;
        confirmationsList[msg.sender].push(paymentConfirmationId);
        
        emit PaymentReceived(msg.sender, dataOwner, amount);
    }

    function payForStorage(bytes32 digest, uint256 size, uint256 amount) public payable {
        uint256 feeAmount = amount * marketFee / FEE_PRECISION;
        require(msg.value >= amount, "Insufficient amount");
        payable(beneficiary).transfer(amount-feeAmount);
        payable(owner).transfer(feeAmount);
        feesCollected += feeAmount;

        payments[msg.sender][digest] = amount;
        paymentDigests[msg.sender].push(digest);

        emit PaymentForStorage(msg.sender, size, amount);
    }

    // function verifyPayment(address user, uint256 amount) external view returns (bool) {
    //     return payments[user] >= amount;
    //}

    /*function verifyConfirmation(address user, bytes32 confirmationId) external view returns (uint) {
        return confirmations[user][confirmationId];
    }*/

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= erc20Token.balanceOf(address(this)), "Insufficient balance");
        require(erc20Token.transfer(owner, amount), "Transfer failed");
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
        // transfer all eth to owner
        if(address(this).balance > 0)
           payable(owner).transfer(address(this).balance);

        uint256 balance = erc20Token.balanceOf(address(this));
        // transfer all tokens to owner
        require(erc20Token.transfer(owner, balance), "Transfer failed");
        emit Withdrawn(owner, balance);
    }
}
