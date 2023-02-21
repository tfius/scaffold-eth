// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract SwarmMail is Ownable, ReentrancyGuard, AccessControl  {
    // using Strings for uint256;

    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }
 
    modifier isRegistered() { 
        require(users[msg.sender].key != bytes32(0), "User not registred");
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
    // active Bid
    struct ActiveBid {
        address seller;
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

        ActiveBid[] activeBids;
        mapping(bytes32 => uint256) activeBidIds;

        bytes32[] listedSubs; // everything user listed 
    }
    mapping(address => User) users;

    
    constructor() {
    }

    receive() external payable {}

    function register(bytes32 key, bytes32 smail) public {
        User storage user = users[msg.sender];
        require(user.key == bytes32(0), "Already registered");
        user.key = key;
        user.smail = smail;
    }

    function getInbox(address addr) public view returns (Email[] memory) {
        return users[addr].inboxEmails;
    }

    function getSent(address addr) public view returns (Email[] memory) {
        return users[addr].sentEmails;
    }
    function getSubRequests(address addr) public view returns (SubRequest[] memory) {
        return users[addr].subRequests;
    }
    function getSubItems(address addr) public view returns (SubItem[] memory) {
        // either we  iterate through all items and return only those that are active
        // or we return all items and let the client filter them
        return users[addr].subItems;
    }
    function getListedSubs(address addr) public view returns (bytes32[] memory) {
        return users[addr].listedSubs;
    }
    function getActiveBids(address addr) public view returns (ActiveBid[] memory) {
        return users[addr].activeBids;
    }
    function getSubRequestByHash(address addr, bytes32 requestHash) public view returns (SubRequest memory) {
        User storage u = users[addr];
        return u.subRequests[u.subRequestIds[requestHash]-1];
    }

    function getBoxCount(address addr) public view returns (uint numInboxItems, uint numSentItems, uint numSubRequests, uint numSubItems, uint numActiveBids) {
        numInboxItems = users[addr].inboxEmails.length;
        numSentItems  = users[addr].sentEmails.length;
        numSubRequests = users[addr].subRequests.length;
        numSubItems = users[addr].subItems.length;
        numActiveBids = users[addr].activeBids.length;
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
    function getActiveBidAt(address addr, uint index) public view returns (ActiveBid memory) {
        return users[addr].activeBids[index];
    }

    function signEmail(bytes32 swarmLocation) public {
        User storage u = users[msg.sender];
        require(u.inboxEmailIds[swarmLocation] != 0, "Message !exist");
        Email storage email = u.inboxEmails[u.inboxEmailIds[swarmLocation] - 1];
        require(msg.sender == email.to, "Only receiver can sign");
        email.signed = true;
    }

    function sendEmail( address toAddress, bool isEncryption, bytes32 swarmLocation ) public payable
    {
        User storage receiver = users[toAddress];
        require(!isEncryption || receiver.key != bytes32(0), "Unregistered can't send encrypted");
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
        require(u.sentEmailIds[swarmLocation] != 0, "message !exist");

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
        require(u.inboxEmailIds[swarmLocation] != 0, "message !exist");

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
    uint256 public marketFee = 1000; // 1%
    uint256 public minListingFee = 1000000 gwei; // min listing fee - 0.0001000 ETH
    uint256 public feesCollected = 0;
    uint256 public inEscrow = 0;
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

    struct Category {
        uint[]     subIdxs;
    }
    mapping(bytes32 => Category) categories; // where is category in categories array

    // Sub listings
    struct Sub {
        bytes32 subHash;
        address fdpSeller; // 
        address seller;
        bytes32 swarmLocation; // metadata location
        uint256 price;
        bool    active; // is subscription active
        uint256 earned;  
        uint32  bids;
        uint32  sells;
        uint32  reports;
        uint32  podIndex;
    }
    Sub[] public  subscriptions;
    mapping(bytes32 => uint256) public subscriptionIds; 

    // struct SubSubscriber {
    //     address subscriber;
    //     uint256 balance;
    // }
    // mapping(bytes32 => SubSubscriber[]) public subScribers; // where is sub in subscriptions array
    struct SubInfo {
        mapping(address => uint256) perSubscriberBalance; // balance per subscriber
        address[] subscribers; 
    }

    mapping(bytes32 => SubInfo) subInfos; // where is sub in subscriptions array
    function getSubSubscribers(bytes32 subHash) public view returns (address[] memory) {
        return subInfos[subHash].subscribers;
    }
    function getSubInfoBalance(bytes32 subHash, address forAddress) public view returns (uint256) {
        return subInfos[subHash].perSubscriberBalance[forAddress];
    }

    function getCategory(bytes32 category) public view returns (Category memory) {
        return categories[category];
    }
    function getSub(uint index) public view returns (Sub memory) {
        return subscriptions[index];
    }
    function getSubBy(bytes32 subHash) public view returns (Sub memory) {
        return subscriptions[subscriptionIds[subHash]-1];
    }
    function enableSub(bytes32 subHash, bool active) public {
        require(subscriptionIds[subHash] != 0, "No Sub"); // must exists
        Sub storage s = subscriptions[subscriptionIds[subHash] - 1]; 
        require(s.seller == msg.sender, "Not Seller"); // only seller can enable subscription
        s.active = active;
    }
    
    // Market to sell encrypted swarmLocation
    function listSub(address fdpSeller, bytes32 dataSwarmLocation, uint price, bytes32 category, uint32 podIndex) public payable {
        //bytes32 subHash = keccak256(abi.encode(msg.sender, fdpSeller, dataSwarmLocation, price, category, podIndex));
        bytes32 subHash = keccak256(abi.encode(msg.sender, fdpSeller, podIndex));// user can list same pod only once
        require(msg.value>=minListingFee, "minFee"); // sent value must be equal to price
        require(subscriptionIds[subHash] == 0, "SubExists"); // must not exists

        Sub memory s = Sub(subHash, fdpSeller, msg.sender, dataSwarmLocation, price, true, 0, 0, 0, 0, podIndex);
        
        subscriptions.push(s);
        subscriptionIds[subHash] = subscriptions.length; // will point to 1 more than index

        Category storage c = categories[category];
        c.subIdxs.push(subscriptions.length - 1); // point to index

        User storage seller = users[msg.sender];
        seller.listedSubs.push(subHash);

        feesCollected+=msg.value;
    }

    function bidSub(bytes32 subHash, address fdpBuyer) public nonReentrant payable {
        require(users[msg.sender].key != bytes32(0), "Not reg"); // user can not receive encrypted data
        require(subscriptionIds[subHash] != 0, "No Sub"); // must exists
        Sub storage s = subscriptions[subscriptionIds[subHash] - 1]; 

        require(s.active, "Inactive"); // must be active
        require(msg.value==s.price, "Value!=price"); // sent value must be equal to price

        User storage seller = users[s.seller];
        bytes32 requestHash = keccak256(abi.encode(msg.sender, subHash, fdpBuyer)); //, block.timestamp));
        require(seller.subRequestIds[requestHash] == 0, "Req exists");

        s.bids++;

        SubRequest memory sr;
        sr.fdpBuyer = fdpBuyer;
        sr.buyer = msg.sender;
        sr.subHash = s.subHash;
        sr.requestHash = requestHash;

        seller.subRequests.push(sr);
        seller.subRequestIds[requestHash] = seller.subRequests.length; // +1 of index
        
        inEscrow += msg.value;

        ActiveBid memory ab;
        ab.requestHash = requestHash;
        ab.seller = msg.sender;

        User storage buyer = users[msg.sender];
        buyer.activeBids.push(ab);      
        buyer.activeBidIds[requestHash] = buyer.activeBids.length; // +1 of index
    }

    // podAddress, seller.address, buyer.address, encryptedSecret
    
    // encryptedSecret is podReference encrypited with sharedSecret 
    function sellSub(bytes32 requestHash, bytes32 encryptedKeyLocation) public payable {
        User storage seller = users[msg.sender];

        require(seller.subRequestIds[requestHash] != 0, "No Req");
        SubRequest memory br = seller.subRequests[seller.subRequestIds[requestHash]-1];

        require(subscriptionIds[br.subHash] != 0, "No Sub"); // must exists
        Sub storage s = subscriptions[subscriptionIds[br.subHash]-1]; 
        require(msg.sender==s.seller, "Not Sub Seller"); // sent value must be equal to price

        uint256 fee = getFee(marketFee, s.price);
        payable(msg.sender).transfer(s.price-fee);
        inEscrow -= s.price;
        feesCollected += fee;

        s.sells++;
        s.earned += (s.price-fee);

        User storage buyer = users[br.buyer];
        SubItem memory si;
        si.subHash = br.subHash;
        si.unlockKeyLocation = encryptedKeyLocation;
        si.validTill = block.timestamp + 30 days;

        buyer.subItems.push(si);
        buyer.subItemIds[br.subHash] = buyer.subItems.length; // +1 of index (so call subHash -1)

        if(subInfos[br.subHash].perSubscriberBalance[br.buyer]==0) // only add subscriber if not already added
           subInfos[br.subHash].subscribers.push(br.buyer);

        subInfos[br.subHash].perSubscriberBalance[br.buyer] += (s.price-fee);

        // seller removes request from his list
        removeSubRequest(msg.sender, requestHash); // remove from seller 
        removeActiveBid(br.buyer, requestHash);
    }

    // removes active bids from SubRequests of seller and from Active bids of buyer
    function removeActiveBid(bytes32 requestHash) public {
        User storage u = users[msg.sender];
        require(u.activeBidIds[requestHash] != 0, "!ab Req");
        ActiveBid memory ab = u.activeBids[u.activeBidIds[requestHash]-1];

        User storage seller = users[ab.seller];

        require(seller.subRequestIds[requestHash] != 0, "!seller Req");
        SubRequest storage br = seller.subRequests[seller.subRequestIds[requestHash]-1];
        require(subscriptionIds[br.subHash] != 0, "!sub");
        Sub storage s = subscriptions[subscriptionIds[br.subHash]-1];
        payable(msg.sender).transfer(s.price);

        removeSubRequest(ab.seller, requestHash); // remove from seller 
        removeActiveBid(msg.sender, requestHash);
    }

    function removeActiveBid(address buyer, bytes32 requestHash) private {
        User storage u = users[buyer];
        require(u.activeBidIds[requestHash] != 0, "!ab Req");

        uint256 removeIndex = u.activeBidIds[requestHash] - 1;
        // replace removeIndex with last item and pop last item
        uint256 lastIndex = u.activeBids.length - 1;
        if (lastIndex != removeIndex) {
            u.activeBids[removeIndex] = u.activeBids[lastIndex];
        }
        u.activeBids.pop();
        delete u.activeBidIds[requestHash];
    }

    // user can remove subItem from his list if wishes to do so
    function removeSubItem(uint256 index) public {
        User storage u = users[msg.sender];
        require(index < u.subItems.length, "!Index");

        uint256 lastIndex = u.subItems.length - 1;
        if (lastIndex != index) {
            u.subItems[index] = u.subItems[lastIndex];
        }
        u.subItems.pop();
    }
    // remove subRequest from seller needs to return money to bidder 

    function removeSubRequest(address owner, bytes32 requestHash) private {
        User storage u = users[owner]; //msg.sender];
        require(u.subRequestIds[requestHash] != 0, "!Req");

        uint256 removeIndex = u.subRequestIds[requestHash] - 1;
        // replace removeIndex with last item and pop last item
        uint256 lastIndex = u.subRequests.length - 1;
        if (lastIndex != removeIndex) {
            u.subRequests[removeIndex] = u.subRequests[lastIndex];
            u.subRequestIds[u.subRequests[lastIndex].requestHash] = removeIndex + 1;
        }
        u.subRequests.pop();
        delete u.subRequestIds[requestHash];
        //delete u.subRequests[lastIndex];
    }

    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/MerkleProof.sol
    
    /*
    function encrypt(bytes32 podReference, bytes32 sharedSecret) public {
         xor(podReference, keccak256(sharedSecret));
    }
    function decrypt(bytes32 encryptedReference, bytes32 sharedSecret) public view returns (bytes32) {
        return xor(encryptedReference, keccak256(sharedSecret));
    }

    function xor(bytes32 a, bytes32 b) private pure returns (bytes32) {
        uint256[] memory ab = new uint256[](2);
        ab[0] = uint256(a);
        ab[1] = uint256(b);
        return bytes32(ab[0] ^ ab[1]);
    } 
    */

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

    /*
    */
    

    //////////////////////////////////////////
    // import "../token/ERC20/utils/SafeERC20.sol";
    /* 
     function release(address token, uint amount) public virtual {
        //uint256 amount = releasable(token);
        //_erc20Released[token] += amount;
        //emit ERC20Released(token, amount);
        SafeERC20.safeTransfer(IERC20(token), beneficiary(), amount);
    }
    */