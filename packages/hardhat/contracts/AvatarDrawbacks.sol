// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0; 

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AvatarDrawbacks is ERC721, Ownable { 
    using Strings for string;  
    address public avatarCollection = address(0);
    struct Property { 
        uint256 avatarId;
        uint256 proficiency;  
        uint256 encumbrance;
        uint256 constraint;
        uint256 obstruction;
        uint256 strain; 
        uint256 pressure; 
        uint256 drawback;  
        uint256 points;        
    }
    Property[] public properties;
    mapping(uint256 => uint256) avatarToThis;  
    constructor() public ERC721("FDS AvatarDrawbacks", "Avatar Drawbacks")
    {    
    } 
 
    function setMinter(address newMinter) public {
       // does nothing as anyone can mint Avatar
    }
    function setAvatarCollection(address _avatarCollection) external
    {    
        require(avatarCollection==address(0), "already set"); 
        avatarCollection = _avatarCollection; 
    }
    function create(uint256 avatarId, address to, bytes32 randomness) public returns (uint256)
    {
        require(avatarToThis[avatarId]==0,"Avatar Has Drawbacks");
        require(msg.sender==avatarCollection, "!collection");

        uint256 newId = properties.length;
        uint256 random = _random(randomness);
        // always start with stats from 1 to 10 
        uint256 proficiency = 0; //1 + (random % 100) % 10;
        uint256 encumbrance = 0; //1 + ((random % 10000) / 100 ) % 10;
        uint256 constraint  = 0; //1 + ((random % 1000000) / 10000 ) % 10;
        uint256 obstruction = 0; //1 + ((random % 100000000) / 1000000 ) % 10;
        uint256 strain      = 0; //1 + ((random % 10000000000) / 100000000 ) % 10;
        uint256 pressure    = 0; //1 + ((random % 1000000000000) / 10000000000) % 10;
        //uint256 experience = 2;
        uint256 drawbackpoints = 0;// - (proficiency + encumbrance + constraint + obstruction + strain + pressure); // be fair and add skill points to unlucky

        properties.push(
            Property(
                avatarId, 
                proficiency,
                encumbrance,
                constraint,
                obstruction,
                strain,
                pressure,
                0,
                drawbackpoints
            )
        );
        _safeMint(to, newId);
        avatarToThis[avatarId] = newId;
        return newId;
    }

    function _random(bytes32 input) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(msg.sender, input, block.timestamp, blockhash(block.number-1))));
    }
    function getInfo(uint256 tokenId) public view returns (Property memory)
    {
        return  properties[tokenId];
    }
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    } 

    function getLevel(uint256 tokenId) public view returns (uint256) {
        return sqrt(properties[tokenId].drawback);
    }
    function upgrade(uint256 tokenId,  
            uint256 proficiency,
            uint256 encumbrance,
            uint256 constraint,
            uint256 obstruction,
            uint256 strain,
            uint256 pressure) 
            public 
    {
        require(_isApprovedOrOwner(tokenId),"!approved"); 
        uint available_skillpoints = properties[tokenId].points; // how much avatar can spend
        uint skillpoints = proficiency + encumbrance + constraint + obstruction + strain + pressure; 
        require(skillpoints<=available_skillpoints,"not enough skill points");

        uint cost = calculate_exp(proficiency, encumbrance, constraint, obstruction, strain, pressure);
        
        properties[tokenId].proficiency += proficiency;
        properties[tokenId].encumbrance += encumbrance;
        properties[tokenId].constraint += constraint;
        properties[tokenId].obstruction += obstruction;
        properties[tokenId].strain += strain;
        properties[tokenId].pressure += pressure;

        properties[tokenId].drawback += cost;
        properties[tokenId].points -= skillpoints;
    }
    function calc(uint score) public pure returns (uint) {
        if (score <= 12) {
            return score;
        } else {
            return ((score-2)**2)/8;
        }
    }
    function calculate_exp(uint _str, uint _dex, uint _const, uint _int, uint _wis, uint _cha) public pure returns (uint) {
        return calc(_str)+calc(_dex)+calc(_const)+calc(_int)+calc(_wis)+calc(_cha);
    }

    function _isApprovedOrOwner(uint256 tokenId) internal view returns (bool) {
        return getApproved(tokenId) == msg.sender || ownerOf(tokenId) == msg.sender || msg.sender == avatarCollection;
    }
}
