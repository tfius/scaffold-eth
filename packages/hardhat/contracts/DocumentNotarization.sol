// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface ISwarmMail {
    function storeLocker(bytes32 swarmLocation) external payable;
    function shareLockerWith(bytes32 lockerLocation, bytes32 keyLocation, address withAddress) external payable;
    function unshareLockerWith(bytes32 lockerLocation, bytes32 keyLocation, address withAddress) external;
    function removeEmails(uint32 types, bytes32[] memory locations) external;
}

contract DocumentNotarization is AccessControl {
    // Define roles
    bytes32 public constant NOTARIZER_ROLE = keccak256("NOTARIZER_ROLE");
    bytes32 public constant ATTESTOR_ROLE = keccak256("ATTESTOR_ROLE");
    ISwarmMail public swarmMail;

    struct Document {
        uint256 timestamp; // when was the document notarized
        address owner; // who notarized the document
        bytes32 metaHash; // hash of the metadata
        //string metadata; // metadata
        bool isAttested; // has the document been attested
        //mapping(address => bool) attestations;
    }

    Document[] public documentList;
    mapping(bytes32 => Document) private documents; // document hash to document
    mapping(bytes32 => uint) private documentIndex; // document hash to index in documentList
    mapping(bytes32 => address[]) private documentAttestors; // document hash to list of attestors
    mapping(bytes32 => mapping(address => bool)) private documentAttestations; // document hash to attestor to attestation

    mapping(address => uint[]) public usersNotarizedDocuments; // find documents by owner

    mapping(bytes32 => uint) public proofsForDocument; // find documents by proof

    event DocumentNotarized(bytes32 indexed docHash, address indexed owner, uint256 timestamp);
    event DocumentAttested(bytes32 indexed docHash, address indexed attestor, bool attested);

    constructor(ISwarmMail _swarmMail) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); // Granting the deployer all permissions initially
        swarmMail = _swarmMail;
    }

    function notarizeDocument(bytes32 _docHash, bytes32 _metaHash, bytes32 _proofs) public onlyRole(NOTARIZER_ROLE) {
        require(documents[_docHash].timestamp == 0, "Document already notarized.");
        Document storage newDoc = documents[_docHash];
        newDoc.timestamp = block.timestamp;
        newDoc.owner = msg.sender;
        newDoc.metaHash = _metaHash;
        //newDoc.metadata = _metadata;
        newDoc.isAttested = false;
        documentList.push(newDoc);

        uint256 index = documentList.length; // we start at 1, not 0 - 1;
        documentIndex[_docHash] = index;

        swarmMail.storeLocker(_docHash);
        for(uint i = 0; i < _proofs.length; i++) {
            proofsForDocument[_proofs[i]] = index;
        }

        usersNotarizedDocuments[msg.sender].push(index);
        
        emit DocumentNotarized(_docHash, msg.sender, block.timestamp);
    }

    function attestDocument(bytes32 _docHash, bool _attest) public onlyRole(ATTESTOR_ROLE) {
        require(documents[_docHash].timestamp != 0, "Document not notarized.");
        require(documentAttestations[_docHash][msg.sender] != _attest, "Attestation status unchanged.");
        documentAttestations[_docHash][msg.sender] = _attest;
        if (_attest) {
            documentAttestors[_docHash].push(msg.sender);
        } else {
            // Remove attestor from the list
            for(uint i = 0; i < documentAttestors[_docHash].length; i++) {
                if(documentAttestors[_docHash][i] == msg.sender) {
                    documentAttestors[_docHash][i] = documentAttestors[_docHash][documentAttestors[_docHash].length - 1];
                    documentAttestors[_docHash].pop();
                    break;
                }
            }
        }
        emit DocumentAttested(_docHash, msg.sender, _attest);
    }

    function getDocumentByProof(bytes32 _proof) public view returns (Document memory) {
        require(proofsForDocument[_proof] != 0, "Document not found.");
        return documentList[proofsForDocument[_proof]];
    }

    function getDocumentByHash(bytes32 _docHash) public view returns (Document memory) {
        require(documents[_docHash].timestamp != 0, "Document not found.");
        return documents[_docHash];
    }

    function getAllUserNotarizedDocuments(address _user) public view returns (Document[] memory) {
        uint[] memory userDocs = usersNotarizedDocuments[_user];
        Document[] memory docs = new Document[](userDocs.length);
        
        for(uint i = 0; i < userDocs.length; i++) {
            docs[i] = documentList[userDocs[i]];
        }
        return docs;
    }
    function getUserNotarizedDocumentsCount(address _user) public view returns (uint) {
        return usersNotarizedDocuments[_user].length;
    }
    
    function getUserNotarizedDocuments(address user, uint start, uint length) public view returns (Document[] memory) {
        require(start < usersNotarizedDocuments[user].length, "Start out");
        if(start + length > usersNotarizedDocuments[user].length) {
           length = usersNotarizedDocuments[user].length - start;
        }
        Document[] memory docs = new Document[](length);
        for(uint i = 0; i < length; i++) {
            docs[i] = documentList[usersNotarizedDocuments[user][start + i]];
        }
        return docs;
    }

    // Function to check if a document has been attested by a specific attestor
    function isDocumentAttestedBy(bytes32 _docHash, address _attestor) public view returns (bool) {
        return documentAttestations[_docHash][_attestor];
    }

    // Function to get all attestors for a document
    function getDocumentAttestors(bytes32 _docHash) public view returns (address[] memory) {
        return documentAttestors[_docHash];
    }

    // Grant and revoke roles
    function grantNotarizerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(NOTARIZER_ROLE, account);
    }

    function revokeNotarizerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(NOTARIZER_ROLE, account);
    }

    function grantAttestorRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ATTESTOR_ROLE, account);
    }

    function revokeAttestorRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ATTESTOR_ROLE, account);
    }
}
