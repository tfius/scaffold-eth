//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// This can be used to add certificates, or any two pairs to 
contract PairFactory is Ownable, AccessControl {

    //hash => swarm hash
    mapping (bytes32 => bytes32) public pairs;
    mapping (bytes32 => uint) public collectionToIndex;
    bytes32[] public collection;

    event PairAdded(bytes32 hash, bytes32 swarmHash);
    event PairRemoved(bytes32 hash);

    function addPair(bytes32 _hash, bytes32 _swarmHash) onlyOwner() external {
        require(pairs[_hash] == 0x0, 'Certificate: This hash already exist');
        pairs[_hash] = _swarmHash;
        emit PairAdded(_hash, _swarmHash);

        collectionToIndex[_hash] = collection.length;
        collection.push(_hash);
    }

    function removePair(bytes32 _hash) onlyOwner() external {
        delete pairs[_hash];
        emit PairRemoved(_hash);

        uint k = collectionToIndex[_hash];

        if (collection.length > 1) {
            collection[k] = collection[collection.length-1];
        }
        collection.pop(); // remove last one
    }
}
