// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0; 

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AvatarPlur is ERC721, Ownable { 
    using Strings for string;  
    address public avatarCollection = address(0);
    struct Property { 
        uint256 avatarId;
        uint256 p1; //peace;  
        uint256 p2; //love;
        uint256 p3; //unity;
        uint256 p4; //respect;
        uint256 p5; //courage; 
        uint256 p6; //justice; 
        uint256 level;  
        uint256 points;        
    }
    Property[] public properties;
    mapping(uint256 => uint256) avatarToThis;  
    constructor() ERC721("FDS AvatarPLUR", "Avatar PLUR")
    {    
    } 
 
    function setMinter(address newMinter) public {
    }
    function setAvatarCollection(address _avatarCollection) external
    {    
        require(avatarCollection==address(0), "already set"); 
        avatarCollection = _avatarCollection; 
    }
    function create(uint256 avatarId, address to) public returns (uint256)
    {
        require(avatarToThis[avatarId]==0,"Avatar Has PLUR");
        require(msg.sender==avatarCollection, "!collection");

        uint256 newId = properties.length;
        // uint256 random = _random(randomness);
        // always start with stats from 1 to 10 
        /*uint256 peace = 0; //1 + (random % 100) % 10;
        uint256 love = 0; //1 + ((random % 10000) / 100 ) % 10;
        uint256 unity  = 0; //1 + ((random % 1000000) / 10000 ) % 10;
        uint256 respect = 0; //1 + ((random % 100000000) / 1000000 ) % 10;
        uint256 courage      = 0; //1 + ((random % 10000000000) / 100000000 ) % 10;
        uint256 justice    = 0; //1 + ((random % 1000000000000) / 10000000000) % 10;
        //uint256 experience = 2;
        uint256 points = 0;// - (proficiency + encumbrance + constraint + obstruction + strain + pressure); // be fair and add skill points to unlucky
        */ 
        properties.push(
            Property(
                avatarId, 
                0,//peace,
                0,//love,
                0,//unity,
                0,//respect,
                0,//courage,
                0,//justice,
                0,
                0 //points
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
        return sqrt(properties[tokenId].level);
    }
    function upgrade(uint256 tokenId,  
            uint256 data/*
            uint256 peace,
            uint256 love,
            uint256 unity,
            uint256 respect,
            uint256 courage,
            uint256 justice*/) 
            public 
    {
        require(_isApprovedOrOwner(tokenId),"!approved");  

        properties[tokenId].p1 += (data % 100) % 10;
        properties[tokenId].p2 += ((data % 10000) / 100) % 10;
        properties[tokenId].p3 += ((data % 1000000) / 10000) % 10;
        properties[tokenId].p4 += ((data % 100000000) / 1000000) % 10;
        properties[tokenId].p5 += ((data % 10000000000)/ 100000000) % 10;
        properties[tokenId].p6 += ((data % 1000000000000)/ 10000000000) % 10;

        properties[tokenId].level  += 1;
        properties[tokenId].points += calculate_exp(properties[tokenId].p1,  
                                                    properties[tokenId].p2, 
                                                    properties[tokenId].p3, 
                                                    properties[tokenId].p4, 
                                                    properties[tokenId].p5, 
                                                    properties[tokenId].p6);

        /*
        require(_isApprovedOrOwner(tokenId) || msg.sender==minter,"!approved"); 
        uint available_skillpoints = properties[tokenId].points; // how much avatar can spend
        uint skillpoints = peace + love + unity + respect + courage + justice; 
        require(skillpoints<=available_skillpoints,"not enough skill points");

        uint cost = calculate_exp(peace, love, unity, respect, courage, justice);
        
        properties[tokenId].peace += peace;
        properties[tokenId].love += love;
        properties[tokenId].unity += unity;
        properties[tokenId].respect += respect;
        properties[tokenId].courage += courage;
        properties[tokenId].justice += justice;

        properties[tokenId].level += 1;
        properties[tokenId].points -= skillpoints; */
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
