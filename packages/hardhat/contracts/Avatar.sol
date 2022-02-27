// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol"; 

interface IAvatarAbility { 
    function setAvatarCollection(address _avatarCollection) external; // must be called from avatar collection immediatly
    function create(uint256 avatarId, address to) external returns (uint256);
    function upgrade(uint256 tokenId,  uint256 data/* uint256 strength, uint256 dexterity, uint256 constitution, uint256 intelligence, uint256 wisdom,uint256 charisma*/) external;
}
interface IAvatarReputation { 
    function setAvatarCollection(address _avatarCollection) external; // must be called from avatar collection immediatly
    function create(uint256 avatarId, address to) external returns (uint256);
    function upgrade(uint256 tokenId,  uint256 data /*uint256 proficiency, uint256 encumbrance, uint256 constraint, uint256 obstruction, uint256 strain, uint256 pressure*/) external;  
}
interface IAvatarPlur { 
    function setAvatarCollection(address _avatarCollection) external; // must be called from avatar collection immediatly
    function create(uint256 avatarId, address to) external returns (uint256);
    function upgrade(uint256 tokenId, uint256 data /* uint256 peace, uint256 love, uint256 unity, uint256 respect, uint256 courage, uint256 justice*/)  external; 
}
interface IAvatarRelatable { 
    function setAvatarCollection(address _avatarCollection) external; // must be called from avatar collection immediatly
    function create(uint256 avatarId, address to) external returns (uint256);
    function upgrade(uint256 tokenId, uint256 data /*uint256 proficiency, uint256 encumbrance, uint256 constraint, uint256 obstruction, uint256 strain, uint256 pressure*/)  external; 
}

