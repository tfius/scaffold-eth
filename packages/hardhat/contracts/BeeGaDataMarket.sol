// SPDX-License-Identifier: MIT
// written by @tfius
pragma solidity ^0.8.0;


contract DataMarket {
    struct Auction {
        address meganode; // Meganode that started the auction
        bytes32 dataHash; // Using bytes32 as a direct link to the data
        uint256 startBlock; // block number when auction started
        uint256 endBlock; // block number when auction ends
        uint256 startPrice; // initial price
        uint256 lowestPrice; // minimum price
        address highestBidder; // who is highest bidder
        uint256 highestBid; // amount of highest bid
        bool dataReceived; // Flag to confirm data receipt
        bool ended;
    }

    uint256 public epochLength;
    mapping(bytes32 => Auction) public auctions; // Mapping from dataHash to Auction

    // Event declarations
    event AuctionStarted(bytes32 indexed dataHash, uint256 startPrice, uint256 lowestPrice, uint256 startBlock, uint256 endBlock);
    event BidPlaced(bytes32 indexed dataHash, address bidder, uint256 amount);
    event AuctionEnded(bytes32 indexed dataHash, address winner, uint256 amount);
    event AuctionCancelled(bytes32 indexed dataHash);
    event DataReceiptConfirmed(bytes32 indexed dataHash, address recipient);

    constructor(uint256 _epochLength) {
        epochLength = _epochLength;
    }

    // Function to start a new auction by a Meganode, using dataHash as the auction identifier
    function startAuction(bytes32 _dataHash, uint256 _startPrice, uint256 _lowestPrice) external {
        require(auctions[_dataHash].meganode == address(0), "Auction already exists");

        auctions[_dataHash] = Auction({
            meganode: msg.sender,
            dataHash: _dataHash,
            startBlock: block.number,
            endBlock: block.number + (2 * epochLength),
            startPrice: _startPrice,
            lowestPrice: _lowestPrice,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            dataReceived: false
        });

        emit AuctionStarted(_dataHash, _startPrice, _lowestPrice, block.number, block.number + (2 * epochLength));
    }

    function isThereAuctionFor(bytes32 _dataHash) external view returns (bool) {
        return auctions[_dataHash].meganode != address(0);
    }

    function getAuctionDetails(bytes32 _dataHash) external view returns (Auction memory) {
        return auctions[_dataHash];
    }

    // Function to place a bid
    function placeBid(bytes32 _dataHash) external payable {
        Auction storage auction = auctions[_dataHash];
        require(block.number < auction.endBlock, "Auction has ended");
        require(msg.value >= auction.lowestPrice, "Bid must be at least the lowest price");
        require(msg.value > auction.highestBid, "There's already a higher or equal bid");
        
        // Return the previous highest bid
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        
        emit BidPlaced(_dataHash, msg.sender, msg.value);
    }

    // Function to end the auction and transfer data
    function endAuction(bytes32 _dataHash) external {
        Auction storage auction = auctions[_dataHash];
        require(block.number >= auction.endBlock, "Auction not yet ended");
        require(!auction.ended, "Auction already ended");
        auction.ended = true;

        // Transfer the funds to the Meganode
        payable(auction.meganode).transfer(auction.highestBid);

        emit AuctionEnded(_dataHash, auction.highestBidder, auction.highestBid);
    }

    // Additional functionalities like confirming receipt of data would still be managed off-chain
    
    // function for data receipt confirmation
    function confirmDataReceipt(bytes32 _dataHash) external {
        Auction storage auction = auctions[_dataHash];
        require(msg.sender == auction.highestBidder, "Only the winner can confirm receipt");
        require(auction.ended, "Auction has not ended");
        require(!auction.dataReceived, "Data receipt already confirmed");

        auction.dataReceived = true;
        // Transfer funds to the Meganode only after confirmation
        payable(auction.meganode).transfer(auction.highestBid);
        
        // Emit an event for the confirmation
        emit DataReceiptConfirmed(_dataHash, msg.sender);
    }


    // auction cancellation
    function cancelAuction(bytes32 _dataHash) external {
        Auction storage auction = auctions[_dataHash];
        require(msg.sender == auction.meganode, "Only the Meganode can cancel");
        require(!auction.ended, "Auction has already ended");
        require(auction.highestBid == 0, "Cannot cancel after bids are placed");

        auction.ended = true; // Prevents further bidding
        // No funds to refund since no bids were placed, but logic could be extended for that scenario
        
        // Emit an event for the cancellation
        emit AuctionCancelled(_dataHash);
    }
}
