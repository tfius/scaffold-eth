// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol"; 

contract WAMSpring2022 is ERC721Enumerable {
    using Strings for string;  
    address public minter;
    struct Avatar { 
        uint256 level;  // 
        uint256 duePayment;  // 
        uint256 totalEarned;  // 
        uint256 journey;  // non zero when on journey, else starting time of journey
        uint256 lastJourneyDuration;   // last journey time in s
        uint256 totalTime;   // total time on journeys (/60 /60 to get hours)
        uint256 askCostPerH; // what is avatars cost per h (used for agreements)
        address agreedWith; // address of contract who agreed with this avatar
        uint256 mint;
        bytes32 swarmLocation; // what is avatars cost per h (used for agreements)
        string  name;
    }
 
    Avatar[] public avatars;

    uint256 public taskLevel;
    uint256 public lastMint;

    constructor() ERC721("WeAreMillions Spring 2022 Hackathon", "WAM Spring 22")
    {   
        minter=msg.sender;
    } 

    function setMinter(address _minter) public {
        require(msg.sender == minter);
        minter=_minter;
    }

    function create(address to, bytes32 swarmLocation) public returns (uint256) {
        require(msg.sender==minter, "!minter");
        uint id = createAvatar(to, "", swarmLocation);  // create without a name
        return id; 
    }

    function canMintXP(uint256 tokenId) public view returns (bool) {
        return avatars[tokenId].mint<lastMint; 
    }

    function prepareMint(uint256 _points) public {
        require(msg.sender==minter, "no rights");

        taskLevel = (_points % 10001); // cant get more than 10k XP
        lastMint = block.timestamp;
        return; 
    }

    function mint(uint256 tokenId) public returns (uint256) {
        require(_exists(tokenId), "!exists");
        require(avatars[tokenId].mint<lastMint, "minted round"); // was already minted

        avatars[tokenId].level += taskLevel;
        avatars[tokenId].mint = lastMint;
        return tokenId; 
    }    

    function setName(uint256 tokenId, string memory name) public returns (bool) {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId), 
            "ERC721: caller is not owner nor approved"
        );
        avatars[tokenId].name = name;
        return true; 
    }
    
    string public gateway = "https://gateway.fairdatasociety.org/bzz/";
    function setGateway(string memory newGateway) public virtual returns (string memory)  {
        require(msg.sender==minter);
        gateway = newGateway;
        return gateway;
    }

    function _baseURI() internal view override returns (string memory) {
        return gateway;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "!e");
        return string(abi.encodePacked(_baseURI(), bytes32string(avatars[tokenId].swarmLocation),"/"));
    }

    function contractURI() public pure returns (string memory) {
        return "https://resistance.fairdatasociety.org/wam-s22-metadata.json";
    }

    function setTokenURI(uint256 tokenId, bytes32 _tokenURI) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId), 
            "ERC721: transfer caller is not owner nor approved"
        );
        avatars[tokenId].swarmLocation = _tokenURI;
    }

    function createAvatar(address to, string memory _avatarName, bytes32 swarmLocation) internal returns (uint256)
    {
        uint256 newId = avatars.length;

        avatars.push(
            Avatar(
                0, // level
                0, // duePayment
                0, // total earned
                0, // journey
                0, // journeyLastDuration
                0, // totalH
                0, // askCostPerH
                address(0),  // agreedWith
                block.timestamp, // mint
                swarmLocation, // swarmLocation
                _avatarName
            )
        );
        _safeMint(to, newId);
        return newId; 
    }
    function getAvatarInfo(uint256 tokenId) public view returns (Avatar memory)
    {
        return avatars[tokenId];
    } 

    function _isApprovedOrOwner(uint256 tokenId) internal view returns (bool) {
        return getApproved(tokenId) == msg.sender || ownerOf(tokenId) == msg.sender;
    }

    function setCostPerH(uint tokenId, uint256 amount) public {
        require(msg.sender==ownerOf(tokenId),"!owner");
        require(avatars[tokenId].journey<1,"can't set while on journey");
        avatars[tokenId].askCostPerH = amount;
    }

    function getCostPerH(uint256 tokenId) public view returns (uint256) {
        return avatars[tokenId].askCostPerH;
    }

    function journeyStart(uint tokenId) public {
        require(_isApprovedOrOwner(tokenId), "not approved");
        require(avatars[tokenId].journey<1,"already on journey");
        avatars[tokenId].journey = block.timestamp;
        avatars[tokenId].agreedWith = _msgSender(); 
    } 

    function journeyFinish(uint tokenId) public {
        require(_isApprovedOrOwner(tokenId), "not approved"); 
        require(avatars[tokenId].journey>0, "not on journey");

        avatars[tokenId].lastJourneyDuration = (block.timestamp - avatars[tokenId].journey);
        avatars[tokenId].totalTime += avatars[tokenId].lastJourneyDuration;
        avatars[tokenId].journey = 0; // not on journey anymore

        uint timeInHours = (avatars[tokenId].lastJourneyDuration) / 60 / 60; // in hours 
        avatars[tokenId].duePayment += timeInHours * avatars[tokenId].askCostPerH; // amount earned
    }

    /// @dev call to get amount due
    /// @param tokenId totalEarned
    /// @return Documents the return variables of a contract’s function state variable
    function paymentDue(uint256 tokenId) public view returns (uint256) {
        return avatars[tokenId].duePayment;
    }

    function paymentProcessed(uint256 tokenId) public returns (uint256) {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId), 
            "ERC721: caller is not owner nor approved"
        );
        require(avatars[tokenId].agreedWith ==_msgSender(),"not agreed with sender");
        avatars[tokenId].totalEarned += avatars[tokenId].duePayment; // amount earned
        avatars[tokenId].duePayment = 0;

        return tokenId; 
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
}