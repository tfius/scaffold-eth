// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0; 

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
//import "@openzeppelin/contracts/access/AccessControl.sol";

contract AvatarRelatable is ERC721, Ownable { 
    using Strings for string; 
    address public avatarCollection = address(0);
    struct Property { 
        uint256 avatarId;
        uint256 p1; //privacy;  
        uint256 p2; //interoperability;
        uint256 p3; //sovereignty;
        uint256 p4; //force_for_good;
        uint256 p5; //love; 
        uint256 p6; //loss;  
        uint256 level;  
        uint256 points;        
    }
    Property[] public properties; 
    mapping(uint256 => uint256) avatarToThis; 
    constructor() ERC721("FDS AvatarRelatable", "Avatar Relatable")
    {    
    } 

    function setMinter(address newMinter) public {
        
    }
    function setAvatarCollection(address _avatarCollection) external
    {    
        require(owner()==msg.sender,"!r"); //require(avatarCollection==address(0), "already set"); 
        avatarCollection = _avatarCollection; 
    }
    function create(uint256 avatarId, address to) public returns (uint256)
    {
        require(avatarToThis[avatarId]==0,"Avatar Has This Set");
        require(msg.sender==avatarCollection, "!collection");

        uint256 newId = properties.length;
        //uint256 random = _random(randomness);  
        // always start with stats from 1 to 10 
        /*
        uint256 identity = 0; //1 + (random % 100) % 10;
        uint256 fear     = 0; //1 + ((random % 10000) / 100 ) % 10;
        uint256 desire   = 0; //1 + ((random % 1000000) / 10000 ) % 10;
        uint256 grief    = 0; //1 + ((random % 100000000) / 1000000 ) % 10;
        uint256 love     = 0; //1 + ((random % 10000000000) / 100000000 ) % 10;
        uint256 loss     = 0; //1 + ((random % 1000000000000) / 10000000000) % 10; */
        //uint256 points   = 0;

        properties.push(
            Property(
                avatarId, 
                0,//identity,
                0,//fear,
                0,//desire,
                0,//grief,
                0,//love,
                0,//loss,
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
    function upgrade(uint256 tokenId, uint256 data)  public 
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
