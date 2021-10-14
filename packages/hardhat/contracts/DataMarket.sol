//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

//import "./NFTCollection.sol";
import "hardhat/console.sol";  


interface INFTCollection {
    function mintForUser(address creator, uint256 rank, address to, bytes32 metadataSwarmLocation, bytes32 tokenDataSwarmLocation) external;
    function allTokensFrom(address _owner) external view returns (uint256[] memory);
    function ownerOfTokenOfData(bytes32 dataHash) external view returns (address);
    function tokenOfData(bytes32 dataHash) external view returns (uint256);
    function setMinter(address newMinter) external;

    function challengedFor(uint256 tokenId, uint256 amount) external;
    function unslashToken(uint256 tokenId) external;
    function slashToken(uint256 tokenId) external;

    function tokenCreator(uint256 tokenId) external view returns (address);
    function tokenAmount(uint256 tokenId) external view returns (uint256);
    function tokenChallenged(uint256 tokenId) external view returns (uint256);

    //IERC721Metadata 
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function getMetadata() external view returns (bytes32);

    //IERC20 
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool _approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}

contract DataMarket is Context, IERC20, IERC20Metadata {
    using SafeMath for uint256;
    address payable contractOwner;
    address payable contractTresury;
    
    uint256 private constant FEE = 50; // 0.05%
    uint256 private constant FEE_PRECISION = 1e5;
    
    struct Challenge
    {
        bytes32 hash; 
        address issuer; 
        address receiver; 
        uint256 points;
    }
    
    //uint256 internal                         _contractETHBalance;
    
    mapping(address => uint256) internal     _balances;
    mapping(address => uint256) internal     _imbalances;


    //mapping(address => uint256) internal     _approvedValidators;
    //mapping(address => address) internal     _validatorsAddedBy; 
    //address[]   private allValidators;
    
    //mapping(bytes32 => uint256) internal     challenges;
    //Challenge[] private allChallenges;

    INFTCollection[] private collections; 

    /* ERC20 */    
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    //address payable private _nftAddress;
    mapping (address => mapping (address => uint256)) private _allowances;
    // collectionIndex -> tokenId
    mapping (uint256 => mapping (uint256 => bool)) private _minted;                                  // Mapping did tokenId already mint
    
    event Bought(uint256 amount);
    event Sold(uint256 amount);

    /* create an ERC20 linked to ERC721 that can create new NFTs and mint them, those NFTS can mint ERC29 for value they have been created for */
    constructor (string memory name_, string memory symbol_, INFTCollection newCollection) payable {
        _name = name_;
        _symbol = symbol_;
        //_nftAddress = nftAddress_;
        
        contractOwner = payable(address(0)); //msg.sender);
        contractTresury = payable(address(0)); //payable(msg.sender);
        //addValidator(msg.sender, 1, address(0)); 

        //addCollection(name_, string(abi.encodePacked(symbol_, "C", collections.length)));
        addCollection(newCollection);
    }



    /* Get Collection at index*/
    function getCollection(uint256 index) public view returns (INFTCollection) {
        require(index<collections.length,"!collection");
        return collections[index];
    }
    /* Return all collections of this DataMarket*/
    function getCollections() public view virtual returns (INFTCollection[] memory) {
        return collections;
    }
    //function addCollection(string memory name_, string memory symbol_) public returns (INFTCollection) {
    function addCollection(INFTCollection newCollection) public returns (INFTCollection) {
        //INFTCollection newCollection = new INFTCollection(name_, string(abi.encodePacked(symbol_, "C", collections.length)));
        newCollection.setMinter(address(this)); // only if this contract can be a minter for collection 
        collections.push(newCollection); 
        return newCollection;
    }
  
    /* Owner can mint one token at the time*/
    function collectOne(uint256 collectionIndex, uint256 tokenId) public {
        require(_minted[collectionIndex][tokenId]==false,"Already minted"); 
        INFTCollection NFT = getCollection(collectionIndex); 
        require(NFT.tokenChallenged(tokenId)==0,"challenged"); 
        address tokenOwner = NFT.ownerOf(tokenId);
        require(tokenOwner==msg.sender,"!owner"); 
        uint256 amount = NFT.tokenAmount(tokenId);  
        _minted[collectionIndex][tokenId] = true;
        _mint(tokenOwner, amount);
        _imbalances[NFT.tokenCreator(tokenId)] -= amount; // reduce imbalance, dusting balance can occur if tokenId was challanged and slashed
    } 
    /* Owner mints all available tokens */
    function collectAll(uint256 collectionIndex) public {
        INFTCollection NFT = getCollection(collectionIndex); 
        uint256 amount = 0; 
        if(NFT.balanceOf(msg.sender)>0)
        {
          uint256[] memory tokens = NFT.allTokensFrom(msg.sender);
          for(uint256 i=0;i<tokens.length;i++)
          {
              uint256 tokenId = tokens[i];  
              if(_minted[collectionIndex][tokenId]==false && NFT.tokenChallenged(tokenId)==0)
              {
                uint256 tokenValue = NFT.tokenAmount(tokenId);  
                _minted[collectionIndex][tokenId] = true;
                _imbalances[NFT.tokenCreator(tokenId)] -= (tokenValue); // dusting balance 
                amount += tokenValue;
              }
          }
          _mint(msg.sender, amount);
        }        
    }
    /* @dev amount available to mint */
    function collectInfo(uint256 collectionIndex, address account) public view returns (uint256) {
        INFTCollection NFT = getCollection(collectionIndex); 
        uint256 amount = 0; 
        if(NFT.balanceOf(account)>0)
        {
          uint256[] memory tokens = NFT.allTokensFrom(account);
          for(uint256 i=0;i<tokens.length;i++)
          {
              uint256 tokenId = tokens[i]; 
              if(_minted[collectionIndex][tokenId]==false && NFT.tokenChallenged(tokenId)==0)
                  amount += NFT.tokenAmount(tokenId);
          }
        }
        return amount;
    }
    /* see if token with this id was minted what is balance  Returns true or false and NFT token value */ 
    function tokenMinted(uint256 collectionIndex, uint256 tokenId) public view returns (bool) {
        return (_minted[collectionIndex][tokenId]); 
    }
    /* see if token with this id was minted what is balance Returns true or false and NFT token value */ 
    /*function tokenChallenged(uint256 tokenId) public view returns (uint256) {
        Collection NFT = Collection(_nftAddress); 
        return NFT.tokenChallenged(tokenId);  
    }*/
    /* @dev returns balance of se */
    /*function balanceOfNFT(address from) public view returns (uint256) {
        Collection NFT = Collection(_nftAddress); 
        return NFT.balanceOf(from);
    }*/
    /* @dev amount available to mint */
    /*function tokenIds(address from) public view returns (uint256[] memory) {
        Collection NFT = Collection(_nftAddress); 
        return NFT.allTokensFrom(from);
    }*/

    /* get ERC20 name */
    function name() public view virtual override returns (string memory) {
        return _name;
    }
    /* get ERC20 symbol */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }
    /* get ERC20 decimals */
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }    
    /* See {IERC20-totalSupply}. */
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }
    /* get balance for account */
    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }
    /* how imbalance of much user has dusted*/
    function imbalanceOf(address account) public view virtual returns (uint256) {
        return _imbalances[account];
    }
    /* @dev transfer tokens */
    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }
    /* @dev set allowance */
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }
    /* @dev approve spender */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }
    /* @dev transfer from */
    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _approve(sender, _msgSender(), currentAllowance - amount);

        return true;
    }
    /* @dev increase Allowance */
    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
        return true;
    }
    /* @dev decrease Allowance */
    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        uint256 currentAllowance = _allowances[_msgSender()][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        _approve(_msgSender(), spender, currentAllowance - subtractedValue);

        return true;
    }
    /* @dev transfer */
    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        //INFTCollection NFT = INFTCollection(_nftAddress); 
        //require(NFT.balanceOf(sender)>0, "ERC20: no transfer without nft"); // if sender has NFT

        //_beforeTokenTransfer(sender, recipient, amount); 

        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
    }
    /* @dev mint token */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");
        //_beforeTokenTransfer(address(0), account, amount);
        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }
    /* @dev burn amount of tokens */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");
        //_beforeTokenTransfer(account, address(0), amount);
        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        _balances[account] = accountBalance - amount;
        _totalSupply -= amount;
        emit Transfer(account, address(0), amount);
    }
    /* @dev approve spender for amount */
    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    /*function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual { 
        
    }*/
    /* return ETH balance of this contract */ 
    /*function balanceContract() public view  returns (uint256) {
        return _contractETHBalance; //address(this).balance;
    }*/
    function balance() public view  returns (uint256) {
        return address(this).balance; //address(this).balance;
    }
    /* return price of one token */
    /*function priceOfOne() internal view returns (uint256) {
        require(balance()!=0 && totalSupply()!=0,"no value in market"); 
        return balance() / totalSupply(); // invalid if totalSupply == 0
    }*/
    /* Get fee */
    function getFee(uint256 tokenAmount) public pure returns (uint256) {
        uint256 fee = tokenAmount.mul(FEE) / FEE_PRECISION;
        return fee;
    }
    /*
    // Get price for tokenAmount 
    function sellPrice(uint256 tokenAmount) public view returns (uint256) {
        //return ((tokenAmount-getFee(tokenAmount)) * priceOfOne());
        return tokenAmount * priceOfOne();
    }
    // Get price for tokenAmount 
    function buyPrice(uint256 amount) public view returns (uint256) {
        return ((amount-getFee(amount)) / priceOfOne());
    }*/
    receive () external payable  {  
        buy();
    }
    function buy() public payable {
       require(msg.value>0,"!value"); 
       uint256 fee = getFee(msg.value);
       uint256 amount = msg.value-fee;
       
       //payable(contractOwner).transfer(amount); // not a fair market
       payable(contractTresury).transfer(fee);    // fees go to treasury
       //_contractETHBalance += amount;
       _mint(msg.sender, amount);
       emit Bought(amount);
    }
    function sell(uint256 tokenAmount) public payable {
        require(_balances[msg.sender]>=tokenAmount,"No balance");
        
        uint256 fee = getFee(tokenAmount);
        uint256 amount = tokenAmount-fee;

        payable(msg.sender).transfer(amount); // send ETH to seller
        payable(contractTresury).transfer(fee);   // fees go to treasury
        //_contractETHBalance -= tokenAmount;
        _burn(msg.sender, tokenAmount); // first send, then burn 
        emit Sold(tokenAmount);
    }
    /* in case someone sent tokens to this contract they can be salvaged by treasury or owner*/
    function salvageToken(address to, address _token, uint256 _amount) public {
        require(_token != address(this), "you can't transfer market tokens"); // this is meant only for misplaced tokens that were sent to this contract address 
        require(msg.sender==contractOwner || msg.sender==contractTresury, "!owner !treasury");
        IERC20(_token).approve(address(this), _amount);
        IERC20(_token).transferFrom(address(this), to, _amount); // this could also go to some DEX and be exchanged for whatever
    }
    /* Get balance of token dataMarket contract has */
    function salvageTokenBalanceOf(address _address) public view returns (uint256) {
        return IERC20(_address).balanceOf(address(this));
    }
    /* set treasury receiver */
    function setTreasury(address newTreasury) public  {
        if(contractTresury==address(0))
        {
            contractTresury = payable(newTreasury);
            return;
        }
        require(msg.sender==contractOwner || msg.sender==contractTresury, "!owner !treasury");
        contractTresury = payable(newTreasury);
    }
        /* get treasury receiver */
    function getTreasury() public view returns (address) {
        return contractTresury;
    }
    function setOwner(address newOwner) public {
        if(contractOwner==address(0))
        {
            contractOwner = payable(newOwner);
            return;
        }
        require(msg.sender==contractOwner,"Not an owner");
        contractOwner = payable(newOwner);
    }

    
    /* Create a token with token amount at metadatalocation and data location on swarm*/
    function createDataToken(uint256 collectionIndex, address to, uint256 forTokenAmount, bytes32 metadataSwarmLocation, bytes32 tokenDataSwarmLocation) public {
         //_burn(msg.sender, forTokenAmount); 
         require(_balances[msg.sender] >= forTokenAmount, "ERC20: amount exceeds balance");
         INFTCollection NFT = getCollection(collectionIndex); 

         _balances[msg.sender] -= (forTokenAmount);
         _imbalances[msg.sender] += (forTokenAmount); 
         NFT.mintForUser(msg.sender, forTokenAmount, to, metadataSwarmLocation, tokenDataSwarmLocation);
    }
    function collectionMetadata(uint256 collectionIndex) public view returns (bytes32)
    {
        INFTCollection NFT = getCollection(collectionIndex); 
        return NFT.getMetadata();
    }

    /*
    // Existing validators can add validators, only first level validators can add validators
    function validatorAdd(address validator) public
    {
        uint256 rank = validatorRank(msg.sender);
        require(_approvedValidators[validator]==0,"Already added");
        validatorAdd(validator, rank+1, msg.sender); 
    }
    // Add validator with rank and by which validator it was added 
    function validatorAdd(address validator, uint256 validatorType, address validatorAddedBy) internal
    {
        _approvedValidators[validator] = validatorType;
        _validatorsAddedBy[validator] = validatorAddedBy;
        allValidators.push(validator);
    }
    // get all validators 
    function validators() public view returns (address[] memory) 
    {
        return allValidators;
    }
    // returns if forAddress is a validator and what type it is 0 - normal user, 1 - first validator, 2,3,4 ... - validator
    function validatorRank(address forAddress) public view returns (uint256)
    {
        return _approvedValidators[forAddress];
    }    
    */


    /*
    // Issue a challenge for amount and datahash
    function issueChallenge(uint256 collectionIndex, address receiver, uint256 forAmount, bytes32 challengeHash) public 
    {
        require(receiver != address(0), "!receiver");
        require(challenges[challengeHash]==0,"challenge exists");
        require(_balances[msg.sender]>=forAmount,"!balance");
        
        INFTCollection NFT = INFTCollection(_nftAddress); 
        address owner = NFT.ownerOfTokenOfData(challengeHash); //
        require(receiver==owner,"token owner !receiver");
        uint256 tokenId = NFT.tokenOfData(challengeHash);
        uint256 tokenAmount = NFT.tokenAmount(tokenId);
        require(tokenAmount>=forAmount,"token owner !receiver");
        require(NFT.tokenChallenged(tokenId)==0,"already challenged");
        
        Challenge memory c = Challenge({hash:challengeHash, issuer:msg.sender, receiver: receiver, points: forAmount }); //, createdAt: block.timestamp});
        
        NFT.challengedFor(tokenId, c.points);
        
        _balances[msg.sender] -= forAmount;
        _imbalances[msg.sender] += forAmount;

        allChallenges.push(c);
        challenges[challengeHash] = allChallenges.length; // 1, never 0
    }
    // resolve challenge 
    function resolveChallenge(uint256 collectionIndex, bytes32 challengeHash, bool isRejected) public 
    {
        require(challenges[challengeHash]!=0,"!challenge");
        require(_approvedValidators[msg.sender]>0,"Not a validator"); // cant approve challenge if not validator
        
        uint256 challengeIndex = challenges[challengeHash]-1;
        Challenge memory c = allChallenges[challengeIndex]; 
        require(_approvedValidators[msg.sender]<_approvedValidators[c.issuer] ,"Not a validator"); // has to be higher rank than issuer so 1 beats 2 and 2 beats 3 and so on, 0 validator is not validator
        
        INFTCollection NFT = INFTCollection(_nftAddress); 
        uint256 tokenId = NFT.tokenOfData(challengeHash);
        require(NFT.tokenChallenged(tokenId)!=0,"already challenged");

        _imbalances[c.issuer] -= c.points;
        
        if(isRejected) // return funds to issuer 
        {
            uint256 fee = getFee(c.points); 
            _balances[c.issuer] += (c.points-fee);
            _balances[msg.sender] += fee;            
            NFT.slashToken(tokenId); // token amount is slashed for challengedAmount
        } 
        else // not rejected
        {
            uint256 fee = getFee(c.points); 
            _balances[c.receiver] += (c.points-fee);
            _balances[msg.sender] += fee;
            NFT.unslashToken(tokenId); // token is unslashed
        }

        removeChallenge(challengeIndex);
    }
    // remove challenge 
    function removeChallenge(uint256 challengeIndex) internal 
    {
        uint256 lastIndex = allChallenges.length - 1;
        Challenge memory lastChallenge = allChallenges[lastIndex];
        allChallenges[lastIndex] = allChallenges[challengeIndex]; // swap last challenge to be deleted position
        challenges[lastChallenge.hash] = challengeIndex;          // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete allChallenges[challengeIndex];
        allChallenges.pop();         
    }
    // challenge for if it exists 
    function getChallengeFor(bytes32 challengeHash) public view returns (Challenge memory) 
    {
        return allChallenges[challenges[challengeHash]-1];
    }
    // num challenges 
    function getChallengeNum() public view returns (uint256) 
    {
        return allChallenges.length;
    }
    // challenge by index 
    function getChallengeIdx(uint256 index) public view returns (Challenge memory) 
    {
        return allChallenges[index];
    } */
}