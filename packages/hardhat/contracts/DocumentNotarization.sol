// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract DocumentNotarization is AccessControl {
    // Define roles
    bytes32 public constant NOTARIZER_ROLE = keccak256("NOTARIZER_ROLE");
    bytes32 public constant ATTESTOR_ROLE = keccak256("ATTESTOR_ROLE");

    struct Document {
        uint256 timestamp;
        address owner;
        string metadata;
        bool isAttested;
        mapping(address => bool) attestations;
    }

    mapping(bytes32 => Document) private documents;
    mapping(bytes32 => address[]) private documentAttestors;

    event DocumentNotarized(bytes32 indexed docHash, address indexed owner, uint256 timestamp, string metadata);
    event DocumentAttested(bytes32 indexed docHash, address indexed attestor, bool attested);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); // Granting the deployer all permissions initially
    }

    function notarizeDocument(bytes32 _docHash, string memory _metadata) public onlyRole(NOTARIZER_ROLE) {
        require(documents[_docHash].timestamp == 0, "Document already notarized.");
        Document storage newDoc = documents[_docHash];
        newDoc.timestamp = block.timestamp;
        newDoc.owner = msg.sender;
        newDoc.metadata = _metadata;
        newDoc.isAttested = false;
        emit DocumentNotarized(_docHash, msg.sender, block.timestamp, _metadata);
    }

    function attestDocument(bytes32 _docHash, bool _attest) public onlyRole(ATTESTOR_ROLE) {
        require(documents[_docHash].timestamp != 0, "Document not notarized.");
        require(documents[_docHash].attestations[msg.sender] != _attest, "Attestation status unchanged.");
        documents[_docHash].attestations[msg.sender] = _attest;
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

    // Function to check if a document has been attested by a specific attestor
    function isDocumentAttestedBy(bytes32 _docHash, address _attestor) public view returns (bool) {
        return documents[_docHash].attestations[_attestor];
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
