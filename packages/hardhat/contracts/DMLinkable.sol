//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract DMLinkable {
    struct TokenLink {
        uint256  tokenId; // what id
        bool     approved; // is it approved
    }
  
    bool public collectionNeedApproval;
    //mapping (uint256 => bool) private _tokenNeedsOwnerApprovalToAddLinks;  // who
    //mapping (uint256 => TokenLink[]) private _tokenOrigin; // where do i come from 
    mapping (uint256 => TokenLink[]) private _tokenLinks;  // who
    /*
    function addOrigin(uint256 toTokenId, address fromCollection, uint256 tokenId, bool approved) internal
    {
        TokenLink memory rtl;
        rtl.collection = fromCollection;
        rtl.tokenId = tokenId;
        rtl.approved = approved;

        _tokenOrigin[toTokenId].push(rtl); // who is in your 
    }*/
    function addLink(uint256 toTokenId, uint256 tokenId, bool approved) internal
    {
        TokenLink memory rtl;
        //rtl.collection = fromCollection;
        rtl.tokenId = tokenId;
        rtl.approved = approved;

        _tokenLinks[toTokenId].push(rtl); // who is in your 
    }
    function getLinks(uint256 tokenId) public view returns (TokenLink[] memory)
    {
        return _tokenLinks[tokenId];
    }
}