contract Avatar is ERC721Enumerable, Ownable {
    using Strings for string;  
    address public minter;
    address public reviewer;
    //bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    struct Character { 
        uint256 skillId;  // skill id
        uint256 reputationId;  // reputation id
        uint256 plurId;  // drawback Id
        uint256 relatableId;  // relatable Id
        uint256 experience;  // non zero when on journey, else starting time of journey
        uint256 journey;  // non zero when on journey, else starting time of journey
        uint256 lastJourneyDuration;   // last journey time in s
        uint256 totalTime;   // total time on journeys (/60 /60 to get hours)
        uint256 askCostPerH; // what is avatars cost per h (used for agreements)
        uint256 mint;
        bytes32 swarmLocation; // what is avatars cost per h (used for agreements)
        string  name;
    }
 
    Character[] public avatars;
    mapping(address => uint256) ownerToToken;
    //mapping(bytes32 => uint256) nameToTokenId;

    bool    public canMint;
    uint256 public taskxp;
    uint256 public taskskill; 
    uint256 public taskreputation;
    uint256 public taskplur; 
    uint256 public taskrelatable;    
    uint256 public lastBlock;    
    uint256 public lastMint;
    
    uint constant xp_per_day = 240e18;
    uint constant xp_per_h = xp_per_day/24;
    uint constant cost_per_h = 30e18;

    IAvatarAbility public avatarAbility; 
    IAvatarReputation public avatarReputation; 
    IAvatarPlur public avatarPlur; 
    IAvatarRelatable public avatarRelatable; 

    constructor(address _avatarAbility, address _avatarReputation, address _avatarPlur, address _avatarRelatable) ERC721("FDS Avatar", "Avatar")
    {   
        avatarAbility=IAvatarAbility(_avatarAbility);
        avatarReputation=IAvatarReputation(_avatarReputation);
        avatarPlur=IAvatarPlur(_avatarPlur);
        avatarRelatable=IAvatarRelatable(_avatarRelatable);
    }

    function setMinter(address newMinter) public {
       // does nothing as anyone can mint Avatar
       if(minter==address(0))
          minter = newMinter;
    } 
    function setReviewer(address newReviewer) public {
       if(reviewer==address(0))
       {
          reviewer = newReviewer;
       }
       else 
       {
        require(msg.sender==minter, "!r");
        reviewer = newReviewer;
       }
    }
    function mint() public returns (uint256) {
        // add xp to avatar
        // token 
        require(canMint, "disabled");
        require(block.timestamp<lastBlock, "over");
        uint256 tokenId = ownerToToken[msg.sender];
        require(avatars[tokenId].mint!=lastMint, "minted");

        if(taskxp!=0)
        {
            avatars[tokenId].experience += taskxp;
        }

        if(taskskill!=0) {
            avatarAbility.upgrade(avatars[tokenId].skillId, taskskill);
        }
        if(taskreputation!=0) {
            avatarReputation.upgrade(avatars[tokenId].reputationId, taskreputation);
        }
        if(taskplur!=0) {
            avatarPlur.upgrade(avatars[tokenId].plurId, taskplur);
        }
        if(taskrelatable!=0) {
            avatarRelatable.upgrade(avatars[tokenId].relatableId, taskrelatable);
        }

        avatars[tokenId].mint = lastMint;
        return tokenId; 
    }

    function prepareMint(bool _canMint, uint256 _xp, uint256 _skill, uint256 _reputation, uint256 _plur, uint256 _relatable) public {
        require(msg.sender == minter || msg.sender== reviewer, "!mint!review");
        // add xp to avatar
        // token 
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
    function createNew(address to, bytes32 swarmLocation) public returns (uint256) {
        //bytes32 rRandomness = keccak256(abi.encodePacked(to, swarmLocation, block.number));
        uint id = createAvatar(to, "", swarmLocation);  // create without a name

        ownerToToken[to] = id;
        return id; 
    }

    function mintNewAvatar(string memory avatarName) public returns (uint256) {
        //bytes32 n = keccak256(abi.encodePacked(avatarName));
        //uint256 h = uint256(n);
        //bytes32 rRandomness = keccak256(abi.encodePacked(avatarName, randomness, block.number));
        uint id = createAvatar(msg.sender, avatarName, 0x0);  // create without a swarm location
        //nameToTokenId[n] = id; // will start with tokenId+1 so 0 is invalid 
        //tokenIdToName[id] = h;
        return id; 
    }

    /*
    function getTokenIdForName(string memory avatarName) public view returns (uint256 ) {
        bytes32 n = keccak256(abi.encodePacked(avatarName));
        require(nameToTokenId[n]!=0, "does not exist"); 
        return nameToTokenId[n];  
    }*/
 
    /*function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId); 
    }*/ 
    
    string public gateway = "https://gateway.fairdatasociety.org/bzz/";
    function setGateway(string memory newGateway) public virtual onlyOwner returns (string memory)  {
        gateway = newGateway;
        return gateway;
    }

    function _baseURI() internal view override returns (string memory) {
        return gateway;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "!exist");

        return string(abi.encodePacked(_baseURI(), bytes32string(avatars[tokenId].swarmLocation),"/"));
    }

    /*function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId), 
            "ERC721: transfer caller is not owner nor approved"
        );
        _setTokenURI(tokenId, _tokenURI);
    }*/ 

    function createAvatar(address to, string memory _avatarName, bytes32 swarmLocation) internal returns (uint256)
    {
        uint256 newId = avatars.length;
        //IAvatarAbility iaa = IAvatarAbility(avatarAbility);
        uint iaaId = avatarAbility.create(newId, to);
        uint iarId = avatarReputation.create(newId, to);
        uint iadId = avatarPlur.create(newId, to);
        uint iarelId = avatarRelatable.create(newId, to);

        avatars.push(
            Character(
                iaaId, // skill id
                iarId, // reputation id
                iadId, // iadId id
                iarelId, // iarId id relatable id
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
        require(msg.sender==ownerOf(tokenId),"!owner");
        avatars[tokenId].askCostPerH = amount;
    }

    function journeyStart(uint tokenId) public {
        require(_isApprovedOrOwner(tokenId),"!appr!owner");
        require(avatars[tokenId].journey<1,"on journey");
        avatars[tokenId].journey = block.timestamp;
    }

    function journeyFinish(uint tokenId) public {
        require(_isApprovedOrOwner(tokenId));
        require(avatars[tokenId].journey>0,"stalling");
        //uint diff = (block.timestamp - avatars[tokenId].journey) / 60 / 60 / 24; // in days 
        avatars[tokenId].lastJourneyDuration = (block.timestamp - avatars[tokenId].journey);
        
        avatars[tokenId].totalTime += avatars[tokenId].lastJourneyDuration;
        avatars[tokenId].journey = 0; // not on journey anymore

        // upgrade AvatarAbility  
        uint timeInHours = (avatars[tokenId].lastJourneyDuration) / 60 / 60; // in hours 
        avatars[tokenId].experience = timeInHours * xp_per_h; // each journey gets you experience per hour 
        // see if Any Agreement was made
        // invoke Agreement to be executed and value transfered 
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