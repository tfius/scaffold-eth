//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import './interfaces/IDMHelpers.sol';

contract DMAddressable {
    IDMHelpers helpers;
    // Mapping from address to location 
    mapping (uint256 => address[]) internal _addressesWithData;
    //mapping (uint256 => mapping (address => bytes32)) internal _addressMetadata;
    mapping (uint256 => mapping (address => bytes32)) internal _addressData;
    /* @dev See if address has access to data and get it's referenced data location */

    constructor(IDMHelpers _helpers)
    {
       helpers = _helpers;
    }
    function addresables(uint256 tokenId) public view returns (address[] memory) {
        return _addressesWithData[tokenId];
    }  
 
    /* @dev creates a new reference with data for 'to' for metadata and data location */
    function addressablesAdd(uint256 tokenId, address to, /*bytes32 metadataSwarmLocation, */ bytes32 tokenDataSwarmLocation) internal virtual {
        if(_addressData[tokenId][to]==0) // does not exist  
           _addressesWithData[tokenId].push(to); //

        // should minting be split between all addresses ? 
        _addressData[tokenId][to]  = tokenDataSwarmLocation;  
    }
    /* @dev returns array of data */
    function addressablesJSON(uint256 tokenId) internal virtual view returns (string memory) {
        string memory data = "";
        for(uint256 i=0;i<_addressesWithData[tokenId].length;i++)
           string(abi.encodePacked(data, '{ "m":"0x', /*bytes32string(_addressMetadata[tokenId][_addressesWithData[tokenId][i]]),*/ // metadata information
                                         '" "d":"0x', helpers.bytes32string(_addressData[tokenId][_addressesWithData[tokenId][i]]),  // data location 
                                         '" "a":"0x', helpers.addressString(_addressesWithData[tokenId][i]), // can be collection           
                                         '"}',
                                         i<_addressesWithData[tokenId].length-1 ? ',' : ''
                                         )); // return data pairs of all addresses for all tokenIds 

        return string(abi.encodePacked('[',data,']')); // return json
    }
}