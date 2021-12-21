pragma solidity >=0.8.0 <0.9.0;


interface IDMHelpers {
    function char(bytes1 b) external pure returns (bytes1 c);
    function stringToBytes32(string memory source) external pure returns (bytes32 result);
    function bytes32string(bytes32 b32) external pure returns (string memory out);
    function addressString(address x) external pure returns (string memory);
    function uint2str(uint _i) external pure returns (string memory _uintAsString);
}