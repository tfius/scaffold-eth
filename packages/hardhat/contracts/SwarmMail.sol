// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
/*
uint32		10		4,294,967,295
uint40		13		1,099,511,627,775
uint48		15		281,474,976,710,655
uint56		17		72,057,594,037,927,935
uint64		20		18,446,744,073,709,551,615
uint72		22		4,722,366,482,869,645,213,695
uint80		25		1,208,925,819,614,629,174,706,175
uint88		27		309,485,009,821,345,068,724,781,055
uint96		29		79,228,162,514,264,337,593,543,950,335
*/


contract SwarmMail is Ownable, ReentrancyGuard, AccessControl  {
    // using Strings for uint256;

    struct PublicKey {
        bytes32 x;
        bytes32 y;
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
        bytes32 fdpBuyerNameHash;
        address buyer;
        bytes32 subHash; //which subscription;
        bytes32 requestHash; // this is needed when
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
        mapping(bytes32 => uint48) sentEmailIds;
        Email[] inboxEmails;
        mapping(bytes32 => uint48) inboxEmailIds;

        Email[] lockerEmails;
        mapping(bytes32 => uint48) lockerEmailIds;
        Email[] sharedLockerEmails;
        mapping(bytes32 => uint48) sharedLockerEmailIds;

        // who wants to subscribe to what
        SubRequest[] subRequests;
        mapping(bytes32 => uint48) subRequestIds;
        // what is user subscribed to
        SubItem[] subItems;
        mapping(bytes32 => uint48) subItemIds;

        ActiveBid[] activeBids;
        mapping(bytes32 => uint48) activeBidIds;

        bytes32[] listedSubs; // everything user listed 
    }
    mapping(address => User) users;
    mapping(address => address) userToPortable;    
 
    constructor() {
    }

    receive() external payable {}

    modifier isRegistered() { 
        require(users[msg.sender].key != bytes32(0), "User not registred");
        _;
    }

    function getPublicKeys(address addr) public view returns (bool registered, bytes32 key, bytes32 smail, address portable) {
        registered = users[addr].key != bytes32(0) ;
        key = users[addr].key;
        smail = users[addr].smail;
        portable = userToPortable[addr];
    } 

    //  
    function getBoxCount(address addr) public view returns (uint numInboxItems, uint numSentItems, uint numSubRequests, uint numSubItems, uint numActiveBids, uint numLockers, uint numSharedLockers) {
        numInboxItems = users[addr].inboxEmails.length;
        numSentItems  = users[addr].sentEmails.length;
        numSubRequests = users[addr].subRequests.length;
        numSubItems = users[addr].subItems.length;
        numActiveBids = users[addr].activeBids.length;
        numLockers = users[addr].lockerEmails.length;
        numSharedLockers = users[addr].sharedLockerEmails.length;
    }
    function register(bytes32 key, bytes32 smail) public {
        User storage user = users[msg.sender];
        require(user.key == bytes32(0), "Already registered");
        user.key = key;
        user.smail = smail;
        //userToPortable[msg.sender] = portable;
    }
    function setPortableAddress(address addr) public {
        userToPortable[msg.sender] = addr;
    }
    function getPortableAddress(address addr) public view returns (address) {
        return userToPortable[addr];
    }    

    /*
    function getInboxCount(address addr) public view returns (uint) {
        return users[addr].inboxEmails.length;
    }
    function getSentCount(address addr) public view returns (uint) {
        return users[addr].sentEmails.length;
    }
    */
    /*function getInboxAt(address addr, uint index) public view returns (Email memory) {
        return users[addr].inboxEmails[index];
    }*/
    /*function getSentAt(address addr, uint index) public view returns (Email memory) {
        return users[addr].sentEmails[index];
    }*/

    function getSubRequestAt(address addr, uint index) public view returns (SubRequest memory) {
        return users[addr].subRequests[index];
    }
    function getSubItemAt(address addr, uint index) public view returns (SubItem memory) {
        return users[addr].subItems[index];
    }
    function getActiveBidAt(address addr, uint index) public view returns (ActiveBid memory) {
        return users[addr].activeBids[index];
    }    
    /*
    function getInbox(address addr) public view returns (Email[] memory) {
        return users[addr].inboxEmails;
    }
    function getSent(address addr) public view returns (Email[] memory) {
        return users[addr].sentEmails;
    } */

    /*    
    function getActiveSubItemsCount(address addr, uint start) public view returns (uint) {
        uint count = 0;	
        for (uint i = start; i < users[addr].subItems.length; i++) {
            if(block.timestamp <= users[addr].subItems[i].validTill) {
                ++count;
            }
        }
        return count;
    }*/ 

    // todo remove 
    function getSubItems(address addr, uint start, uint length) public view returns (SubItem[] memory items, uint last) {
        // either we  iterate through all items and return only those that are active
        // or we return all items and let the client filter them
        // iterate through active subItems
        items = new SubItem[](length);
        uint count = 0;
        last = 0; // init to 0
        
        for (uint i = start; i < users[addr].subItems.length; i++) {
            if(block.timestamp < users[addr].subItems[i].validTill) {
                if(count < length)
                {
                   items[count] = users[addr].subItems[i];
                   //items.push(users[addr].subItems[i]);
                   ++count;
                   last = i;
                } else 
                    break;
            }
        }
        //return items;
    }
    function getSubItemBy(address addr, bytes32 subHash) public view returns (SubItem memory) {
        // check if subHash subItem is active
        require(block.timestamp <= users[addr].subItems[users[addr].subItemIds[subHash]-1].validTill, "SubItem expired");
        return users[addr].subItems[users[addr].subItemIds[subHash]-1];
    }
    function getAllSubItems(address addr) public view returns (SubItem[] memory) {
        // TODO return non active without keyLockLocation
        SubItem[] memory items = new SubItem[](users[addr].subItems.length);
        for (uint i = 0; i < users[addr].subItems.length; i++) {
            items[i] = users[addr].subItems[i];
            if(block.timestamp > items[i].validTill) {
                items[i].unlockKeyLocation = bytes32(0);
            }
        }
        return items; //users[addr].subItems;
    }
    function getListedSubs(address addr) public view returns (bytes32[] memory) {
        return users[addr].listedSubs;
    }
    function getActiveBids(address addr) public view returns (ActiveBid[] memory) {
        return users[addr].activeBids;
    }
    function getSubRequestByHash(address addr, bytes32 requestHash) public view returns (SubRequest memory) {
        return users[addr].subRequests[users[addr].subRequestIds[requestHash]-1];
    }
    function getSubRequests(address addr) public view returns (SubRequest[] memory) {
        return users[addr].subRequests;
    }
    function signEmail(bytes32 swarmLocation) public {
        User storage u = users[msg.sender];
        require(u.inboxEmailIds[swarmLocation] != 0, "Message !exist");
        Email storage email = u.inboxEmails[u.inboxEmailIds[swarmLocation] - 1];
        require(msg.sender == email.to, "Only receiver can sign");
        email.signed = true;
    }

    function sendEmail( address toAddress, bool isEncryption, bytes32 swarmLocation ) public payable {
        User storage receiver = users[toAddress];
        require(!isEncryption || receiver.key != bytes32(0), "receiver not registered");
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
        sender.sentEmailIds[swarmLocation] = uint48(sender.sentEmails.length);
        receiver.inboxEmails.push(email);
        receiver.inboxEmailIds[swarmLocation] = uint48(receiver.inboxEmails.length);
    }

    // try to do generif delete from array using ref to array and mapping 
    function removeGenericEmail(bytes32 location, mapping(bytes32=>uint48) storage ids, Email[] storage array) private {
        require(ids[location] != 0, "!Req");

        uint48 removeIndex = ids[location] - 1;
        // remove info
        uint48 lastIndex = uint48(array.length) - 1;
        if (lastIndex != removeIndex) {
            array[removeIndex] = array[lastIndex];
            ids[array[lastIndex].swarmLocation] = removeIndex + 1;
        }
        array.pop();
        delete ids[location];
    }

    function removeEmails(uint48 types, bytes32[] memory locations) public {
        User storage u = users[msg.sender];
        if(types == 1) {
            for (uint48 i; i < locations.length; i++) {
                removeGenericEmail(locations[i], u.inboxEmailIds, u.inboxEmails);
            }
        } else if(types == 0) {
            for (uint48 i; i < locations.length; i++) {
                removeGenericEmail(locations[i], u.sentEmailIds, u.sentEmails);
            }
        }
        else if(types == 2) {
            for (uint48 i; i < locations.length; i++) {
                removeGenericEmail(locations[i], u.lockerEmailIds, u.lockerEmails);
            }
        }
    }

    function genEmailRange(uint start, uint length, Email[] memory array) private pure returns (Email[] memory) {
        Email[] memory emails = new Email[](length);
        //require(start + length <= array.length, "Out of bounds");
        uint count = 0;
        for(uint i = start; i < start + length; i++)
        {
            emails[count] = array[i];
            ++count;
        }
        return emails;
    }

    function getEmailRange(address addr, uint types, uint start, uint length) public view returns (Email[] memory messages) {
        User storage u = users[addr];
        if(types == 1) {
            messages = genEmailRange(start, length, u.inboxEmails);
        } else if(types == 0) {
            messages = genEmailRange(start, length, u.sentEmails);
        } else if(types == 2) {
            messages = genEmailRange(start, length, u.lockerEmails);
        } else if(types == 3) {
            messages = genEmailRange(start, length, u.sharedLockerEmails);
        }
    }

    function fundsTransfer() onlyOwner public payable {
        payable(msg.sender).transfer((address(this).balance-inEscrow));
    }
    function fundsBalance() public view returns (uint256) {
        return address(this).balance;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////// @title A title that should describe the contract/interface
    /// Start Locker parts of SwarmMail contract
    /*function getLocker(address addr) public view returns (Email[] memory) {
        return users[addr].lockerEmails;
    }*/
    /*function getLockerCount(address addr) public view returns (uint) {
        return users[addr].lockerEmails.length;
    }*/
    function storeLocker(bytes32 swarmLocation) public payable {
        User storage sender = users[msg.sender];
        require(sender.lockerEmailIds[swarmLocation] == 0, "!exist");
        Email memory email;
        email.isEncryption = true;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = msg.sender;
        email.swarmLocation = swarmLocation;

        sender.lockerEmails.push(email);
        sender.lockerEmailIds[swarmLocation] = uint48(sender.lockerEmails.length);
    }
    /// shared lockers 
    /*
    function getSharedLocker(address addr) public view returns (Email[] memory) {
        return users[addr].sharedLockerEmails;
    }
    function getSharedLockerCount(address addr) public view returns (uint) {
        return users[addr].sharedLockerEmails.length;
    }
    function getSharedLockerRange(address addr, uint start, uint length) public view returns (Email[] memory) {
        Email[] memory emails = new Email[](length);
        require(start + length <= users[addr].sharedLockerEmails.length, "Out of bounds");
        for(uint i = start; i < start + length; i++)
        {
            emails[i] = users[addr].sharedLockerEmails[i];
        }
        return emails;
    }*/
    function shareLockerWith(bytes32 swarmLocation, address withAddress) public {
        User storage u = users[msg.sender];
        require(u.lockerEmailIds[swarmLocation] != 0, "!exist");

        User storage u2 = users[withAddress];
        require(u2.lockerEmailIds[swarmLocation] == 0, "exists");
        Email memory email;
        email.isEncryption = true;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = withAddress;
        email.swarmLocation = swarmLocation;
        u2.sharedLockerEmails.push(email);
        u2.sharedLockerEmailIds[swarmLocation] = uint48(u2.sharedLockerEmails.length);
    }
    function unshareLockerWith(bytes32 swarmLocation, address withAddress) public {
        User storage u = users[msg.sender];
        require(u.lockerEmailIds[swarmLocation] != 0, "!exist");

        User storage u2 = users[withAddress];
        require(u2.lockerEmailIds[swarmLocation] != 0, "!exist");
        // needs to be owner or user that share was made to
        require(u2.lockerEmails[u2.lockerEmailIds[swarmLocation]].from == msg.sender  || 
                u2.lockerEmails[u2.lockerEmailIds[swarmLocation]].to == msg.sender, "!owner");

        removeGenericEmail(swarmLocation, u2.sharedLockerEmailIds, u2.sharedLockerEmails);
    }
    // End of Locker parts of SwarmMail contract
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
        uint48[]     subIdxs;
    }
    mapping(bytes32 => Category) categories; // where is category in categories array

    // Sub listings
    struct Sub {
        bytes32 subHash;
        bytes32 fdpSellerNameHash; //
        address seller;
        bytes32 swarmLocation; // metadata location
        uint256 price;
        bool    active; // is subscription active
        uint256 earned;  
        uint32  bids;
        uint32  sells;
        uint32  reports;
        uint16  daysValid;
    }
    Sub[] public  subscriptions;
    mapping(bytes32 => uint256) public subscriptionIds; 

    //Sub[] public  podSubscriptions;
    //Sub[] public  lockerSubscriptions;

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
    function getSubs() public view returns (Sub[] memory) {
        return subscriptions;
    }
    /*function getPodSubs() public view returns (Sub[] memory) {
        return podSubscriptions;
    }*/
    function getCategory(bytes32 category) public view returns (Category memory) {
        return categories[category];
    }
    function getSubByIndex(uint index) public view returns (Sub memory) {
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
    function listSub(bytes32 fdpSellerNameHash, bytes32 dataSwarmLocation, uint price, bytes32 category, address podAddress, uint16 daysValid) public payable {
        //bytes32 subHash = keccak256(abi.encode(msg.sender, fdpSeller, dataSwarmLocation, price, category, podIndex));
        require(msg.value>=minListingFee, "minFee"); // sent value must be equal to price
        require(daysValid>=1 && daysValid<=365, "daysValid"); // must not exists

        bytes32 subHash = keccak256(abi.encode(msg.sender, fdpSellerNameHash, podAddress));// user can list same pod only once
        require(subscriptionIds[subHash] == 0, "SubExists"); // must not exists

        Sub memory s = Sub(subHash, fdpSellerNameHash, msg.sender, dataSwarmLocation, price, true, 0, 0, 0, 0, daysValid);
        
        subscriptions.push(s);
        subscriptionIds[subHash] = uint48(subscriptions.length); // will point to 1 more than index

        Category storage c = categories[category];
        c.subIdxs.push(uint48(subscriptions.length) - 1); // point to index

        User storage seller = users[msg.sender];
        seller.listedSubs.push(subHash);

        feesCollected+=msg.value;
    }    

    function bidSub(bytes32 subHash, bytes32 fdpBuyerNameHash) public nonReentrant payable {
        // marketplace does not require user to be registred with smail -- TODO on front end and check 
        // require(users[msg.sender].key != bytes32(0), "Not reg"); // user can not receive encrypted data
        require(subscriptionIds[subHash] != 0, "No Sub"); // must exists
        Sub storage s = subscriptions[subscriptionIds[subHash] - 1]; 

        require(s.active, "Inactive"); // must be active
        require(msg.value==s.price, "Value!=price"); // sent value must be equal to price

        User storage seller = users[s.seller];
        bytes32 requestHash = keccak256(abi.encode(msg.sender, subHash, fdpBuyerNameHash)); //, block.timestamp));
        require(seller.subRequestIds[requestHash] == 0, "Req exists");

        s.bids++;

        SubRequest memory sr;
        sr.fdpBuyerNameHash = fdpBuyerNameHash;
        sr.buyer = msg.sender;
        sr.subHash = s.subHash;
        sr.requestHash = requestHash;

        seller.subRequests.push(sr);
        seller.subRequestIds[requestHash] = uint48(seller.subRequests.length); // +1 of index
        
        inEscrow += msg.value;

        ActiveBid memory ab;
        ab.requestHash = requestHash;
        ab.seller = msg.sender;

        User storage buyer = users[msg.sender];
        buyer.activeBids.push(ab);      
        buyer.activeBidIds[requestHash] = uint48(buyer.activeBids.length); // +1 of index
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
        si.validTill = block.timestamp + (s.daysValid * 86400); //(daysValid * 60*60*24) // days;

        buyer.subItems.push(si);
        buyer.subItemIds[br.subHash] = uint48(buyer.subItems.length); // +1 of index (so call subHash -1)

        if(subInfos[br.subHash].perSubscriberBalance[br.buyer]==0) // only add subscriber if not already added
           subInfos[br.subHash].subscribers.push(br.buyer);

        subInfos[br.subHash].perSubscriberBalance[br.buyer] += (s.price-fee);

        // seller removes request from his list
        removeSubRequest(msg.sender, requestHash); // remove from seller 
        removeActiveBid(br.buyer, requestHash);
    }

    // removes active bids from SubRequests of seller and from Active bids of buyer
    // TODO TEST removeUserActiveBid
    function removeUserActiveBid(bytes32 requestHash) public {
        User storage u = users[msg.sender];
        require(u.activeBidIds[requestHash] != 0, "!ab Req");
        ActiveBid memory ab = u.activeBids[u.activeBidIds[requestHash]-1];

        User storage seller = users[ab.seller];
        require(seller.subRequestIds[requestHash] != 0, "!seller Req");

        SubRequest storage br = seller.subRequests[seller.subRequestIds[requestHash]-1];
        require(subscriptionIds[br.subHash] != 0, "!sub");

        Sub memory s = subscriptions[subscriptionIds[br.subHash]-1];
        payable(msg.sender).transfer(s.price);

        removeSubRequest(ab.seller, requestHash); // remove from seller 
        removeActiveBid(msg.sender, requestHash);
    }

    function removeActiveBid(address user, bytes32 requestHash) private {
        User storage u = users[user];
        require(u.activeBidIds[requestHash] != 0, "!ab Req");

        uint256 removeIndex = u.activeBidIds[requestHash] - 1;       
        uint256 lastIndex = u.activeBids.length - 1; // replace removeIndex with last item and pop last item
        if (lastIndex != removeIndex) {
            u.activeBids[removeIndex] = u.activeBids[lastIndex];
            u.activeBidIds[u.activeBids[removeIndex].requestHash] = uint48(removeIndex) + 1;
        }
        u.activeBids.pop();
        delete u.activeBidIds[requestHash];
    }

    // user can remove subItem from his list if wishes to do so
    function removeSubItem(uint256 index) private {
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
        uint256 lastIndex = u.subRequests.length - 1; // replace removeIndex with last item and pop last item
        if (lastIndex != removeIndex) {
            u.subRequests[removeIndex] = u.subRequests[lastIndex];
            u.subRequestIds[u.subRequests[lastIndex].requestHash] = uint48(removeIndex) + 1;
        }
        u.subRequests.pop();
        delete u.subRequestIds[requestHash];
        //delete u.subRequests[lastIndex];
    }
    
    // try to do generic delete from array using ref to array and mapping 
    /*
    function removeFromArray(bytes32 requestHash, Email[] storage array, uint removeIndex) private {
        require(array[requestHash] != 0, "!Req");

        // uint256 removeIndex = ids[requestHash] - 1;
        // replace removeIndex with last item and pop last item
        uint256 lastIndex = array.length - 1;
        if (lastIndex != removeIndex) {
            array[removeIndex] = array[lastIndex];
        }
        array.pop();
    }*/

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