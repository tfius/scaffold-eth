//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol"; 
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import './DMAddressable.sol';
import './DMLinkable.sol';
import './interfaces/IDMHelpers.sol';

interface IDMCollection {
    function onCompose(address from, address to, address collection, uint256 tokenId) external returns (bytes4);
    function ownerOf(uint256 tokenId) external returns (address);
    function compose(bytes32 tokenHash, address sourceCollection, uint256 sourceTokenId) external returns (bool);
}
// import "hardhat/console.sol";
//import "@openzeppelin/contracts/utils/Strings.sol"; 
//import "@openzeppelin/contracts/utils/Address.sol"; 
//import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// import 'base64-sol/base64.sol';
//contract DMCollection is Context, ERC165, IERC721, IERC721Enumerable, DMAddressable, DMLinkable {
contract DMCollection is Context, ERC165, IERC721, DMAddressable, DMLinkable {
    using Address for address;
    using Counters for Counters.Counter;
    
    address payable public contractOwner;
    address payable public contractMinter;
    // Token name
    string public name;
    // Token symbol
    string public symbol;
    // Metadata location on swarm
    bytes32 public collectionMetadataLocation; 
    
    // Mapping from token ID to owner address
    mapping (uint256 => address) private _owners;
    // Mapping owner address to token count
    mapping (address => uint256) private _balances;
    // Mapping from token ID to approved address
    mapping (uint256 => address) private _tokenApprovals;
    // Mapping from owner to operator approvals
    mapping (address => mapping (address => bool)) private _operatorApprovals;
    
    // Mapping from tokenId to swarm location 
    mapping (uint256 => bytes32) internal _tokenDataLocation;
    mapping (uint256 => bytes32) internal _metadataLocation; 
    mapping (uint256 => address) internal _tokenCreator;
    mapping (uint256 => uint256) internal _tokenAmount;
    mapping (uint256 => bytes32) internal _tokenName;

    uint256[] public _tokenTemplates; // once template exists collection can mint only copies of templates
    // Mapping from swarmLocation to tokenId, data hash to tokenId
    mapping (bytes32 => uint256) internal tokenDataToToken;  
    // Mapping from owner to list of owned token IDs
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;  
    // Array with all token ids, used for enumeration
    uint256[] private _allTokens;
    // Mapping from token id to position in the allTokens array
    mapping(uint256 => uint256) private _ownedTokensIndex;
    // Mapping from token id to position in the allTokens array
    mapping(uint256 => uint256) private _allTokensIndex;   

    Counters.Counter private _tokenIdTracker;  
    
    bool public nonTransferable = false;
    uint public finiteCount = 0; // if 0=no finite count, else this defines how many one address can mint 

    /* @dev only minter can set params of collection*/
    function setCollectionParams(bool isNotTransferable, uint isFiniteCount) public {
        require(msg.sender==contractMinter,"!o!m");
        nonTransferable = isNotTransferable;
        finiteCount = isFiniteCount;
    }
    
    /* @dev Initializes the contract by setting a `name` and a `symbol` to the token collection. */ 
    constructor (string memory name_, string memory symbol_, IDMHelpers _helpers) DMAddressable(_helpers) payable { // payable ? 
        name = name_;
        symbol = symbol_;
        contractOwner = payable(msg.sender);
        contractMinter = payable(address(0)); //payable(msg.sender);// payable(msg.sender);
        _tokenIdTracker.increment(); // we start at 1 
    } 
    /* @dev See {IERC721Metadata-name}. */
    /*function name() public view virtual override returns (string memory) {
        return _name; 
    }*/ 
    /* @dev See {IERC721Metadata-symbol}. */
    /*function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }*/ 
    /* @dev returns totalSupply of NFT tokens */
    function totalSupply() public view virtual returns (uint256) {
        return _allTokens.length; 
    }

    /*function getOwner() public view returns (address) {
        return contractOwner;
    }*/ 
    /*function getMinter() public view returns (address) {
        return contractMinter; 
    }*/
    /*function getMetadata() public view returns (bytes32)
    {
        return collectionMetadataLocation;
    }*/ 
    /* @dev Sets new owner and receiver of funds got from creating new tokens */
    function setOwner(address newOwner) public {
        require(msg.sender==contractOwner,"!o");
        contractOwner = payable(newOwner);
    }
    /* @dev who can mint new NFTS */
    function setMinter(address newMinter) public {
        if(contractMinter==address(0)) 
        {
           contractMinter = payable(newMinter); 
           return; 
        } 

        require(msg.sender==contractOwner && msg.sender==contractMinter,"!o!m");
        contractMinter = payable(newMinter);   
    }
    function setMetadata(bytes32 newCollectionMetadataSwarmLocation) public
    {
        require(msg.sender==contractOwner || msg.sender==contractMinter,"!o");
        collectionMetadataLocation = newCollectionMetadataSwarmLocation;
    } 
    
    /* @dev See {IERC165-supportsInterface}. */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721).interfaceId
            || interfaceId == type(IERC721Metadata).interfaceId
            || interfaceId == type(IERC721Enumerable).interfaceId;
            //|| super.supportsInterface(interfaceId);
    }
    /* @dev See {IERC721-balanceOf}. */
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "0");
        return _balances[owner];
    }
    /* @dev See {IERC721-ownerOf}. */
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        require(_owners[tokenId] != address(0), "!e");
        return _owners[tokenId];
    } 
    function tokenOfData(bytes32 dataHash) public view virtual returns (uint256) {
        return tokenDataToToken[dataHash]; 
    }
    /* @dev get owner of token at index */
    function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256) {
      require(_index < balanceOf(_owner));
      return _ownedTokens[_owner][_index];
    }
    /* @dev See {IERC721Enumerable-tokenByIndex}.*/
    function tokenByIndex(uint256 index) public view virtual returns (uint256) {
        require(index < totalSupply(), ">");
        return _allTokens[index];
    }    
    /* @dev who created token */
    function tokenCreator(uint256 tokenId) public view virtual returns (address) {
        require(_exists(tokenId), "!e");
        return _tokenCreator[tokenId]; 
    }
    /* @dev amount in token */
    function tokenAmount(uint256 tokenId) public view virtual returns (uint256) {
        require(_exists(tokenId), "!e");
        return _tokenAmount[tokenId];
    }
    /* @dev See {IERC721-approve}. */
    function approve(address to, uint256 tokenId) public virtual override {
        address owner = ownerOf(tokenId);
        require(to != owner, "!2o");

        require(_msgSender() == owner || isApprovedForAll(owner, _msgSender()),"c!o!a");

        _approve(to, tokenId);
    }
    /* @dev See {IERC721-getApproved}. */
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        require(_exists(tokenId), "!e");

        return _tokenApprovals[tokenId];
    }
    /* @dev See {IERC721-setApprovalForAll}. */
    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(operator != _msgSender(), "c!a"); // not approved

        _operatorApprovals[_msgSender()][operator] = approved;
        emit ApprovalForAll(_msgSender(), operator, approved);
    }
    /* @dev See {IERC721-isApprovedForAll}. */
    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    /* @dev See {IERC721-transferFrom}. */
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), tokenId), "c!o!a");
        _transfer(from, to, tokenId);
    }
    /* @dev See {IERC721-safeTransferFrom}. */
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }
    /* @dev See {IERC721-safeTransferFrom}.*/
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "c!o!a");
        _safeTransfer(from, to, tokenId, _data);
    }
    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * `_data` is additional data, it has no specified format and it is sent in call to `to`.
     *
     * This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
     * implement alternative mechanisms to perform token transfer, such as signature-based.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory _data) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data), "2!R");
    }
    /**  
     * @dev Transfers `tokenId` from `from` to `to`. 
     *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
     *
     * Requirements: 
     *
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     *
     * Emits a {Transfer} event.
     */ 
    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ownerOf(tokenId) == from, "!o");
        require(to != address(0), "0x?");
        require(nonTransferable==false,"!tx"); 
        _beforeTokenTransfer(from, to, tokenId);
        _approve(address(0), tokenId); // Clear approvals from the previous owner
       
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }
    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {   
        require(_exists(tokenId), "!e");
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }
    /**
     * @dev Safely mints `tokenId` and transfers it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */ 
    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }
    /**
     * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`_safeMint`], with an additional `data` parameter which is
     * forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
     */
    function _safeMint(address to, uint256 tokenId, bytes memory _data) internal virtual {
        _mint(to, tokenId);
        require(_checkOnERC721Received(address(0), to, tokenId, _data), "2!R");
    } 
    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     *
     * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
     *
     * Requirements:
     * 
     * - `tokenId` must not exist.
     * - `to` cannot be the zero address.
     * 
     * Emits a {Transfer} event. 
     */ 
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "0x");
        require(!_exists(tokenId), "m"); // minted
        
        if(finiteCount>=1)
           require(_balances[to]<finiteCount, "2mch");  // limited how much address can have tokens from this collection
        
        _beforeTokenTransfer(address(0), to, tokenId);

        _balances[to] += 1;
        _owners[tokenId] = to;
        _tokenCreator[tokenId] = msg.sender;

        emit Transfer(address(0), to, tokenId);
    }
    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual {
        address owner = DMCollection.ownerOf(tokenId);

        _beforeTokenTransfer(owner, address(0), tokenId);

        // Clear approvals
        _approve(address(0), tokenId);
        _balances[owner] -= 1;

        _tokenDataLocation[tokenId] = 0;
        _metadataLocation[tokenId] = 0;
        _tokenCreator[tokenId] = address(0);
        _tokenAmount[tokenId] = 0;   
        
        delete _owners[tokenId];

        emit Transfer(owner, address(0), tokenId);
    }
    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits a {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private returns (bool) {
        //return true; // this is not 721
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
                return retval == IERC721Receiver(to).onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("!ERC721");
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
    }

    

    /*
function onERC721Received(address to, address collection, uint256 tokenId) private returns (bool)
    {
        // onCompose(from, to, address(this), tokenId);        
        if (to.isContract()) {
            try IDMCollection(to).onCompose(msg.sender, to, collection, tokenId) returns (bytes4 retval) {
                return retval == IERC721Receiver(to).onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("!DMCollection");
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
    }    
    
     */

    

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal  {

        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    } 
    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     */ 
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = balanceOf(to);
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length; 
    }
    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }    
    /**
     * @dev Private function to remove a token from this extension's ownership-tracking data structures. Note that
     * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
     * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
     * This has O(1) time complexity, but alters the order of the _ownedTokens array.
     * @param from address representing the previous owner of the given token ID
     * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
     */
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).
        uint256 lastTokenIndex = balanceOf(from) - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }
    /**
     * @dev Private function to remove a token from this extension's token tracking data structures.
     * This has O(1) time complexity, but alters the order of the _allTokens array.
     * @param tokenId uint256 ID of the token to be removed from the tokens list
     */
    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).
        uint256 lastTokenIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
        uint256 lastTokenId = _allTokens[lastTokenIndex];

        _allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        _allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete _allTokensIndex[tokenId];
        _allTokens.pop();
    }
     /** 
     * @dev Creates a new token for `to`. Its token ID will be automatically
     * assigned (and available on the emitted {IERC721-Transfer} event), and the token
     * URI autogenerated based on the base URI passed at construction.
     *
     * See {ERC721-_mint}.
     *
     * Requirements:
     * 
     * - the caller must be contractOwner
     */
    /*function mint(address to) public virtual {
        require(to==contractMinter,"!f"); 
    }*/
    /**
     * @dev if funds received return back to sender  
    */
    receive () external payable  {  
       payable(msg.sender).transfer(msg.value);  // return funds back to sender 
    }


    /* @dev Base URI for computing {tokenURI}. Empty by default, can be overriden in child contracts.*/
    function _baseURI() internal view virtual returns (string memory) {
        return string(abi.encodePacked(helpers.bytes32string(collectionMetadataLocation)));
    }
    string public gateway = "https://gateway.fairdatasociety.org/bzz/";
    function setGateway(string memory newGateway) public returns (string memory)  {
        require(msg.sender==contractOwner || msg.sender == contractMinter,"!o");
        gateway = newGateway;
        return gateway;
    }
    function tokenURI(uint256 tokenId) public view virtual returns (string memory) 
    {
        require(_exists(tokenId), "!e");

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, helpers.bytes32string(_tokenDataLocation[tokenId]),"/")) : "";

        //require(_exists(tokenId), "!e");
        //return string(abi.encodePacked("swarm://", helpers.bytes32string(_tokenDataLocation[tokenId])));
    } 
    function setTokenName(uint256 tokenId, string memory name) public 
    {
        require(msg.sender==ownerOf(tokenId), "!o");
        _tokenName[tokenId] = helpers.stringToBytes32(name);
    } 
    /**
     * @dev adds addressable data to tokenId, with triples to,metadata,data
    */
    function addDataLocation(uint256 tokenId/*, address to/*, bytes32 metadataSwarmLocation*/, bytes32 tokenDataSwarmLocation) public {
        require(msg.sender==ownerOf(tokenId), "!o"); // not owner
        dataLocationAdd( tokenId/*,  to,  metadataSwarmLocation*/, tokenDataSwarmLocation); 
    }


    /* @dev See {IERC721Metadata-tokenURI}.*/
    function tokenData(uint256 tokenId) public view virtual returns (string memory) {
        require(_exists(tokenId), "!e");
        return string(abi.encodePacked('{ "m": "0x', helpers.bytes32string(_metadataLocation[tokenId]), // metadata
                                       '","d": "0x', helpers.bytes32string(_tokenDataLocation[tokenId]), // data
                                       '","n": "0x', helpers.bytes32string(_tokenName[tokenId]),  // name
                                       '","a": "',   helpers.uint2str(_tokenAmount[tokenId]),  // amount
                                       '","c": "0x', helpers.addressString(_tokenCreator[tokenId]),  // creator
                                       '","o": "0x', helpers.addressString(_owners[tokenId]), '"}'));  // owner
                                                     // return data pairs of all addresses for all tokenIds         
        // return string(
        //     abi.encodePacked(
        //         'data:application/json;base64,',
        //         Base64.encode(
        //             bytes(
        //                 abi.encodePacked(
        //                     '{"name":"', name, tokenName[tokenId], 
        //                     '", "description":"', description,
        //                     '","image_data":"data:image/svg+xml;base64,',
        //                     image,
        //                     '","image":"data:image/svg+xml;base64,', 
        //                     image,
        //                     attributes
        //                 )
        //             )
        //         )
        //     )
        // );
        // return json;
    }
    /* Get All addresses and their data tied to this to token*/
    /*function tokenAddressables(uint256 tokenId) public view returns (string memory) {
        return string(abi.encodePacked('{ "o":"', ownerOf(tokenId), 
                                       '","r": ', super.addressablesJSON(tokenId), '}'));
    }*/  

    function _baseMint(address to) internal returns (uint256)
    {
        require(msg.sender==contractMinter, "!m");
        uint256 tokenId = _tokenIdTracker.current(); 
        _mint(to,  tokenId);
        _tokenIdTracker.increment();
        return tokenId;
    }
  
    function templateAdd(address to, string memory tokenName, uint256 duplicationPrice) public returns (uint256)
    {
        require(msg.sender==contractMinter, "!m");
        uint256 tokenId = _baseMint(to);
        _tokenName[tokenId] = helpers.stringToBytes32(tokenName);
        _tokenAmount[tokenId] = duplicationPrice;
        _tokenTemplates.push(tokenId); // once template exists collection can mint only copies of templates
        return tokenId;
    } 

    function templateCreatable(address from, address to, string memory tokenName, uint256 duplicationPrice) public returns (uint256)
    {
        uint256 tokenId = templateAdd(to, tokenName, duplicationPrice);
        _tokenCreator[tokenId] = from;
    }

    function templateMint(address to, uint256 fromTokenId, uint256 paymentReceived) public
    {
        require(_tokenAmount[fromTokenId] >= paymentReceived, "!$");
        uint256 tokenId = _baseMint(to);
        _tokenName[tokenId] = _tokenName[fromTokenId];
        addLink(fromTokenId, tokenId, true);
        addLink(tokenId, fromTokenId, true);
    }
    
    function getTemplateIndices() public view returns (uint256[] memory)
    {
        return _tokenTemplates;
    }


    /* @dev contract can call and create new NFTs */
    function mintForUser(address creator, uint256 amount, address to, bytes32 metadataSwarmLocation, bytes32 tokenDataSwarmLocation) public
    {
        require(_tokenTemplates.length==0, "=t"); // this contract has templates, minting for user not allowed

        require(msg.sender==contractOwner || msg.sender==contractMinter, "!om");
        creteNewRefLocation(creator, amount, to, metadataSwarmLocation, tokenDataSwarmLocation);
    }

    /* token creator, 
       amount 
       metadata location
       data location
    */
    function creteNewRefLocation(address creator, uint256 amount, address to, bytes32 metadataSwarmLocation, bytes32 tokenDataSwarmLocation) internal {
        require(tokenDataToToken[tokenDataSwarmLocation]==0, "ex"); // should be never claimed before 
        // uint256 tokenId = uint256(keccak256(abi.encodePacked(msg.sender))); // maybe we want different Id
        uint256 tokenId = _tokenIdTracker.current(); 
        _mint(to, tokenId);
        _tokenIdTracker.increment();
        
        _tokenCreator[tokenId]  = creator; 
        _tokenAmount[tokenId]  = amount;
        _metadataLocation[tokenId]  = metadataSwarmLocation;
        _tokenDataLocation[tokenId] = tokenDataSwarmLocation;
    
        tokenDataToToken[tokenDataSwarmLocation] = tokenId;  // so same location can't be minted twice 
    }

    function getTokenHash(address nftCollection, uint256 tokenId) public pure returns (bytes32)
    {
        return  keccak256(abi.encodePacked(nftCollection,tokenId));
    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    /// @title Composable DMCollection NFTs
    /// @author Tex
    /// @notice Composable interface for DMCollection, this is one way ticket, once composed, can't be decomposed 
    /// @dev Send sourceTokenId to another collection and bind it to whatTokenId 
    struct Composable { 
        address collection;  //
        uint256 tokenId;  //
    }
    mapping(bytes32 => Composable[]) public composed;

    function transferCompose(address from, uint256 sourceTokenId, address targetCollection, uint256 targetTokenId) external returns (bytes4) 
    {
      require(ownerOf(sourceTokenId) == msg.sender, "!o");
      //require(IDMCollection(toCollection).ownerOf(whatTokenId) == msg.sender, "2o");
      //require(toCollection.isContract(), "!c");

      _transfer(from, targetCollection, sourceTokenId);
      bytes32 tokenHash = getTokenHash(address(this),sourceTokenId); //getTokenHash(address(this),sourceTokenId);
      IDMCollection(targetCollection).compose(tokenHash, targetCollection, sourceTokenId); 
      //bytes32 tokenHash = getTokenHash(address(this),sourceTokenId); //getTokenHash(address(this),sourceTokenId);
      //composed[tokenHash].push(Composable(targetCollection, targetTokenId));
      return this.transferCompose.selector;
    }
    
    // TODO: needs checking to see that sourceCollection sourceTokenId is owned by msg.sender
    function compose(bytes32 tokenHash, address sourceCollection, uint256 sourceTokenId) external returns (bool) 
    {
      //require(IDMCollection(sourceCollection).ownerOf(sourceTokenId) == msg.sender, "2o");
      composed[tokenHash].push(Composable(sourceCollection, sourceTokenId));
      return true;
    }
    
    /*
    function onERC721Received(address operator, address to, uint256 tokenId, bytes memory _data) private returns (bool)
    {
        if (to.isContract()) {
            //try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
                return retval == IERC721Receiver(to).onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("!ERC721Receiver");
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

       return onCompose(operator, to, to, tokenId);
    }*/ 
    /*    
    function _transferCompose(address from, address to, uint256 tokenId, bytes memory _data) internal virtual {
        _transfer(from, to, tokenId);
        return onCompose(from, to, address(this), tokenId);
    }*/ 

    /*
    function decompose(address collection, uint256 tokenId, uint256 index) public {
      require(msg.sender == IERC721(collection).ownerOf(tokenId), "!owner");
      bytes32 tokenHash = getTokenHash(collection, tokenId);

       IERC721(composed[tokenHash][index].collection).transferFrom( // transfer from the collection
                 address(this), 
                 IERC721(collection).ownerOf(tokenId), // owner of
                 composed[tokenHash][index].tokenId);

      for (uint256 i = 0; i < composed[tokenHash].length; i++) {
             IERC721(composed[tokenHash][i].collection).transferFrom( // transfer from the collection
                 address(this), 
                 IERC721(collection).ownerOf(tokenId), // owner of
                 composed[tokenHash][i].tokenId);

      }
      delete composed[tokenHash];
    } */

    
}    