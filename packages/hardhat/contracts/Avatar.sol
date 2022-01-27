// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/utils/Strings.sol";
interface IAvatarAbility { 
    function setAvatarCollection(address _avatarCollection) external; // must be called from avatar collection immediatly
    function create(uint256 avatarId, address to, bytes32 randomness) external returns (uint256);
    function upgrade(uint256 tokenId,  uint256 strength, uint256 dexterity, uint256 constitution, uint256 intelligence, uint256 wisdom,uint256 charisma) external;
}
interface IAvatarReputation { 
    function setAvatarCollection(address _avatarCollection) external; // must be called from avatar collection immediatly
    function create(uint256 avatarId, address to, bytes32 randomness) external returns (uint256);
    function upgrade(uint256 tokenId,  uint256 proficiency, uint256 encumbrance, uint256 constraint, uint256 obstruction, uint256 strain, uint256 pressure) external;  
}
interface IAvatarDrawbacks { 
    function setAvatarCollection(address _avatarCollection) external; // must be called from avatar collection immediatly
    function create(uint256 avatarId, address to, bytes32 randomness) external returns (uint256);
    function upgrade(uint256 tokenId, uint256 proficiency, uint256 encumbrance, uint256 constraint, uint256 obstruction, uint256 strain, uint256 pressure)  external; 
}
interface IAvatarRelatable { 
    function setAvatarCollection(address _avatarCollection) external; // must be called from avatar collection immediatly
    function create(uint256 avatarId, address to, bytes32 randomness) external returns (uint256);
    function upgrade(uint256 tokenId, uint256 proficiency, uint256 encumbrance, uint256 constraint, uint256 obstruction, uint256 strain, uint256 pressure)  external; 
}

contract Avatar is ERC721Enumerable, Ownable {
    using Strings for string;  
    struct Character { 
        uint256 skillId;  // skill id
        uint256 reputationId;  // reputation id
        uint256 drawbacksId;  // drawback Id
        uint256 relatableId;  // relatable Id
        uint256 experience;  // non zero when on journey, else starting time of journey
        uint256 journey;  // non zero when on journey, else starting time of journey
        uint256 lastJourneyDuration;   // last journey time in s
        uint256 totalTime;   // total time on journeys (/60 /60 to get hours)
        uint256 askCostPerH; // what is avatars cost per h (used for agreements)
        string  name;
    }
 
    Character[] public avatars;
    mapping(bytes32 => uint256) nameToTokenId;
    mapping(uint256 => uint256) tokenIdToName;
    
    uint constant xp_per_day = 240e18;
    uint constant xp_per_h = xp_per_day/24;
    uint constant cost_per_h = 30e18;

    IAvatarAbility public avatarAbility; 
    IAvatarReputation public avatarReputation; 
    IAvatarDrawbacks public avatarDrawbacks; 
    IAvatarRelatable public avatarRelatable; 

    constructor(address _avatarAbility, address _avatarReputation, address _avatarDrawbacks, address _avatarRelatable) public ERC721("FDS Avatar", "Avatar")
    {   
        avatarAbility=IAvatarAbility(_avatarAbility);
        avatarReputation=IAvatarReputation(_avatarReputation);
        avatarDrawbacks=IAvatarDrawbacks(_avatarDrawbacks);
        avatarRelatable=IAvatarRelatable(_avatarRelatable);
        //avatarAbility = IAvatarAbility(_avatarAbility); 
        //avatarAbility.setAvatarCollection(address(this)); 
    }
    function setMinter(address newMinter) public {
       // does nothing as anyone can mint Avatar
    } 

    function mintNewAvatar(string memory avatarName, bytes32 randomness) public returns (bytes32) {
        bytes32 n = keccak256(abi.encodePacked(avatarName));
        uint256 h = uint256(n);
        require(nameToTokenId[n]==0,"Name exists"); 

        bytes32 rRandomness = keccak256(abi.encodePacked(n, randomness, block.number));
        uint id = createAvatar(msg.sender, rRandomness, avatarName); 
        
        nameToTokenId[n] = id; // will start with tokenId+1 so 0 is invalid 
        tokenIdToName[id] = h;

        return rRandomness; 
    }

    function getTokenIdForName(string memory avatarName) public view returns (uint256 ) {
        bytes32 n = keccak256(abi.encodePacked(avatarName));
        require(nameToTokenId[n]!=0, "!exists"); 
        return nameToTokenId[n];  
    }
 
    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId); 
    }

    /*function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId), 
            "ERC721: transfer caller is not owner nor approved"
        );
        _setTokenURI(tokenId, _tokenURI);
    }*/ 

    function createAvatar(address to, bytes32 randomness, string memory _avatarName) internal returns (uint256)
    {
        uint256 newId = avatars.length;
        //IAvatarAbility iaa = IAvatarAbility(avatarAbility);
        uint iaaId = avatarAbility.create(newId, to, randomness);
        uint iarId = avatarReputation.create(newId, to, randomness);
        uint iadId = avatarDrawbacks.create(newId, to, randomness);
        uint iarelId = avatarRelatable.create(newId, to, randomness);

        avatars.push(
            Character(
                iaaId, // skill id
                iarId, // reputation id
                iadId, // iadId id
                iarelId, // iarId id relatable id
                1, // experience
                0, // journey
                0, // journeyLastDuration
                0, // totalH
                0, // askCostPerH
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
    /*function getAvatarInfo(uint256 tokenId) 
        public
        view
        returns ( 
            string memory name,
            uint256 experience,
            uint256 journey,
            uint256 lastJourneyDuration, 
            uint256 totalTime,
            uint256 askCostPerH
        ) 
    {
        return ( 
            avatars[tokenId].name,
            avatars[tokenId].experience,
            avatars[tokenId].journey,
            avatars[tokenId].lastJourneyDuration, 
            avatars[tokenId].totalTime,
            avatars[tokenId].askCostPerH
        );
    }*/

    /*function upgradeAvatar(uint256 tokenId,  
            uint256 strength
           ) 
            internal 
    {
        require(_isApprovedOrOwner(tokenId)); 

    } */

    function _isApprovedOrOwner(uint256 tokenId) internal view returns (bool) {
        return getApproved(tokenId) == msg.sender || ownerOf(tokenId) == msg.sender;
    }

    function setCostPerH(uint tokenId, uint256 amount) public {
        require(msg.sender==ownerOf(tokenId));
        avatars[tokenId].askCostPerH = amount;
    }

    function journeyStart(uint tokenId) public {
        require(_isApprovedOrOwner(tokenId));
        require(avatars[tokenId].journey<1,"already on journey");
        avatars[tokenId].journey = block.timestamp;
    }

    function journeyFinish(uint tokenId) public {
        require(_isApprovedOrOwner(tokenId));
        require(avatars[tokenId].journey>0,"not on journey");
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

}