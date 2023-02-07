// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SwarmMail is Ownable, ReentrancyGuard  {
    // using Strings for uint256;

    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }
 
    modifier isRegistered() { 
        require(users[msg.sender].key != bytes32(0), "Email is not registred");
        _;
    }

    function getPublicKeys(address addr) public view returns (bool registered, bytes32 key, bytes32 smail) {
        registered = users[addr].key != bytes32(0) ;
        key = users[addr].key;
        smail = users[addr].smail;
    } 

    struct Email {
        bool isEncryption;
        uint256 time;
        address from;
        address to;
        bytes32 swarmLocation;
        bool    signed;
        //bytes uuid;
    }
    // subscription request
    struct SubRequest {
        address fdpBuyer;
        address buyer;
        bytes32 subHash; //which subscription;
        bytes32 requestHash;
    }
    // subscription items
    struct SubItem {
        bytes32 subHash;  // what subscription you are entitled to
        bytes32 unlockKeyLocation; // where is your key
        uint256 validTill; // until it is valid 
    }

    struct User {
        bytes32 key;
        bytes32 smail;
        // PublicKey pubkey;
        Email[] sentEmails;
        mapping(bytes32 => uint256) sentEmailIds;
        Email[] inboxEmails;
        mapping(bytes32 => uint256) inboxEmailIds;

        // who wants to subscribe to what
        SubRequest[] subRequests;
        mapping(bytes32 => uint256) subRequestIds;
        // what is user subscribed to
        SubItem[] subItems;
        mapping(bytes32 => uint256) subItemIds;

        bytes32[] listedSubs;
    }
    mapping(address => User) users;

    
    constructor() {
    }

    receive() external payable {}

    function register(bytes32 key, bytes32 smail) public {
        User storage user = users[msg.sender];
        require(user.key == bytes32(0), "Address is registered");
        user.key = key;
        user.smail = smail;
    }

    function getInbox(address addr) public view returns (Email[] memory mails) {
        mails = users[addr].inboxEmails;
    }

    function getSent(address addr) public view returns (Email[] memory mails) {
        mails  = users[addr].sentEmails;
    }
    function getSubRequests(address addr) public view returns (SubRequest[] memory requests) {
        requests = users[addr].subRequests;
    }
    function getSubItems(address addr) public view returns (SubItem[] memory items) {
        items = users[addr].subItems;
    }
    function getListedSubscriptions(address addr) public view returns (bytes32[] memory items) {
        items = users[addr].listedSubs;
    }

    function getBoxCount(address addr) public view returns (uint numInboxItems, uint numSentItems, uint numSubRequests, uint numSubItems) {
        numInboxItems = users[addr].inboxEmails.length;
        numSentItems  = users[addr].sentEmails.length;
        numSubRequests = users[addr].subRequests.length;
        numSubItems = users[addr].subItems.length;
    }

    function getInboxAt(address addr, uint index) public view returns (Email memory) {
        return users[addr].inboxEmails[index];
    }

    function getSentAt(address addr, uint index) public view returns (Email memory) {
        return users[addr].sentEmails[index];
    }

    function getSubRequestAt(address addr, uint index) public view returns (SubRequest memory) {
        return users[addr].subRequests[index];
    }

    function getSubItemAt(address addr, uint index) public view returns (SubItem memory) {
        return users[addr].subItems[index];
    }

    function signEmail(bytes32 swarmLocation) public {
        User storage u = users[msg.sender];
        require(u.inboxEmailIds[swarmLocation] != 0, "Email does not exist");
        Email storage email = u.inboxEmails[u.inboxEmailIds[swarmLocation] - 1];
        require(msg.sender == email.to, "Only receiver can sign email");
        email.signed = true;
    }

    function sendEmail( address toAddress, bool isEncryption, bytes32 swarmLocation ) public payable
    {
        User storage receiver = users[toAddress];
        require(!isEncryption || receiver.key != bytes32(0), "Unregistered users can only send unencrypted emails");
        User storage sender = users[msg.sender];
        // create email
        Email memory email;
        email.isEncryption = isEncryption;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = toAddress;
        email.swarmLocation = swarmLocation;

        // add email
        sender.sentEmails.push(email);
        sender.sentEmailIds[swarmLocation] = sender.sentEmails.length;
        receiver.inboxEmails.push(email);
        receiver.inboxEmailIds[swarmLocation] = receiver.inboxEmails.length;
        // write email
        // FlatDirectory fileContract = FlatDirectory(fromInfo.fdContract);
        // fileContract.writeChunk{value: msg.value}(getNewName(uuid, 'message'), 0, encryptData);
    }

    function removeSentEmail(bytes32 swarmLocation) public {
        User storage u = users[msg.sender];
        require(u.sentEmailIds[swarmLocation] != 0, "Email does not exist");

        uint256 removeIndex = u.sentEmailIds[swarmLocation] - 1;
        // remove info
        uint256 lastIndex = u.sentEmails.length - 1;
        if (lastIndex != removeIndex) {
            u.sentEmails[removeIndex] = u.sentEmails[lastIndex];
            u.sentEmailIds[u.sentEmails[lastIndex].swarmLocation] = removeIndex + 1;
        }
        u.sentEmails.pop();
        delete u.sentEmailIds[swarmLocation];
    }
    function removeInboxEmail(bytes32 swarmLocation) public {
        User storage u = users[msg.sender];
        require(u.inboxEmailIds[swarmLocation] != 0, "Email does not exist");

        uint256 removeIndex = u.inboxEmailIds[swarmLocation] - 1;
        // remove info
        uint256 lastIndex = u.inboxEmails.length - 1;
        if (lastIndex != removeIndex) {
            u.inboxEmails[removeIndex] = u.inboxEmails[lastIndex];
            u.inboxEmailIds[u.inboxEmails[lastIndex].swarmLocation] = removeIndex + 1;
        }
        u.inboxEmails.pop();
        delete u.inboxEmailIds[swarmLocation];
    }

    function removeEmails(uint256 types, bytes32[] memory swarmLocations) public {
        if(types == 1) {
            for (uint256 i; i < swarmLocations.length; i++) {
                removeInboxEmail(swarmLocations[i]);
            }
        } else {
            for (uint256 i; i < swarmLocations.length; i++) {
                removeSentEmail(swarmLocations[i]);
            }
        }
    }

    function fundsTransfer() onlyOwner public payable {
        payable(msg.sender).transfer((address(this).balance-inEscrow));
    }
    function fundsBalance() public view returns (uint256) {
        return address(this).balance;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    uint256 private constant FEE_PRECISION = 1e5;  
    uint256 private marketFee = 500; // 0.5%
    uint256 private minListingFee = 10000 gwei; // min listing fee
    uint256 public  feesCollected = 0;
    uint256 public  inEscrow = 0;
    function getFee(uint256 _fee, uint256 amount) public pure returns (uint256) {
        return (amount * _fee) / FEE_PRECISION;
    }
    function setFee(uint256 newFee) public  {
        require(msg.sender==owner(), "!");
        marketFee = newFee; 
    }
    function setListingFee(uint256 newListingFee) public  {
        require(msg.sender==owner(), "!");
        minListingFee = newListingFee; 
    }      

    // Sub listings
    struct Sub {
        bytes32 subHash;
        address fdpSeller; // 
        address seller;
        bytes32 swarmLocation;
        uint256 price;
        bool    active; // is subscription active
        uint64  bids;
        uint64  sells;
    }
    
    Sub[] subscriptions;
    mapping(bytes32 => uint256) subscriptionIds; 

    struct Category {
        bytes32    categoryHash;
        uint[]     subIdxs;
    }

    mapping(bytes32 => Category) categories; // where is category in categories array

    function getCategory(bytes32 category) public view returns (Category memory) {
        return categories[category];
    }
    function getSub(uint index) public view returns (Sub memory) {
        return subscriptions[index];
    }
    function getSubBy(bytes32 subHash) public view returns (Sub memory) {
        return subscriptions[subscriptionIds[subHash]];
    }
    function enableSub(bytes32 subHash, bool active) public {
        require(subscriptionIds[subHash] != 0, "No Sub"); // must exists
        Sub storage s = subscriptions[subscriptionIds[subHash] - 1]; 
        require(s.seller == msg.sender, "Sub Seller invalid"); // only seller can enable subscription
        s.active = active;
    }
    
    // Market to sell encrypted swarmLocation
    function listSub(address fdpSeller, bytes32 dataSwarmLocation, uint price, bytes32 category) public payable {
        bytes32 subHash = keccak256(abi.encode(msg.sender, fdpSeller, dataSwarmLocation, price, category, block.timestamp));
        require(msg.value>minListingFee, "listingFee"); // sent value must be equal to price

        Sub memory s = Sub(subHash, fdpSeller, msg.sender, dataSwarmLocation, price, true, 0, 0);
        subscriptions.push(s);
        subscriptionIds[subHash] = subscriptions.length;

        Category storage c = categories[category];
        c.subIdxs.push(subscriptions.length - 1);

        User storage seller = users[msg.sender];
        seller.listedSubs.push(subHash);
    }

    function bidSub(bytes32 subHash, address fdpBuyer) public nonReentrant payable {
        require(subscriptionIds[subHash] != 0, "No Sub"); // must exists
        Sub storage s = subscriptions[subscriptionIds[subHash] - 1]; 

        require(msg.value==s.price, "Value!=price"); // sent value must be equal to price
        require(s.active, "Inactive"); // must be active

        User storage seller = users[s.seller];
        bytes32 requestHash = keccak256(abi.encode(msg.sender, subHash, fdpBuyer, block.timestamp));
        require(seller.subRequestIds[requestHash] == 0, "Request exists");

        s.bids++;

        SubRequest memory sr;
        sr.fdpBuyer = fdpBuyer;
        sr.buyer = msg.sender;
        sr.subHash = subHash;
        sr.requestHash = requestHash;

        seller.subRequests.push(sr);
        seller.subRequestIds[requestHash] = seller.subRequests.length;
        inEscrow += msg.value;
    }

    function sellSub(bytes32 requestHash, bytes32 encryptedKeyLocation) public payable {
        User storage seller = users[msg.sender];

        require(seller.subRequestIds[requestHash] != 0, "No Request");
        SubRequest memory br = seller.subRequests[seller.subRequestIds[requestHash] - 1];

        require(subscriptionIds[br.subHash] != 0, "No Sub"); // must exists
        Sub storage s = subscriptions[subscriptionIds[br.subHash] - 1]; 
        require(msg.sender==s.seller, "Not SubSeller"); // sent value must be equal to price

        uint256 fee = getFee(marketFee, s.price);
        payable(msg.sender).transfer(s.price-fee);
        inEscrow -= s.price;
        feesCollected += fee;

        s.sells++;

        User storage buyer = users[br.buyer];
        SubItem memory si;
        si.subHash = br.subHash;
        si.unlockKeyLocation = encryptedKeyLocation;
        si.validTill = block.timestamp + 30 days;
        buyer.subItems.push(si);

        removeSubRequest(requestHash);
    }

    function removeSubItem(uint256 index) public {
        User storage u = users[msg.sender];
        require(index < u.subItems.length, "Invalid index");

        uint256 lastIndex = u.subItems.length - 1;
        if (lastIndex != index) {
            u.subItems[index] = u.subItems[lastIndex];
        }
        u.subItems.pop();
    }

    function removeSubRequest(bytes32 requestHash) public {
        User storage u = users[msg.sender];
        require(u.subRequestIds[requestHash] != 0, "No Request");

        uint256 removeIndex = u.subRequestIds[requestHash] - 1;
        // remove info
        uint256 lastIndex = u.subRequests.length - 1;
        if (lastIndex != removeIndex) {
            u.subRequests[removeIndex] = u.subRequests[lastIndex];
            u.subRequestIds[u.subRequests[lastIndex].requestHash] = removeIndex + 1;
        }
        u.subRequests.pop();
        delete u.subRequestIds[requestHash];
    }

    // // smail extend with market place
    // function buy(address seller, bytes32 swarmLocation) public payable {
    //     User storage u = users[seller];
    //     require(u.sentEmailIds[swarmLocation] != 0, "Email does not exist");
    //     Email storage email = u.sentEmails[u.sentEmailIds[swarmLocation] - 1];
    //     require(msg.sender == email.to, "Only receiver can buy email");
    //     require(email.isEncryption, "Email is not encrypted");
    //     require(!email.signed, "Email is already signed");
    //     require(msg.value > 0, "Value must be greater than 0");
    //     payable(seller).transfer(msg.value);
    // }
}