//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract DMAddressable {
    // Mapping from address to location 
    mapping (uint256 => address[]) internal _addressesWithData;
    //mapping (uint256 => mapping (address => bytes32)) internal _addressMetadata;
    mapping (uint256 => mapping (address => bytes32)) internal _addressData;

    /* @dev See if address has access to data and get it's referenced data location */
    function addresables(uint256 tokenId) public view returns (address[] memory) {
        return _addressesWithData[tokenId];
    }  
 
    /* @dev creates a new reference with data for 'to' for metadata and data location */
    function addressablesAdd(uint256 tokenId, address to, /*bytes32 metadataSwarmLocation, */ bytes32 tokenDataSwarmLocation) internal virtual {
        if(_addressData[tokenId][to]==0) // does not exist  
           _addressesWithData[tokenId].push(to); //

        // should minting be split between all addresses ? 
        //_addressMetadata[tokenId][to] = metadataSwarmLocation;
        _addressData[tokenId][to]  = tokenDataSwarmLocation;  
    }
    /* @dev returns array of data */
    function addressablesJSON(uint256 tokenId) internal virtual view returns (string memory) {
        string memory data = "";
        for(uint256 i=0;i<_addressesWithData[tokenId].length;i++)
           string(abi.encodePacked(data, '{ "m":"0x', /*bytes32string(_addressMetadata[tokenId][_addressesWithData[tokenId][i]]),*/ // metadata information
                                         '" "d":"0x', bytes32string(_addressData[tokenId][_addressesWithData[tokenId][i]]),  // data location 
                                         '" "a":"0x', addressString(_addressesWithData[tokenId][i]), // can be collection
                                         '"}',
                                         //'" "owner":"', owner, '"}',
                                         i<_addressesWithData[tokenId].length-1 ? ',' : ''
                                         )); // return data pairs of all addresses for all tokenIds 

        return string(abi.encodePacked('[',data,']')); // return json
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }
    /*function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }*/
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
    function addressString(address x) public pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function uint2str(uint _i) public pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}