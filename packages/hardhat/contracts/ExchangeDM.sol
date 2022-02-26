//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Goldinar.sol";

interface ERC721 {
  //function transferFrom(address from, address to, uint256 idOrAmount) external;
  //function transfer(address to, uint256 idOrAmount) external;
  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) external;
  function ownerOf(uint256 tokenId) external returns (address);
}

enum Status { Open, Executed, Canceled }

contract ExchangeDM is ReentrancyGuard, Ownable, AccessControl {
  bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
  // Three events so we can have more indexed fields
  event OrderExecuted(bytes32 indexed order, address indexed seller, address indexed buyer);
  event OrderCanceled(bytes32 indexed order, address indexed seller);
  event OrderRemoved(bytes32 indexed order, address indexed seller);
  error InvalidArrays();

   // Order structure
  struct Order {
    address seller;              // Seller's address
    address nftCollection;           // Token address that is being sold
    uint256 tokenId;             // ID or amount seller is requesting
    uint256 askPrice;            // price for token 
    bytes32 category;            // category of the order
    address[] feeRecipients;     // Array of who will receive fee for the trade
    uint256[] feeAmounts;        // Amount to be sent for respective fee recipient
    //uint256 expiration;          // When the order expires

    bytes32 tokenHash;     // needed to remove from category list
    uint    orderIndex;    // Pointer to the order in the list
    uint    sellerIndex;   // Pointer to the order in the sellers list
    uint    categoryIndex; // Pointer to the order in the category list 
    bool    sellable;
  }

  uint256 sellPrize = 1 ether;

  Goldinar public goldinarToken;
  constructor(Goldinar _goldinarToken) {
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
      goldinarToken=_goldinarToken;
  }  

  Order[] public orders;
  mapping(bytes32 => uint256)    public hashToOrder;    // orders per seller
  mapping(address => uint256[])  public sellerOrders;   // orders per seller 
  mapping(bytes32 => uint256[])  public categoryOrders; // orders per category

  bytes32[] public categories;
  mapping(bytes32 => uint256)    public categoryToIndex; 

  address payable public contractTresury;
  uint256 private constant FEE_PRECISION = 1e5;  
  uint256 private marketFee = 50; // 0.05%

  function setTreasury(address newTreasury) public  {
      if(contractTresury==address(0))
      {
          contractTresury = payable(newTreasury);
          return;
      }
      require(msg.sender==contractTresury, "!o");
      contractTresury = payable(newTreasury); 
  }


  function numOrders() public view returns (uint256) {
    return orders.length;
  }
  function numSellerOrders(address seller) public view returns (uint256) {
    return sellerOrders[seller].length;
  }
  function numCategoryOrders(bytes32 category) public view returns (uint256) {
    return categoryOrders[category].length;
  }
  function numCategories() public view returns (uint256) {
    return categories.length;
  }
  function getCategoryName(bytes32 category) public pure returns (string memory) {
    return string(bytes32string(category));
  }
  function bytes32ForCategoryName(string memory nameCategory) public pure returns (bytes32) {
    return stringToBytes32(nameCategory);
  }

  function sell(address _seller, bytes32 _category, address _nftCollection, uint256 _tokenId, uint256 _askPrice, 
                           address[] memory _feeRecipients, uint256[] memory _feeAmounts, bool _sellable) public returns (uint256 orderId) {
     require(msg.sender==ERC721(_nftCollection).ownerOf(_tokenId), "not owner");
     require(_feeRecipients.length == _feeAmounts.length,"arrays");

     bytes32 tokenHash = getTokenHash(_nftCollection, _tokenId);
     require(hashToOrder[tokenHash]==0x0, "already listed");
     //uint256 idx = orders.length;

     hashToOrder[tokenHash] = orders.length; // order added to category's order list
     sellerOrders[_seller].push(orders.length); // order added to seller's order list
     categoryOrders[_category].push(orders.length); // order added to categoryOrders's order list

     if(categoryToIndex[_category] == 0) // add category if it doesn't exist
     {
        categories.push(_category);
        categoryToIndex[_category] = categories.length-1;
     }
     
     orders.push(Order({
       seller: _seller,
       nftCollection: _nftCollection,
       tokenId: _tokenId,
       askPrice: _askPrice,
       category: _category,
       feeRecipients: _feeRecipients,
       feeAmounts: _feeAmounts,
       //expiration: block.timestamp + (84600*30), // 30 days from now
       tokenHash: tokenHash,
       orderIndex:    hashToOrder[tokenHash],
       sellerIndex:   sellerOrders[_seller].length - 1,
       categoryIndex: categoryOrders[_category].length - 1,
       sellable: _sellable
     }));

     // must be approved
     ERC721(_nftCollection).safeTransferFrom(msg.sender, address(this), _tokenId, "");
     return hashToOrder[tokenHash];
  }
  function buy(bytes32 _tokenHash) public payable returns(bool success) 
  {
      Order memory order = orders[hashToOrder[_tokenHash]];
      uint amount = order.askPrice;
      require(msg.value >= amount, "not enough funds");
      require(order.sellable, "not sellable");
      // check expiriy time (TODO)

      if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount); // send back whats more then list price 
      }
      if (amount > 0) {
          uint256 fee = getFee(marketFee, amount);
          payable(contractTresury).transfer(fee);    // fees go to treasury        
          payable(order.seller).transfer(amount-fee); // send rest to BENEFICIARY
      } 
      // TODO do fees here
      ERC721(order.nftCollection).safeTransferFrom(address(this), msg.sender, order.tokenId, "");
      emit OrderExecuted(order.tokenHash, order.seller, msg.sender);

      if(msg.sender!=order.seller) // don't give prize when same addresses
      {
        goldinarToken.mint(msg.sender, sellPrize); // send earned to wallet
        goldinarToken.mint(order.seller, sellPrize); // send earned to wallet
      }

      removeOrder(order.tokenHash);
      emit OrderExecuted(order.tokenHash, order.seller, msg.sender);
      return true;
  }

  function cancelOrder(bytes32 _tokenHash) nonReentrant public returns(bool success) 
  {
      Order memory order = orders[hashToOrder[_tokenHash]];
      require (order.seller == msg.sender || hasRole(REVIEWER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");

      ERC721(order.nftCollection).safeTransferFrom(address(this), msg.sender, order.tokenId, "");  
      removeOrder(_tokenHash);
      
      emit OrderCanceled(_tokenHash, order.seller);
      return true;
  }

  function removeOrder(bytes32 _tokenHash) internal returns (bool)
  {
    require(_tokenHash!=0x0, "invalid token hash");

    uint256     idx = hashToOrder[_tokenHash];  // ie 4
    Order memory  o = orders[idx];              // ie 4
    Order storage m = orders[orders.length-1];  // last order in the list

    uint  toReplace  = hashToOrder[o.tokenHash]; // ie 5 index of the order to replace
    hashToOrder[m.tokenHash] = toReplace;

    m.orderIndex    = o.orderIndex;
    //orderToMove.sellerIndex   = order.sellerIndex; 
    //orderToMove.categoryIndex = _removeCategoryOrders(order.category, order.categoryIndex); //order.categoryIndex; 

    _removeSellerOrders(o.seller, o.sellerIndex);
    if(m.seller==o.seller) // if same seller update m.sellerIndex
    {
      m.sellerIndex = o.sellerIndex;
    } else 
    {
      // update m.seller orders index
      sellerOrders[m.seller][m.sellerIndex] = o.orderIndex; 
    }

    // update m.category index
    // _removeCategoryOrders(o.category, o.categoryIndex); 
    if(m.category==o.category) // same category ? 
    {
      m.categoryIndex = o.categoryIndex;
    }
    else  // change value, while index stays the same
    {
      categoryOrders[m.category][m.categoryIndex] = o.orderIndex; // fix category index
    }

    // swap m to position of o
    orders[toReplace] = m;
    orders.pop();
    // //

    hashToOrder[o.tokenHash] = 0x0;

    emit OrderRemoved(_tokenHash, o.seller);
    return true;
  }
  function _removeSellerOrders(address seller, uint index) internal returns (uint256) {
    require(index < sellerOrders[seller].length, "sell idx");
    uint256 prevVal = sellerOrders[seller][sellerOrders[seller].length-1];
    sellerOrders[seller][index] = prevVal;
    sellerOrders[seller].pop();
    return prevVal;
  }
  function _removeCategoryOrders(bytes32 category, uint index) internal returns (uint256) {
    require(index < categoryOrders[category].length, "cat idx");
    uint256 prevVal = categoryOrders[category][categoryOrders[category].length-1];
    categoryOrders[category][index] = prevVal;
    categoryOrders[category].pop();
    return prevVal;
  }

  function getTokenHash(address nftCollection, uint256 tokenId) public pure returns (bytes32)
  {
    return  keccak256(abi.encodePacked(nftCollection,tokenId));
  }

  function setSellPrize(uint256 newAmount) public {
     require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(REVIEWER_ROLE, msg.sender), "Caller has no rights");
     sellPrize = newAmount;
  } 

  /**
   * @notice Will pay the fee recipients
   * @param _currency      Token used as currency for fee payment
   * @param _from          Address who will pay the fee
   * @param _feeRecipients Array of addresses to pay the fees to
   * @param _feeAmounts    Array of amount of fees to pay to each corresponding fee recipient
   * @return totalFeeAmount Total amount of fee paid
   */
  function _feePayment(address _currency, address _from, address[] memory _feeRecipients, uint256[] memory _feeAmounts) private returns (uint256 totalFeeAmount) {
    // Sanity check inputs
    if (_feeRecipients.length != _feeAmounts.length) {
      revert InvalidArrays();
    }

    // Transfer to fee recipients
    for (uint256 i = 0; i < _feeRecipients.length; i++) {
      totalFeeAmount -= _feeAmounts[i];
      // ERC20_ERC721(_currency).safeTransferFrom(_from, _feeRecipients[i], _feeAmounts[i]);
    }

    return totalFeeAmount;
  }
  function getFee(uint256 _fee, uint256 amount) public pure returns (uint256) {
    return (amount * _fee) / FEE_PRECISION;
  }
  function setFee(uint256 newFee) public  {
      require(msg.sender==contractTresury, "!rights");
      marketFee = newFee; 
  }  

  function stringToBytes32(string memory source) public pure returns (bytes32 result) {
      bytes memory tempEmptyStringTest = bytes(source);
      if (tempEmptyStringTest.length == 0) {
          return 0x0;
      }
      assembly {
          result := mload(add(source, 32))
      }
  }

  function bytes32string(bytes32 b32) public pure returns (string memory out) {
      bytes memory s = new bytes(64);

      for (uint i = 0; i < 32; i++) {
          bytes1 b = bytes1(b32[i]);
          bytes1 hi = bytes1(uint8(b) / 16);
          bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
          s[i*2]   = char(hi);
          s[i*2+1] = char(lo);            
      } 

      out = string(s);
  }
  function char(bytes1 b) internal pure returns (bytes1 c) {
      if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
      else return bytes1(uint8(b) + 0x57);
  }

   // to receive ERC721 tokens (does nothing, will be called by ERC721 tokens, 
   // ALWAYS use SELL function to sent tokens to this contract for exchange
  function onERC721Received(
      address operator,
      address from,
      uint256 tokenId,
      bytes calldata collectionIdData) external returns (bytes4) {

      /*uint256 tankId = toUint256(tankIdData);
      require(ownerOf(tankId) == from, "you can only add loogies to a tank you own.");
      loogiesById[tankId].push(loogieTokenId);

      bytes32 randish = keccak256(abi.encodePacked( blockhash(block.number-1), from, address(this), loogieTokenId, tankIdData  ));
      x[loogieTokenId] = uint8(randish[0]);
      y[loogieTokenId] = uint8(randish[1]);
      blockAdded[loogieTokenId] = block.number;*/ 

      return this.onERC721Received.selector;
    }

  /**
   * @notice Will self-destruct the contract
   * @dev This will be used if a vulnerability is discovered to halt an attacker
   * @param _recipient Address that will receive stuck ETH, if any
   */
 /* function NUKE(address payable _recipient) external onlyOwner {
    selfdestruct(_recipient);
  } */
}