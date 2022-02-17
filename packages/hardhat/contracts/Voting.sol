// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Goldinar.sol";
import "./Avatar.sol";
// We have to specify what version of compiler this code will compile with

contract Voting is AccessControl {
  /* mapping field below is equivalent to an associative array or hash.
  The key of the mapping is candidate name stored as type bytes32 and value is
  an unsigned integer to store the vote count
  */

  Goldinar public goldinarToken;
  Avatar public avatarToken;
  uint256 votePrize = 1 ether;
  uint256 nextVote = 100; //86400;
  mapping (bytes32 => uint256) public votesReceived;
  mapping (address => uint256) public lastVote;
  mapping (address => uint256) public numVotes;
  mapping (address => uint256) public votesLeft;

  event Voted(address collection, uint256 tokenId, address sender);
  
  /* This is the constructor which will be called once when you
  deploy the contract to the blockchain. When we deploy the contract,
  we will pass an array of candidates who will be contesting in the election
  */
  constructor(Goldinar _goldinarToken, Avatar _avatarToken) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    goldinarToken=_goldinarToken;
    avatarToken=_avatarToken; 
  }

  // This function returns the total votes a candidate has received so far
  function totalVotesFor(address collection, uint256 tokenId) view public returns (uint256) {
    bytes32 candidate = getTokenHash(collection, tokenId);
    return votesReceived[candidate];
  }

  // This function increments the vote count for the specified candidate. This
  // is equivalent to casting a vote
  function voteFor(address collection, uint256 tokenId) public {
    require(canVote(msg.sender), "can't vote yet");
    bytes32 candidate = getTokenHash(collection, tokenId);
    votesReceived[candidate] += 1;

    //if(votesLeft[msg.sender] == 0) {
       lastVote[msg.sender] = block.timestamp + nextVote; // next day
    /*} else 
       votesLeft[msg.sender] -= 1; 
    */
    numVotes[msg.sender] += 1;
    //votesLeft[msg.sender] = numVotes[msg.sender];

    goldinarToken.mint(msg.sender, votePrize); // send earned to wallet
    emit Voted(collection, tokenId, msg.sender);
  }

    /*
  function canVote() public view returns (bool){
    return lastVote[msg.sender] < block.timestamp;
  }*/
  function canVote(address addr) public view returns (bool){
    return lastVote[addr] < block.timestamp && avatarToken.balanceOf(addr)>0; // only those that have avatar can vote
  }
  /*
  function votes(address user) public view returns (uint256){
    return votesLeft[user];
  }*/

  function setVotePrize(uint256 newAmount) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not admin");
        votePrize = newAmount;
  } 
  function setTimeToVote(uint256 newAmount) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not admin");
        nextVote = newAmount;
  }

  function getTokenHash(address nftCollection, uint256 tokenId) public pure returns (bytes32)
    {
        return  keccak256(abi.encodePacked(nftCollection,tokenId));
    }
}