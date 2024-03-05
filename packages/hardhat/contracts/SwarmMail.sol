// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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

/*, ReentrancyGuard*/
contract SwarmMail is Ownable, AccessControl  {
    struct Share {
        address withAddress;
        bytes32 keyLocation;
        bool    revoked;
    }
    /*struct Thread {
        bytes32  threadHash;
        Email[]  emails;
    }*/
    struct Email {
        bool      isEncryption;
        uint256   time;
        address   from;
        address   to;
        bytes32   swarmLocation;
        bool      signed;
        bytes32[] threads; // hashes to threads
    }
    /*
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
    }*/
    struct User {
        bytes32 pubKey;
        bytes32 keyLocation;
        // PublicKey pubkey;
        Email[] inboxEmails;
        mapping(bytes32 => uint256) inboxEmailIds;
        Email[] sentEmails;
        mapping(bytes32 => uint256) sentEmailIds;

        Email[] oneWayEmails;
        mapping(bytes32 => uint256) oneWayEmailIds;

        Email[] lockerEmails;
        mapping(bytes32 => uint256) lockerEmailIds;
        
        mapping(bytes32 => Share[]) shares;
        mapping(bytes32 => mapping(address => uint256)) shareIds;

        Email[] sharedLockerEmails;
        mapping(bytes32 => uint256) sharedLockerEmailIds;

        //Email[] private threadEmails;
        bytes32[] threads;
        //mapping(bytes32 => uint256) threadEmailIds;

        // // who wants to subscribe to what
        // SubRequest[] subRequests;
        // mapping(bytes32 => uint256) subRequestIds;
        // // what is user subscribed to
        // SubItem[] subItems;
        // mapping(bytes32 => uint256) subItemIds;

        // ActiveBid[] activeBids;
        // mapping(bytes32 => uint256) activeBidIds;

        // bytes32[] listedSubs; // everything user listed 

        //address[] contacts;
        //mapping(address => uint256) contactsIds;
    }

    Email[] private Threads;
    mapping(bytes32 => uint256) threadHashIds;

    mapping(address => User) private users;
    // mapping of blacklisted addresses (for spam)
    mapping(address => mapping(address => bool)) private blackList;

    address public _notarizationContract;
    //mapping(address => address)
    // mapping(address => address) userToPortable;

    // to do add checkers for blacklisted addresses
    function blackListAddress(address addr) public {
        blackList[msg.sender][addr] = true;
    }

    function setNotarizationContract(address addr) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "!");
        _notarizationContract = addr;
    }
 
    constructor() {
       _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
    }

    receive() external payable {}

    modifier isRegistered() { 
        require(users[msg.sender].pubKey != bytes32(0), "User not registred");
        _;
    }

    function getPublicKeys(address addr) public view returns (bool registered, bytes32 pubKey, bytes32 keyLocation/*, address portable*/) {
        registered = users[addr].pubKey != bytes32(0) ;
        pubKey = users[addr].pubKey;
        keyLocation = users[addr].keyLocation;
        //portable = userToPortable[addr];
    } 
    function getUserStats(address addr) public view returns (uint numInboxItems, uint numSentItems, uint numLockers, uint numSharedLockers, uint numOneWayItems, uint numThreads /* uint numSubRequests, uint numSubItems, uint numActiveBids */) {
        numInboxItems = users[addr].inboxEmails.length;
        numSentItems  = users[addr].sentEmails.length;
        numLockers = users[addr].lockerEmails.length;
        numSharedLockers = users[addr].sharedLockerEmails.length;
        numOneWayItems = users[addr].oneWayEmails.length;
        numThreads = users[addr].threads.length;
    }
    function register(bytes32 pubKey, bytes32 keyLocation) public {
        User storage user = users[msg.sender];
        require(user.pubKey == bytes32(0), "Already registered");
        user.pubKey = pubKey;
        user.keyLocation = keyLocation;
        //userToPortable[msg.sender] = portable;
    }
    function reset_registration() public {
        User storage user = users[msg.sender];
        user.pubKey = bytes32(0);
        user.keyLocation = bytes32(0);
    }
    

    /*
    function setPortableAddress(address addr) public {
        userToPortable[msg.sender] = addr;
    }
    function getPortableAddress(address addr) public view returns (address) {
        return userToPortable[addr];
    }
    */    

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

    // this will work for inbox / outbox 
    function signEmail(uint in_types, uint sender_types, bytes32 swarmLocation) public {
        User storage u = users[msg.sender];
        Email memory e = getEmailByType(u, in_types, swarmLocation); 
        // require(e.to == msg.sender, "only receiver can sign");
        
        if(e.to==msg.sender) { // receiver signs
            User storage sender = users[e.from]; // get sender
            Email storage e2 = getEmailByType(sender, sender_types, swarmLocation); 
            e2.signed = true;
        }
        if(e.from==msg.sender) { // sender signs
            User storage receiver = users[e.from]; // get sender
            Email storage e2 = getEmailByType(receiver, sender_types, swarmLocation); 
            e2.signed = true;
        }
    }

    function sendEmail( address toAddress, bool isEncryption, bytes32 swarmLocation ) public payable {
        require(blackList[toAddress][msg.sender]==false, "denied");

        User storage receiver = users[toAddress];
        require(!isEncryption || receiver.pubKey != bytes32(0), "receiver not registered");
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
    }

    function sendOneWayEmail( address toAddress, bool isEncryption, bytes32 swarmLocation ) public payable {
        require(blackList[toAddress][msg.sender]==false, "denied");

        User storage receiver = users[toAddress];
        require(!isEncryption || receiver.pubKey != bytes32(0), "receiver not registered");
        
        // create email
        Email memory email;
        email.isEncryption = isEncryption;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = toAddress;
        email.swarmLocation = swarmLocation;

        // add email
        receiver.oneWayEmails.push(email);
        receiver.oneWayEmailIds[swarmLocation] = receiver.oneWayEmails.length;
    }

    // try to do generif delete from array using ref to array and mapping 
    function removeGenericEmail(bytes32 location, mapping(bytes32=>uint256) storage ids, Email[] storage array) private {
        require(ids[location] != 0, "!Req");

        uint256 removeIndex = ids[location] - 1;
        // remove info
        uint256 lastIndex = array.length - 1;
        if (lastIndex != removeIndex) {
            array[removeIndex] = array[lastIndex];
            ids[array[lastIndex].swarmLocation] = removeIndex + 1;
        }
        array.pop();
        delete ids[location];
    }

    function removeEmails(uint32 types, bytes32[] memory locations) public {
        User storage u = users[msg.sender];
        if(types == 0) {
            for (uint256 i; i < locations.length; i++) {
                removeGenericEmail(locations[i], u.inboxEmailIds, u.inboxEmails);
            }
        }
        else if(types == 1) {
            for (uint256 i; i < locations.length; i++) {
                removeGenericEmail(locations[i], u.sentEmailIds, u.sentEmails);
            }
        } 
        else if(types == 2) {
            for (uint256 i; i < locations.length; i++) {
                removeGenericEmail(locations[i], u.lockerEmailIds, u.lockerEmails);
            }
        }
        else if(types == 3) {
            for (uint256 i; i < locations.length; i++) {
                removeGenericEmail(locations[i], u.oneWayEmailIds, u.oneWayEmails);
            }
        }
        // TODO remove threads 
        /*else if(types == 5) {
            for (uint256 i; i < locations.length; i++) {
                removeGenericEmail(locations[i], u.threadEmailIds, u.threadEmails);
            }
        }*/
    }

    function genEmailRange(uint start, uint length, Email[] memory array) private pure returns (Email[] memory) {
        Email[] memory emails = new Email[](length);
        //require(start + length <= array.length, "Out of bounds");
        uint count = 0;
        for(uint i = start; i < start + length; i++)
        {
            if(i<array.length)
            {
                emails[count] = array[i];
                ++count;
            }
        }
        return emails;
    }

    function getEmailRange(address addr, uint types, uint start, uint length) public view returns (Email[] memory messages) {
        User storage u = users[addr];
        if(types == 0) {
            messages = genEmailRange(start, length, u.inboxEmails);
        } else if(types == 1) {
            messages = genEmailRange(start, length, u.sentEmails);
        } else if(types == 2) {
            messages = genEmailRange(start, length, u.lockerEmails);
        } else if(types == 3) {
            messages = genEmailRange(start, length, u.oneWayEmails);
        } else if(types == 4) {
            messages = genEmailRange(start, length, u.sharedLockerEmails);
        } /*else if(types == 5) {
            messages = genEmailRange(start, length, u.threadEmails);
        }*/
    }

    function getLocker(address locker, bytes32 lockerLocation) public view returns (Email memory) {
        return users[locker].lockerEmails[users[locker].lockerEmailIds[lockerLocation]-1];
    }
    function storeLockerFor(address forLocker, bytes32 swarmLocation) public payable {
        require(msg.sender==_notarizationContract, "!notary");
        User storage sender = users[forLocker];
        require(sender.lockerEmailIds[swarmLocation] == 0, "!exist");
        Email memory email;
        email.isEncryption = true;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = forLocker;
        email.swarmLocation = swarmLocation;

        sender.lockerEmails.push(email);
        sender.lockerEmailIds[swarmLocation] = sender.lockerEmails.length;
    }

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
        sender.lockerEmailIds[swarmLocation] = sender.lockerEmails.length;
    }
    function shareLockerWith(bytes32 lockerLocation, bytes32 keyLocation, address withAddress) public payable {
        require(blackList[withAddress][msg.sender]==false, "denied");

        User storage u = users[msg.sender];

        // TODO storage fee for locker
        if(u.shareIds[lockerLocation][withAddress]==0) {
            Share memory share = Share(withAddress, keyLocation, false);
            u.shares[lockerLocation].push(share);
            u.shareIds[lockerLocation][withAddress] = u.shares[lockerLocation].length;
        } else {
            // update keyLocation
            Share storage sr = u.shares[lockerLocation] [u.shareIds[lockerLocation][withAddress]-1];
            sr.keyLocation = keyLocation;
        } 

        User storage u2 = users[withAddress];
        require(u2.sharedLockerEmailIds[keyLocation] == 0, "exists");
        Email memory email; 
        email.isEncryption = true;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = withAddress;
        email.swarmLocation = keyLocation;
        //u2.sharedLockerEmails.push(email);
        u2.sharedLockerEmails.push(email); // u.lockerEmails[u.lockerEmailIds[keyLocation]]);
        u2.sharedLockerEmailIds[keyLocation] = u2.sharedLockerEmails.length;
    }
    function unshareLockerWith(bytes32 lockerLocation, bytes32 keyLocation, address withAddress) public {
        User storage u = users[msg.sender];
        require(u.lockerEmailIds[lockerLocation] != 0, "!exist");
        require(u.shareIds[lockerLocation][withAddress] != 0, "!noshare");
        // you revoked share to withAddress
        u.shares[lockerLocation][u.shareIds[lockerLocation][withAddress]-1].revoked = true;

        User storage u2 = users[withAddress];
        require(u2.sharedLockerEmailIds[keyLocation] != 0, "!exist");
        // needs to be owner to remove shared locker 
        require(u2.lockerEmails[u2.lockerEmailIds[keyLocation]].from == msg.sender, "!owner");
        // u2.lockerEmails[u2.lockerEmailIds[keyLocation]].to == msg.sender

        removeGenericEmail(keyLocation, u2.sharedLockerEmailIds, u2.sharedLockerEmails);
    }
    function getLockerShares(address locker, bytes32 lockerLocation) public view returns (Share[] memory) {
        return users[locker].shares[lockerLocation];
    }
    // End of Locker parts of SwarmMail contract
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function getEmailByType(User storage u, uint types, bytes32 swarmLocation) private view returns (Email storage e) {
        if(types == 0) {
            e = u.inboxEmails[u.inboxEmailIds[swarmLocation]-1];
            return e;
        }
        else if(types == 1) {
            e = u.sentEmails[u.sentEmailIds[swarmLocation]-1];
            return e;
        } 
        else if(types == 2) {
            e = u.lockerEmails[u.lockerEmailIds[swarmLocation]-1];
            return e;
        }
        else if(types == 3) {
            e = u.oneWayEmails[u.oneWayEmailIds[swarmLocation]-1];
            return e;
        }
        /*else if(types == 5) {
            return e;
        }*/ 
        e = Threads[threadHashIds[swarmLocation]-1];
    }

    function getEmailFromByType(address addr, uint types, bytes32 swarmLocation) public view returns (Email memory) {
        return getEmailByType(users[addr], types, swarmLocation);
    }

    function createThread(address to, bytes32 swarmLocation) public payable
    {
        require(blackList[to][msg.sender]==false, "denied");

        Email memory email; 
        email.isEncryption = true;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = to;
        email.swarmLocation = swarmLocation;

        User storage sender   = users[msg.sender];
        User storage receiver = users[to];
        
        bytes32 threadHash = keccak256(abi.encode(msg.sender, to, swarmLocation));

        Threads.push(email);
        sender.threads.push(threadHash);
        receiver.threads.push(threadHash);

        threadHashIds[threadHash] = Threads.length;
    }

    function addThread(uint types, bytes32 emailSwarmLocation, address to, bytes32 swarmThreadLocation) public payable {
        User  storage sender = users[msg.sender];
        Email storage e = getEmailByType(sender, types, emailSwarmLocation);
        require(e.from == msg.sender || e.to == msg.sender, "!owner");

        Email memory email; 
        email.isEncryption = e.isEncryption;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = to;
        email.swarmLocation = swarmThreadLocation;

        Threads.push(email); 
        bytes32 threadHash = keccak256(abi.encode(email.from, email.to, swarmThreadLocation));
        threadHashIds[threadHash] = Threads.length;
        //sender.threadEmailIds[swarmThreadLocation] = Threads.length;
        //sender.threadEmailIds[threadHash] = Threads.length;
        e.threads.push(threadHash);
    }

    function getThreads(bytes32[] memory locations) public view returns (Email[] memory) {
        Email[] memory messages = new Email[](locations.length);
        for (uint256 i=0; i < locations.length; i++) {
            if(threadHashIds[locations[i]]!=0)
               messages[i] = Threads[threadHashIds[locations[i]]-1];
        }
        return messages;
    }

    function getUserThreadsRange(address addr, uint start, uint length) public view returns (Email[] memory, bytes32[] memory) {
        Email[] memory emails = new Email[](length);
        bytes32[] memory locations = new bytes32[](length);
        uint count = 0;
        uint len = users[addr].threads.length;
        for(uint i = start; i < start + length; i++)
        {
            if(i<len)
            {
                bytes32 location = users[addr].threads[i];
                if(threadHashIds[location]!=0)
                {
                    emails[count] = Threads[threadHashIds[location]-1];
                    locations[count] = location;
                    ++count;
                }
            }
        }
        return (emails,locations);
    }

    function removeUserThread(uint idx) public {
        User storage u = users[msg.sender];
        uint256 removeIndex = idx;
        // remove info
        uint256 lastIndex = u.threads.length - 1;
        if (lastIndex != removeIndex) {
            u.threads[removeIndex] = u.threads[lastIndex];
        }
        u.threads.pop();
    }
    /*
    function getUserThreads(address addr) public view returns (bytes32[] memory) {
        return users[addr].threads;
    }*/
    /*
    function getUserThreadEmails(address addr) public view returns (Email[] memory) {
        return getThreads(getUserThreads(addr));
    }*/ 
    
    //uint256 public inEscrow = 0;


