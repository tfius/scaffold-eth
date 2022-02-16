// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0; 

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// Holds information what tokens from any collection are composed of
contract DMComposable   { 

    struct Composable { 
        address collection;  //
        uint256 tokenId;  //
    }

    // what collection what tokens are composed of what tokens from what collection
    mapping(bytes32 => Composable[]) composed;
    mapping(bytes32 => uint256[]) composableTokens;

    /*
     * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
     * The call is not executed if the target address is not a contract.
     *
     * @param from address representing the previous owner of the given token ID
     * @param to target address that will receive the tokens
     * @param tokenId uint256 ID of the token to be transferred
     * @param _data bytes optional data to send along with the call
     * @return bool whether the call correctly returned the expected magic value
     */
     /*
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private returns (bool) {
        if (isContract(to)) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
                return retval == IERC721Receiver(to).onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver");
                } else {
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }*/

    function onCompose(address from, address to, address collection, uint256 tokenId) external returns (bytes4) 
    {
      require(IERC721(collection).ownerOf(tokenId) == from, "!yours.");
      bytes32 tokenHash = getTokenHash(collection,tokenId);
      composed[tokenHash].push(Composable(collection,tokenId));
      return this.onCompose.selector;
    }
    
    function decompose(address collection, uint256 tokenId) external {
      require(msg.sender == IERC721(collection).ownerOf(tokenId), "!owner");
      bytes32 tokenHash = getTokenHash(collection, tokenId);

      for (uint256 i = 0; i < composed[tokenHash].length; i++) {
             IERC721(composed[tokenHash][i].collection).transferFrom( // transfer from the collection
                 address(this), 
                 IERC721(collection).ownerOf(tokenId), // owner of
                 composed[tokenHash][i].tokenId);

      }
      delete composed[tokenHash];
    } 


    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function getTokenHash(address nftCollection, uint256 tokenId) public pure returns (bytes32)
    {
        return  keccak256(abi.encodePacked(nftCollection,tokenId));
    }
}