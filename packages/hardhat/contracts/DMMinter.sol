//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Context.sol";
//import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";  

interface IDMCollection {
    struct TokenLink {
        //address  collection; // from where
        uint256  tokenId; // what id
        bool     approved; // is it approved
    }

    //function allTokensFrom(address _owner) external view returns (uint256[] memory);
    function tokenOfOwnerByIndex(address _owner, uint256 _index) external view returns (uint256);
    function ownerOfTokenOfData(bytes32 dataHash) external view returns (address);
    function tokenOfData(bytes32 dataHash) external view returns (uint256);

    //IERC20 
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    /*    
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool _approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external; 
    */
    function getLinks(uint256 tokenId) external view returns (TokenLink[] memory);
}
interface IDataMarket {
    function collectionGet(uint256 index) external view returns (IDMCollection);
    function collectionGetAll() external view returns (IDMCollection[] memory);
    function collectionAdd(IDMCollection newCollection) external returns (IDMCollection);
    function collectionFind(string memory collectionName) external view returns (int);
}

contract DMMinter {
    address public owner; 
    IDataMarket public dataMarket;

    mapping (uint256 => uint256) private _uniqness;
    mapping (uint256 => bool) private _userCreatableTemplates;  
    mapping (uint256 => uint256[]) private _requirements;
    mapping (uint256 => mapping (uint256 => uint256[2])) private _balanceRequirements;  

    /* create an ERC20 linked to ERC721 that can create new NFTs and mint them, those NFTS can mint ERC29 for value they have been created for */
    constructor (IDataMarket _dataMarket, address _owner) payable {
        dataMarket = _dataMarket;
        owner = _owner;
    } 

    function defineBalanceRequirements(uint256 reqCollectionIndex, uint256 targetCollectionIndex, uint256 minBalance, uint256 maxBalance) public
    {
        require(msg.sender==owner, "!om");
        _requirements[reqCollectionIndex].push(targetCollectionIndex);
        _balanceRequirements[reqCollectionIndex][targetCollectionIndex] = [minBalance, maxBalance];
    }
    function defineUniqueRequirements(uint256 collectionIndex, uint256 maxUniqness, bool _userCanCreataTemplate) public
    {
        require(msg.sender==owner, "!om");
        _uniqness[collectionIndex] = maxUniqness;
        _userCreatableTemplates[collectionIndex] = _userCanCreataTemplate;
    }
    function checkCreateableTemplates(uint256 collectionIndex) public view returns (bool)
    {
        require(_userCreatableTemplates[collectionIndex]==true,"!creatable"); 
        return _userCreatableTemplates[collectionIndex];
    }

    function checkRequirements(address to, uint256 collectionIndex, uint256 mintFromTemplateTokenId) public view returns (bool)
    {
        for(uint256 i=0;i<_requirements[collectionIndex].length;i++) 
        {
            IDMCollection rNFT = dataMarket.collectionGet(_requirements[collectionIndex][i]);
            uint256 bal = rNFT.balanceOf(to);
            uint256[2] memory limits = _balanceRequirements[collectionIndex][_requirements[collectionIndex][i]];

            require(bal>=limits[0],"!min"); // minimum requires minimum from other collection 

            rNFT = dataMarket.collectionGet(collectionIndex); // get amount in this collection
            require(rNFT.balanceOf(to)<limits[1],"!max"); // maximum
        } 
        // check for uniqness requirement  
        if(_uniqness[collectionIndex]>0)
        {
            IDMCollection uNFT = dataMarket.collectionGet(collectionIndex);
            for(uint i=0;i<uNFT.balanceOf(to);i++)
            {
                uint256 tokenId = uNFT.tokenOfOwnerByIndex(to, i);
                IDMCollection.TokenLink[] memory links = uNFT.getLinks(tokenId);
                for(uint k=0;k<links.length;k++)
                {
                   require(links[k].tokenId!=mintFromTemplateTokenId,"!uniq");
                }
                // TODO support for many > 1
            }
        }
        return true;
    }
}

