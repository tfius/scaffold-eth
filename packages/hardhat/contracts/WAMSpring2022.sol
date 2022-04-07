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
    struct Character { 
        uint256 experience;  // non zero when on journey, else starting time of journey
        uint256 ability;  // non zero when on journey, else starting time of journey
        uint256 reputation;   // last journey time in s
        uint256 plur;   // total time on journeys (/60 /60 to get hours)
        uint256 askCostPerH; // what is avatars cost per h (used for agreements)
        uint256 mint;
        bytes32 swarmLocation; // what is avatars cost per h (used for agreements)
        string  name;
    }
 
    Character[] public avatars;
    mapping(address => uint256) public ownerToToken;

    bool    public canMint;
    uint256 public taskxp;
    uint256 public taskskill; 
    uint256 public taskreputation;
    uint256 public taskplur; 
    uint256 public taskrelatable;    
    uint256 public lastBlock;    
    uint256 public lastMint;
    

    constructor() ERC721("WAM Spring 2022 Hackathon", "WAM Spring 22")
    {   
        minter=msg.sender;
    }

    function create(address to, bytes32 swarmLocation) public returns (uint256) {
        require(msg.sender==minter, "!r");
        uint id = createAvatar(to, "", swarmLocation);  // create without a name
        ownerToToken[to] = id;
        return id; 
    }

    function mint() public returns (uint256) {
        // add xp to avatar token 
        require(canMint && block.timestamp<lastBlock, "over");
        uint256 tokenId = ownerToToken[msg.sender];
        require(avatars[tokenId].mint!=lastMint, "minted");

        if(taskxp!=0)
        {
            avatars[tokenId].experience += taskxp;
        }

        avatars[tokenId].mint = lastMint;
        return tokenId; 
    }
    function canUserMint(address _user) public view returns (bool) {
        return canMint && avatars[ownerToToken[_user]].mint!=lastMint && block.timestamp>lastBlock;
    }

    function prepareMint(bool _canMint, uint256 _xp, uint256 _skill, uint256 _reputation, uint256 _plur, uint256 _relatable) public {
        require(msg.sender==minter, "!r");

        // add xp to avatar - token 
        canMint = _canMint;
        taskxp = (_xp % 5001);
        taskskill =_skill;
        taskreputation = _reputation;
        taskplur = _plur;
        taskrelatable = _relatable; 

        lastMint = block.timestamp;
        lastBlock = lastMint + 5400; // 90min is mint time max
        return; 
    }

    function setName(string memory name) public returns (bool) {
        //require(ownerOf(tokenId) == msg.sender, "not owner");
        uint256 tokenId = ownerToToken[msg.sender];
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

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId), 
            "ERC721: transfer caller is not owner nor approved"
        );
        _setTokenURI(tokenId, _tokenURI);
    }

    // 0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419
    // 0x94e812c9e0a874a4d5e89ae0a6ae4818c5a69f2aa43bb7c8e0345bde244d16ee
    function createAvatar(address to, string memory _avatarName, bytes32 swarmLocation) internal returns (uint256)
    {
        uint256 newId = avatars.length;

        avatars.push(
            Character(
                0, // experience
                0, // journey
                0, // journeyLastDuration
                0, // totalH
                0, // askCostPerH
                block.timestamp, // mint
                swarmLocation, // swarmLocation
                _avatarName
            )
        );
        _safeMint(to, newId);
        return newId;
    }
    function getAvatarInfo(uint256 tokenId) public view returns (Character memory)
    {
        return avatars[tokenId];
    } 

    function _isApprovedOrOwner(uint256 tokenId) internal view returns (bool) {
        return getApproved(tokenId) == msg.sender || ownerOf(tokenId) == msg.sender;
    }

    function setCostPerH(uint tokenId, uint256 amount) public {
        require(msg.sender==ownerOf(tokenId),"!o");
        avatars[tokenId].askCostPerH = amount;
    }

    function journeyStart(uint tokenId) public {
        require(_isApprovedOrOwner(tokenId),"!a!o");
        require(avatars[tokenId].journey<1,"j");
        avatars[tokenId].journey = block.timestamp;
    } 

    function journeyFinish(uint tokenId) public {
        require(_isApprovedOrOwner(tokenId)); 
        require(avatars[tokenId].journey>0,"!j");

        avatars[tokenId].lastJourneyDuration = (block.timestamp - avatars[tokenId].journey);
        avatars[tokenId].totalTime += avatars[tokenId].lastJourneyDuration;
        avatars[tokenId].journey = 0; // not on journey anymore

        // upgrade AvatarAbility  
        uint timeInHours = (avatars[tokenId].lastJourneyDuration) / 60 / 60; // in hours 
        avatars[tokenId].experience = timeInHours * xp_per_h; // each journey gets you experience per hour 
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