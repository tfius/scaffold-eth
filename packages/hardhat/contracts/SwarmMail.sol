// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
// import "./FlatDirectory.sol";

contract SwarmMail {
    using Strings for uint256;

    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }
 
    modifier isRegistered() { 
        require(userInfos[msg.sender].key != bytes32(0), "Email is not register");
        _;
    }


    struct File {
        uint256 time;
        bytes uuid;
        bytes name;
    }

    function getPublicKeys(address addr) public view returns (bool registered, bytes32 key, bytes32 x, bytes32 y) {
        registered = userInfos[addr].key != bytes32(0) ;
        key = userInfos[addr].key;
        x = userInfos[addr].pubkey.x;
        y = userInfos[addr].pubkey.y;  
    }

    struct Email {
        bool isEncryption;
        uint256 time;
        address from;
        address to;
        bytes32 swarmLocation;
        //bytes uuid;
        //bytes title;
        //bytes fileUuid;
    }

    struct User {
        bytes32 key;
        PublicKey pubkey;
        // address fdContract;

        Email[] sentEmails;
        mapping(bytes32 => uint256) sentEmailIds;
        Email[] inboxEmails;
        mapping(bytes32 => uint256) inboxEmailIds;

        mapping(bytes => File) files;
    }

    // string public constant defaultEmail = "Hi,<br><br>Congratulations for opening your first web3 email!<br><br>Advices For Security:<br>1. Do not trust the content or open links from unknown senders.<br>2. We will never ask for your private key.<br><br>W3Mail is in alpha.<br><br>Best regards,<br>W3Mail Team";

    mapping(address => User) userInfos;

    constructor() {
        User storage user = userInfos[address(this)];
        user.key = keccak256('official');
    }

    receive() external payable {}

    function register(bytes32 key, bytes32 x, bytes32 y) public {
        User storage user = userInfos[msg.sender];
        require(user.key == bytes32(0), "Address is registered");

        user.key = key;
        user.pubkey = PublicKey(x, y);
        // FlatDirectory fileContract = new FlatDirectory(0);
        // user.fdContract = address(fileContract);

        // add default email
        // create email
        // Email memory dEmail;
        // dEmail.time = block.timestamp;
        // dEmail.from = address(this);
        // dEmail.to = msg.sender;
        // dEmail.uuid = 'default-email';
        // dEmail.title = 'Welcome to W3Mail!';
        // // add email
        // user.inboxEmails.push(dEmail);
        // user.inboxEmailIds['default-email'] = 1;
    }

    function sendEmail(
        address toAddress,
        bool isEncryption,
        bytes32 swarmLocation
    )
        public
        payable
        isRegistered
    {
        User storage toInfo = userInfos[toAddress];
        require(!isEncryption || toInfo.key != bytes32(0), "Unregistered users can only send unencrypted emails");
        User storage fromInfo = userInfos[msg.sender];
        // create email
        Email memory email;
        email.isEncryption = isEncryption;
        email.time = block.timestamp;
        email.from = msg.sender;
        email.to = toAddress;
        email.swarmLocation = swarmLocation;

        // add email
        fromInfo.sentEmails.push(email);
        fromInfo.sentEmailIds[swarmLocation] = fromInfo.sentEmails.length;
        toInfo.inboxEmails.push(email);
        toInfo.inboxEmailIds[swarmLocation] = toInfo.inboxEmails.length;

        // write email
        // FlatDirectory fileContract = FlatDirectory(fromInfo.fdContract);
        // fileContract.writeChunk{value: msg.value}(getNewName(uuid, 'message'), 0, encryptData);
    }

    // function writeChunk(bytes memory uuid, bytes memory name, uint256 chunkId, bytes calldata data) public payable {
    //     User storage user = userInfos[msg.sender];
    //     if (user.files[uuid].time == 0) {
    //         // first add file
    //         user.files[uuid] = File(block.timestamp, uuid, name);
    //     }

    //     FlatDirectory fileContract = FlatDirectory(user.fdContract);
    //     fileContract.writeChunk{value: msg.value}(getNewName('file', uuid), chunkId, data);
    // }

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
        User storage info = userInfos[msg.sender];
        require(info.sentEmailIds[swarmLocation] != 0, "Email does not exist");

        uint256 removeIndex = info.sentEmailIds[swarmLocation] - 1;
        // remove content
        Email memory email = info.sentEmails[removeIndex];
        if(userInfos[email.to].inboxEmailIds[swarmLocation] == 0) {
            // if inbox is delete
            removeContent(msg.sender, swarmLocation);
        }

        // remove info
        uint256 lastIndex = info.sentEmails.length - 1;
        if (lastIndex != removeIndex) {
            info.sentEmails[removeIndex] = info.sentEmails[lastIndex];
            info.sentEmailIds[info.sentEmails[lastIndex].swarmLocation] = removeIndex + 1;
        }
        info.sentEmails.pop();
        delete info.sentEmailIds[swarmLocation];
    }

    function removeInboxEmail(bytes32 swarmLocation) public {
        User storage info = userInfos[msg.sender];
        require(info.inboxEmailIds[swarmLocation] != 0, "Email does not exist");

        uint256 removeIndex = info.inboxEmailIds[swarmLocation] - 1;
        // remove content
        Email memory email = info.inboxEmails[removeIndex];
        if(userInfos[email.from].sentEmailIds[swarmLocation] == 0) {
            // if sent is delete
            removeContent(email.from, swarmLocation);
        }

        // remove info
        uint256 lastIndex = info.inboxEmails.length - 1;
        if (lastIndex != removeIndex) {
            info.inboxEmails[removeIndex] = info.inboxEmails[lastIndex];
            info.inboxEmailIds[info.inboxEmails[lastIndex].swarmLocation] = removeIndex + 1;
        }
        info.inboxEmails.pop();
        delete info.inboxEmailIds[swarmLocation];
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
        User storage info = userInfos[msg.sender];
        uint256 length = info.inboxEmails.length;
        isEncryptions = new bool[](length);
        times = new uint256[](length);
        fromMails = new address[](length);
        toMails = new address[](length);
        swarmLocations = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            isEncryptions[i] = info.inboxEmails[i].isEncryption;
            times[i] = info.inboxEmails[i].time;
            fromMails[i] = info.inboxEmails[i].from;
            toMails[i] = info.inboxEmails[i].to;
            swarmLocations[i] = info.inboxEmails[i].swarmLocation;
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
        User storage info = userInfos[msg.sender];
        uint256 length = info.sentEmails.length;
        isEncryptions = new bool[](length);
        times = new uint256[](length);
        fromMails = new address[](length);
        toMails = new address[](length);
        swarmLocations = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            isEncryptions[i] = info.sentEmails[i].isEncryption;
            times[i] = info.sentEmails[i].time;
            fromMails[i] = info.sentEmails[i].from;
            toMails[i] = info.sentEmails[i].to;
            swarmLocations[i] = info.inboxEmails[i].swarmLocation;
        }
    }

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
}