/*
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    uint256 private constant FEE_PRECISION = 1e5;  
    uint256 public marketFee = 1000; // 1%
    uint256 public minListingFee = 1000000 gwei; // min listing fee - 0.0001000 ETH
    uint256 public feesCollected = 0;
    uint256 public inEscrow = 0;
    bytes32 public constant ROLE_REPORTER = keccak256("ROLE_REPORTER");

    function getFee(uint256 _fee, uint256 amount) public pure returns (uint256) {
        return (amount * _fee) / FEE_PRECISION;
    }
    function setFee(uint256 newFee) public  {
        require(msg.sender==_owner, "!");
        marketFee = newFee; 
    }
    function setListingFee(uint256 newListingFee) public  {
        require(msg.sender==_owner, "!");
        minListingFee = newListingFee; 
    }      

    struct Category {
        uint64[]     subIdxs;
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
        uint32  reports; // TODO add method to report for OWNERS
        uint16  daysValid;
    }
    Sub[] public  subscriptions;
    mapping(bytes32 => uint256) public subscriptionIds; 

    struct SubInfo {
        mapping(address => uint256) perSubscriberBalance; // balance per subscriber
        address[] subscribers; 
    }
    mapping(bytes32 => SubInfo) subInfos; // where is sub in subscriptions array

    function getSubRequestAt(address addr, uint index) public view returns (SubRequest memory) {
        return users[addr].subRequests[index];
    }
    function getSubItemAt(address addr, uint index) public view returns (SubItem memory) {
        return users[addr].subItems[index];
    }
    function getActiveBidAt(address addr, uint index) public view returns (ActiveBid memory) {
        return users[addr].activeBids[index];
    }    
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
    function getSubSubscribers(bytes32 subHash) public view returns (address[] memory) {
        return subInfos[subHash].subscribers;
    }
    function getSubInfoBalance(bytes32 subHash, address forAddress) public view returns (uint256) {
        return subInfos[subHash].perSubscriberBalance[forAddress];
    }
    function getSubs() public view returns (Sub[] memory) {
        return subscriptions;
    }
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
        require(s.reports<4, "Too many reports"); // only seller can enable subscription

        s.active = active;
    }
    function reportSub(bytes32 subHash) public {
        require(hasRole(ROLE_REPORTER, msg.sender),"Not Reporter");
        require(subscriptionIds[subHash] != 0, "No Sub"); // must exists
        Sub storage s = subscriptions[subscriptionIds[subHash] - 1]; 
        s.reports = s.reports + 1;
        if(s.reports >= 3) {
            s.active = false;
        }
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
        subscriptionIds[subHash] = subscriptions.length; // will point to 1 more than index

        Category storage c = categories[category];
        c.subIdxs.push(uint64(subscriptions.length) - 1); // point to index

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
        seller.subRequestIds[requestHash] = seller.subRequests.length; // +1 of index
        
        inEscrow += msg.value;

        ActiveBid memory ab;
        ab.requestHash = requestHash;
        ab.seller = msg.sender;

        User storage buyer = users[msg.sender];
        buyer.activeBids.push(ab);      
        buyer.activeBidIds[requestHash] = buyer.activeBids.length; // +1 of index
    }
    // encryptedSecret is podReference encrypited with sharedSecret - podAddress, seller.address, buyer.address, encryptedSecret
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
        buyer.subItemIds[br.subHash] = buyer.subItems.length; // +1 of index (so call subHash -1)

        if(subInfos[br.subHash].perSubscriberBalance[br.buyer]==0) // only add subscriber if not already added
           subInfos[br.subHash].subscribers.push(br.buyer);

        subInfos[br.subHash].perSubscriberBalance[br.buyer] += (s.price-fee);

        // seller removes request from his list
        removeSubRequest(msg.sender, requestHash); // remove from seller 
        removeActiveBid(br.buyer, requestHash);
    }
    // removes active bids from SubRequests of seller and from Active bids of buyer
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
            u.activeBidIds[u.activeBids[removeIndex].requestHash] = removeIndex + 1;
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
            u.subRequestIds[u.subRequests[lastIndex].requestHash] = removeIndex + 1;
        }
        u.subRequests.pop();
        delete u.subRequestIds[requestHash];
        //delete u.subRequests[lastIndex];
    }
*/
    function fundsBalance() public view returns (uint256) {
        return address(this).balance;
    }    
    function fundsTransfer() onlyOwner public payable {
        payable(msg.sender).transfer((address(this).balance));
    }
    function release(address token, uint amount) public virtual {
        SafeERC20.safeTransfer(IERC20(token), owner(), amount);
    }
}
