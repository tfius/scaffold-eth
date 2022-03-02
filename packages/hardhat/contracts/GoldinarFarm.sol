// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// n = (staked/(sum of all staked)) * reward; 

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Goldinar.sol";
/*
import "./JackOLantern.sol";
import "./Lottery.sol";
*/ 
/// @title Pmkn Farm
/// @author Andrew Fleming
/// @notice This contract creates a simple yield farming dApp that rewards users for
///         locking up their DAI stablecoin with a new ERC20 token GoldKryptonite
/// @dev The inherited GoldKryptonite contract automatically mints PMKN when the user invokes the
///      withdrawYield function. The calculateYieldTime and calculateYieldTotal function 
///      takes care of all yield calculations. Ownership of the GoldKryptonite contract should 
///      be transferred to the GoldKryptonite contract after deployment
contract GoldinarFarm is ReentrancyGuard { 
    
    // userAddress => stakingBalance
    mapping(address => uint256) public stakingBalance;
    // userAddress => isStaking boolean
    mapping(address => bool) public isStaking;
    // userAddress => timeStamp
    mapping(address => uint256) public startTime;
    // userAddress => goldinarBalance
    // mapping(address => uint256) public goldinarBalance;
    // tokenURI => nftCount
    //mapping(string => uint256) public nftCount;    

    string public   name = "Goldinar Farm";
    address public  owner;
    IERC20 public   dmToken;
    Goldinar public goldinarToken; 

    uint256 public rate = 864000;    // cca 100% in a day 
    uint256 public totalStaked = 0;  // 
    /*
    Human readable time	Seconds
        1 minute	60 seconds
        1 hour	3600 seconds
        1 day	86400 seconds
        1 month (30.44 days)	2629743 seconds
        1 year (365.24 days)	31556926 seconds
    */

    //uint256 public emmissionTime = 1 years; // 

    //JackOLantern public jackOLantern;
    //Lottery public lottery;
    //uint256 private nftPrice;

    event Stake(address indexed from, uint256 amount);
    event Unstake(address indexed from, uint256 amount);
    event YieldWithdraw(address indexed to, uint256 amount);
    event MintNFT(address indexed to, uint256 indexed tokenId);

    constructor(
        IERC20 _dmToken,
        Goldinar _goldinarToken //,
        //JackOLantern _jackOLantern,
        //Lottery _lottery,
        //uint256 _nftPrice
        ) {
            owner = msg.sender;
            dmToken = _dmToken;
            goldinarToken = _goldinarToken;
            //jackOLantern = _jackOLantern;
            //lottery = _lottery;
            //nftPrice = _nftPrice;
        }

    /// @notice Locks the user's DAI within the contract
    /// @dev If the user already staked DAI, the 
    /// @param amount Quantity of DAI the user wishes to lock in the contract
    function stake(uint256 amount) nonReentrant public {
        require(
            amount > 0 &&
            dmToken.balanceOf(msg.sender) >= amount, 
            "You cannot stake zero tokens");

        if(isStaking[msg.sender] == true){
            uint256 toTransfer = calculateYieldTotal(msg.sender);
            //goldinarBalance[msg.sender] = 0;
            goldinarToken.mint(msg.sender, toTransfer); // send earned to wallet
        }

        dmToken.transferFrom(msg.sender, address(this), amount);
        stakingBalance[msg.sender] += amount;
        startTime[msg.sender] = block.timestamp;
        isStaking[msg.sender] = true;

        totalStaked += amount; // DMs staked
        emit Stake(msg.sender, amount);
    }

    /// Retrieves funds locked in contract and sends them back to user
    /// @dev The yieldTransfer variable transfers the calculatedYieldTotal result to goldinarBalance
    ///      in order to save the user's unrealized yield
    function unstake() nonReentrant public {
        require(
            isStaking[msg.sender] = true, /*&&
            stakingBalance[msg.sender] >= balTransfer, */
            "Not staking"
        ); 
        uint256 yieldTransfer = calculateYieldTotal(msg.sender);
        startTime[msg.sender] = block.timestamp;
        uint staked = stakingBalance[msg.sender];

        totalStaked -= staked;

        stakingBalance[msg.sender] = 0;
        isStaking[msg.sender] = false;
        //goldinarBalance[msg.sender] = 0;

        dmToken.transfer(msg.sender, staked); // transfer staked dmTokens
        goldinarToken.mint(msg.sender, yieldTransfer);

        emit Unstake(msg.sender, staked);
    }

    /// @notice Helper function for determining how long the user staked
    /// @dev Kept visibility public for testing
    /// @param user The user
    function calculateYieldTime(address user) public view returns(uint256){
        uint256 end = block.timestamp; 
        uint256 totalTime = end - startTime[user];
        return totalTime;
    }
 
    /// @notice Calculates the user's yield while using a 86400 second rate (for 100% returns in 24 hours)
    /// @dev Solidity does not compute fractions or decimals; therefore, time is multiplied by 10e18
    ///      before it's divided by the rate. rawYield thereafter divides the product back by 10e18
    /// @param user The address of the user
    function calculateYieldTotal(address user) public view returns(uint256) {
        uint256 time = calculateYieldTime(user) * 10**18;
        //uint256 rate = 86400;
        uint256 timeRate = time / rate; // FIX: the longer you stake the less you gain 
        uint256 rawYield = (stakingBalance[user] * timeRate) / 10**18;
        return rawYield;
    }

    function setRate(uint256 newRate) public 
    {
        require(msg.sender==owner,"!o"); 
        rate = newRate;
    }

    
    // amount, totalstaked, goldinarsIssued
    function price(uint256 input_amount, uint256 input_reserve, uint256 output_reserve) public view returns (uint256) {
        uint256 input_amount_with_fee = input_amount * 997;
        uint256 numerator = input_amount_with_fee * output_reserve;

        uint256 denominator = (input_reserve * 1000) + input_amount_with_fee;
        //uint256 denominator = input_reserve.mul(1000).add(input_amount_with_fee);
        return numerator / denominator;
    }
    

    /// @notice Transfers accrued PMKN yield to the user
    /// @dev The if conditional statement checks for a stored PMKN balance. If it exists, the
    ///      the accrued yield is added to the accruing yield before the mint function is called
    function withdrawYield() public nonReentrant  {
        uint256 toTransfer = calculateYieldTotal(msg.sender);

        require(
            toTransfer > 0,  // ||
            //goldinarBalance[msg.sender] > 0,
            "Nothing to withdraw"
            );
        /*    
        if(goldinarBalance[msg.sender] != 0){
            uint256 oldBalance = goldinarBalance[msg.sender];
            goldinarBalance[msg.sender] = 0;
            toTransfer += oldBalance;
        }*/

        startTime[msg.sender] = block.timestamp;
        goldinarToken.mint(msg.sender, toTransfer);
        emit YieldWithdraw(msg.sender, toTransfer);
    } 

    /*
    /// @notice Calls the mintItem fuction from the JackOLantern contract which safeMints
    ///         an NFT for the user
    /// @dev Calls Lottery's addToLotteryPool function which is hardcoded to transfer
    ///      1 PMKN from the user to the Lottery contract (will add parameter to allow
    ///      for dynamically pricing NFTs). Calls the mintItem function from JackOLantern's
    ///      contract which invokes the ERC721 safeMint function. Updates nftCount mapping
    /// @param user The address of the user
    /// @param tokenURI The Uniform Resource Identifier (URI) for tokenId token
    function mintNFT(address user, string memory tokenURI) public {
        require(
            goldinarToken.balanceOf(msg.sender) >= nftPrice, 
            "Not enough PMKN"
        );
        lottery.addToLotteryPool(msg.sender, nftPrice);
        uint256 tokenId = jackOLantern.mintItem(user, tokenURI);
        nftCount[tokenURI]++;
        emit MintNFT(msg.sender, tokenId);
    }
    */
}