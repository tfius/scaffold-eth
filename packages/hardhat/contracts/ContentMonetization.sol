// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.0;

contract ContentMonetization {
    struct Content {
        address creator;
        uint256 price;
        bool isSubscriptionBased;
        mapping(address => uint256) subscribers;
    }

    mapping(uint256 => Content) public contents;
    uint256 public nextContentId;

    event ContentCreated(uint256 indexed contentId, address indexed creator, uint256 price, bool isSubscriptionBased);
    event Subscribed(uint256 indexed contentId, address indexed subscriber);
    event PaidForContent(uint256 indexed contentId, address indexed payer);

    function createContent(uint256 price, bool isSubscriptionBased) public {
        uint256 contentId = nextContentId++;
        Content storage newContent = contents[contentId];
        newContent.creator = msg.sender;
        newContent.price = price;
        newContent.isSubscriptionBased = isSubscriptionBased;
        emit ContentCreated(contentId, msg.sender, price, isSubscriptionBased);
    }

    function subscribe(uint256 contentId) public payable {
        Content storage content = contents[contentId];
        require(content.isSubscriptionBased, "Content is not subscription based");
        require(msg.value >= content.price, "Insufficient payment");

        content.subscribers[msg.sender] = block.timestamp;  // Timestamp of subscription
        emit Subscribed(contentId, msg.sender);
    }

    function payForContent(uint256 contentId) public payable {
        Content storage content = contents[contentId];
        require(!content.isSubscriptionBased, "Content is subscription based");
        require(msg.value >= content.price, "Insufficient payment");

        payable(content.creator).transfer(msg.value);
        emit PaidForContent(contentId, msg.sender);
    }

    // Additional functions for withdrawing funds, managing subscriptions, etc.
}
