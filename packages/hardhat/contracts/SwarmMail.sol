// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// import "@openzeppelin/contracts/utils/Strings.sol";

contract SwarmMail {
    // using Strings for uint256;

    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }
 
    modifier isRegistered() { 
        require(users[msg.sender].key != bytes32(0), "Email is not registred");
        _;
    }


    // struct File {
    //     uint256 time;
    //     bytes uuid;
    //     bytes name;
    // }

    function getPublicKeys(address addr) public view returns (bool registered, bytes32 key/*, bytes32 x, bytes32 y*/) {
        registered = users[addr].key != bytes32(0) ;
        key = users[addr].key;
        // x = userInfos[addr].pubkey.x;
        // y = userInfos[addr].pubkey.y;  
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

    struct User {
        bytes32 key;
        // PublicKey pubkey;
        Email[] sentEmails;
        mapping(bytes32 => uint256) sentEmailIds;
        Email[] inboxEmails;
        mapping(bytes32 => uint256) inboxEmailIds;
    }
    mapping(address => User) users;
    constructor() {
    }

    receive() external payable {}

    function register(bytes32 key/*, bytes32 x, bytes32 y*/) public {
        User storage user = users[msg.sender];
        require(user.key == bytes32(0), "Address is registered");
        user.key = key;
    }

    /*
    function getUserData(address addr) public view returns (Email[] memory inbox, Email[] memory sent) {
        inbox = users[addr].inboxEmails;
        sent  = users[addr].sentEmails;
    }*/
    function getInbox(address addr) public view returns (Email[] memory mails) {
        mails = users[addr].inboxEmails;
    }
    function getSent(address addr) public view returns (Email[] memory mails) {
        mails  = users[addr].sentEmails;
    }

    function getBoxCount(address addr) public view returns (uint numInboxItems, uint numSentItems) {
        numInboxItems = users[addr].inboxEmails.length;
        numSentItems  = users[addr].sentEmails.length;
    }
    function getInboxAt(address addr, uint index) public view returns (Email memory) {
        return users[addr].inboxEmails[index];
    }
    function getSentAt(address addr, uint index) public view returns (Email memory) {
        return users[addr].sentEmails[index];
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

    function removeContent(address from, bytes32 swarmLocation) private {
        /*
        FlatDirectory fileContract = FlatDirectory(fromFdContract);
        // remove mail
        fileContract.remove(getNewName(uuid, 'message'));
        // remove file
        fileContract.remove(getNewName('file', fileUuid));
        // claim stake token
        fileContract.refund();
        payable(from).transfer(address(this).balance);
        */
    }

    function removeSentEmail(bytes32 swarmLocation) public {
        User storage u = users[msg.sender];
        require(u.sentEmailIds[swarmLocation] != 0, "Email does not exist");

        uint256 removeIndex = u.sentEmailIds[swarmLocation] - 1;
        // remove content
        Email memory email = u.sentEmails[removeIndex];
        if(users[email.to].inboxEmailIds[swarmLocation] == 0) {
            // if inbox is delete
            removeContent(msg.sender, swarmLocation);
        }

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
        // remove content
        Email memory email = u.inboxEmails[removeIndex];
        if(users[email.from].sentEmailIds[swarmLocation] == 0) {
            // if sent is delete
            removeContent(email.from, swarmLocation);
        }

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

    /*
    function getNewName(bytes memory dir, bytes memory name) public pure returns (bytes memory) {
        return abi.encodePacked(dir, '/', name);
    }

    function getInboxEmails() public view
        returns (
            bool[] memory isEncryptions,
            uint256[] memory times,
            address[] memory fromMails,
            address[] memory toMails,
            bytes32[] memory swarmLocations
        )
    {
        User storage u = users[msg.sender];
        uint256 length = u.inboxEmails.length;
        isEncryptions = new bool[](length);
        times = new uint256[](length);
        fromMails = new address[](length);
        toMails = new address[](length);
        swarmLocations = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            isEncryptions[i] = u.inboxEmails[i].isEncryption;
            times[i] = u.inboxEmails[i].time;
            fromMails[i] = u.inboxEmails[i].from;
            toMails[i] = u.inboxEmails[i].to;
            swarmLocations[i] = u.inboxEmails[i].swarmLocation;
        }
    }

    function getSentEmails() public view
        returns (
            bool[] memory isEncryptions,
            uint256[] memory times,
            address[] memory fromMails,
            address[] memory toMails,
            bytes32[] memory swarmLocations
        )
    {
        User storage u = users[msg.sender];
        uint256 length = u.sentEmails.length;
        isEncryptions = new bool[](length);
        times = new uint256[](length);
        fromMails = new address[](length);
        toMails = new address[](length);
        swarmLocations = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            isEncryptions[i] = u.sentEmails[i].isEncryption;
            times[i] = u.sentEmails[i].time;
            fromMails[i] = u.sentEmails[i].from;
            toMails[i] = u.sentEmails[i].to;
            swarmLocations[i] = u.inboxEmails[i].swarmLocation;
        }
    }
    */

    // function getEmailContent(address fromEmail, bytes memory uuid, uint256 chunkId) public view returns(bytes memory data) {
    //     if(fromEmail == address(this) &&  keccak256(uuid) == keccak256('default-email')) {
    //         return bytes(defaultEmail);
    //     }

    //     FlatDirectory fileContract = FlatDirectory(getFlatDirectory(fromEmail));
    //     (data, ) = fileContract.readChunk(getNewName(uuid, bytes('message')), chunkId);
    //     return 0;
    // }

    /*
    function getFile(address fromEmail, bytes memory uuid, uint256 chunkId) public view returns(bytes memory data) {
        FlatDirectory fileContract = FlatDirectory(getFlatDirectory(fromEmail));
        (data,) = fileContract.readChunk(getNewName('file', uuid), chunkId);
    }*/

    /*
    function countChunks(address fromEmail, bytes memory uuid) public view returns (uint256) {
        FlatDirectory fileContract = FlatDirectory(getFlatDirectory(fromEmail));
        return fileContract.countChunks(getNewName('file', uuid));
    }*/

    // function getPublicKey(address userAddress) public view returns(bytes32 publicKey) {
    //     return userInfos[userAddress].publicKey;
    // }

    /*
    function getFlatDirectory(address userAddress) internal view returns(address) {
        return userInfos[userAddress].fdContract;
    }*/
    // function writeChunk(bytes memory uuid, bytes memory name, uint256 chunkId, bytes calldata data) public payable {
    //     User storage user = userInfos[msg.sender];
    //     if (user.files[uuid].time == 0) {
    //         // first add file
    //         user.files[uuid] = File(block.timestamp, uuid, name);
    //     }

    //     FlatDirectory fileContract = FlatDirectory(user.fdContract);
    //     fileContract.writeChunk{value: msg.value}(getNewName('file', uuid), chunkId, data);
    // }    
}