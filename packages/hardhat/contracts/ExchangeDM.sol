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
    uint256 expiration;          // When the order expires

    bytes32 tokenHash;     // needed to remove from category list
    uint    orderIndex;    // Pointer to the order in the list
    uint    sellerIndex;   // Pointer to the order in the sellers list
    uint    categoryIndex; // Pointer to the order in the category list 
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
  mapping(bytes32 => uint256)    public categoryToIndex;    // orders per seller

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

  function sell(address _seller, bytes32 _category, address _nftCollection, uint256 _tokenId, uint256 _askPrice, 
                           address[] memory _feeRecipients, uint256[] memory _feeAmounts) public returns (uint256 orderId) {
     require(msg.sender==ERC721(_nftCollection).ownerOf(_tokenId), "not owner");
     if (_feeRecipients.length != _feeAmounts.length) {
      revert InvalidArrays();
    }

     bytes32 tokenHash = getTokenHash(_nftCollection, _tokenId);
     require(hashToOrder[tokenHash]==0x0, "already listed");
     uint256 idx = orders.length;

     hashToOrder[tokenHash] = idx; // order added to category's order list
     sellerOrders[_seller].push(idx); // order added to seller's order list
     categoryOrders[_category].push(idx); // order added to categoryOrders's order list

     if(categoryToIndex[_category] == 0) // add category if it doesn't exist
     {
        categories.push(_category);
        categoryToIndex[_category] = categories.length;
     }
     
     orders.push(Order({
       seller: _seller,
       nftCollection: _nftCollection,
       tokenId: _tokenId,
       askPrice: _askPrice,
       category: _category,
       feeRecipients: _feeRecipients,
       feeAmounts: _feeAmounts,
       expiration: block.timestamp + (84600*30), // 30 days from now

       tokenHash: tokenHash,
       orderIndex: idx,
       sellerIndex: sellerOrders[_seller].length - 1,
       categoryIndex: categoryOrders[_category].length - 1
     }));

     // must be approved
     ERC721(_nftCollection).safeTransferFrom(msg.sender, address(this), _tokenId, "");
  }
  function buy(bytes32 _tokenHash) public payable returns(bool success) 
  {
      Order memory order = orders[hashToOrder[_tokenHash]];
      uint amount = order.askPrice;
      require(msg.value >= amount, "not enough funds");
      // check expiriy time (TODO)

      if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount); // send back whats more then list price 
      }
      if (amount > 0) {
            payable(order.seller).transfer(amount); // send rest to BENEFICIARY
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

    uint256 idx = hashToOrder[_tokenHash];               // ie 4
    Order memory  order       = orders[idx];             // ie 4
    Order storage orderToMove = orders[orders.length-1]; // last order in the list

    uint  toReplace  = hashToOrder[order.tokenHash]; // ie 5 index of the order to replace
    hashToOrder[orderToMove.tokenHash] = toReplace;

    orderToMove.orderIndex    = order.orderIndex;
    orderToMove.sellerIndex   = order.sellerIndex; 
    orderToMove.categoryIndex = order.categoryIndex; 
    orders[toReplace] = orderToMove;

    _removeSellerOrders(order.seller, order.sellerIndex);
    _removeCategoryOrders(order.category, order.categoryIndex);

    orders.pop();

    hashToOrder[order.tokenHash] = 0x0;

    emit OrderRemoved(_tokenHash, order.seller);
    return true;
  }
  function _removeSellerOrders(address seller, uint index) internal returns (uint256) {
    require(index < sellerOrders[seller].length);
    uint256 prevIndex = sellerOrders[seller][sellerOrders[seller].length-1];
    sellerOrders[seller][index] = prevIndex;
    sellerOrders[seller].pop();
    return prevIndex;
  }
  function _removeCategoryOrders(bytes32 category, uint index) internal returns (uint256) {
    require(index < categoryOrders[category].length);
    uint256 prevIndex = categoryOrders[category][categoryOrders[category].length-1];
    categoryOrders[category][index] = prevIndex;
    categoryOrders[category].pop();
    return prevIndex;
  }
  /*function _removeOrder(uint256 index) internal {
    require(index < orders[index].length);
    orders[index] = orders[orders[index].length-1];
    orders.pop();
  }*/
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

   // to receive ERC721 tokens
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