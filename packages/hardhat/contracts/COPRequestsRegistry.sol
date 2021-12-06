// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CarbonOffsetProtocol.sol";
import "./COPIssuer.sol";

/// @title  COP Request Review Registry
/// @author Tadej Fius 
/// @notice This contract allows users to request reviews
///         reviewed addresses can be verified by COP issuer and COP tokens can be issued for requested address
/// @dev    1. requestReview for _receiver with data in dataHash
///         2. updateReview for _receiver with verification data in dataHash
///         3. rejectReview if not valid
///         4. completeReview if everything checks out ok 


contract COPRequestReviewRegistry is ReentrancyGuard, AccessControl { 
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant FINALIZER_ROLE = keccak256("FINALIZER_ROLE");

    string public constant NOTREVIEWER = "No reviewer role";
    string public constant NOTFINALIZER = "No finalizer role";

    string public constant NOTREVIEWED = "Not reviewed";
    string public constant INREVIEW = "In review process";
    string public constant INFINALIZATION = "In finalization of review";
    string public constant NOTINFINALIZATION = "Not in finalization";
    string public constant ALREADYACCEPTED = "Already accepted for verification";
    
    CarbonOffsetProtocol public copToken;

    string public   name = "Carbon Offset Protocol Request Registry";
    address public  owner;
    mapping(address => bool) public validators;
    address[] public allValidators; 

    struct ReviewRequest { 
        address candidate;
        address requestor; // who triggered review request 
        bytes32 requestorDataHash;
        address reviewer;
        bytes32 reviewerDataHash;
        uint    startTime;
        uint    endTime;
        uint    listPointer;
    }

    struct FinalizationRequest { 
        uint    listPointer;
    }

    constructor() 
    {
        owner = msg.sender;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
    }


    /***************************************************************************************************/ 
    /* Users request reviews */
    mapping(address => ReviewRequest) public reviewRequests;
    address[] public reviewList;

    mapping(address => ReviewRequest) public finalizationRequests;
    address[] public finalizationList; // those that are ready to be finalized

    mapping(address => bool) public reviewedAddresses;
    mapping(address => ReviewRequest) public reviews;

    event RequestReview(address approver, address receiver, ReviewRequest);
    event UpdateReview(address approver, ReviewRequest);
    event CompletedReview(address approver, ReviewRequest);
    event RejectReview(address approver, ReviewRequest); 

    function isAddressReviewed(address _receiver) public view returns (bool)
    {
        return reviewedAddresses[_receiver];
    }
    function getReview(address _receiver) public view returns (ReviewRequest memory)
    {
        return reviews[_receiver];
    }
    function revokeReviewedAddress(address _receiver) public view returns (bool)
    {
        require(hasRole(REVIEWER_ROLE, msg.sender) || 
                hasRole(FINALIZER_ROLE, msg.sender) || 
                hasRole(FINALIZER_ROLE, msg.sender) || 
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender), NOTREVIEWER);

        return reviewedAddresses[_receiver];
    }

    // addresses that went through review process and will be available in COP Issuer for verification

    function requestReview(address _receiver, bytes32 requestorDataHash) public returns(bool success) {
        require(reviewedAddresses[_receiver], ALREADYACCEPTED);
        require(isInReview(_receiver),INREVIEW);
        require(!isInFinalization(_receiver),INFINALIZATION);

        reviewList.push(_receiver);
        reviewRequests[_receiver].listPointer = reviewList.length - 1;

        reviewRequests[_receiver].requestor = msg.sender;
        reviewRequests[_receiver].requestorDataHash = requestorDataHash;
        reviewRequests[_receiver].candidate = _receiver;
        reviewRequests[_receiver].startTime = block.timestamp;

        emit RequestReview(msg.sender, _receiver, reviewRequests[_receiver]);
        return true;
    }

    function isInReview(address _receiver) public view returns(bool isIndeed) {
        if(reviewList.length == 0) return false;
        return (reviewList[reviewRequests[_receiver].listPointer] == _receiver);
    }

    function getReviewCount() public view returns(uint entityCount) {
        return reviewList.length;
    }


    function updateReview(address _receiver, bytes32 _reviewerDataHash) public returns(bool success) {
        require(hasRole(REVIEWER_ROLE, msg.sender), NOTREVIEWER);
        require(isInReview(_receiver), NOTREVIEWED);
        require(!isInFinalization(_receiver), NOTINFINALIZATION);
        
        reviewRequests[_receiver].reviewer = msg.sender;
        reviewRequests[_receiver].reviewerDataHash = _reviewerDataHash;
        reviewRequests[_receiver].endTime = block.timestamp;

        addToFinalization(_receiver); 

        emit UpdateReview(msg.sender, reviewRequests[_receiver]);
        return true;
    }

    function rejectReview(address _receiver) public returns(bool success) {
        require(hasRole(FINALIZER_ROLE, msg.sender), NOTREVIEWER);
        require(isInReview(_receiver), NOTREVIEWED);
        require(isInFinalization(_receiver), NOTINFINALIZATION);

        deleteFinalization(_receiver); 

        emit RejectReview(msg.sender, reviewRequests[_receiver]);
        return true;
    }

    function completeReview(address _receiver) public returns(bool success) {
        require(hasRole(FINALIZER_ROLE, msg.sender), NOTREVIEWER);
        require(isInReview(_receiver), NOTREVIEWED);
        require(isInFinalization(_receiver), NOTINFINALIZATION);

        reviewedAddresses[_receiver] = true;
        reviews[_receiver] = reviewRequests[_receiver]; 

        deleteReview(_receiver); // delete from reviews
        deleteFinalization(_receiver); 

        emit CompletedReview(msg.sender, reviewRequests[_receiver]);

        return true;
    }

    function deleteReview(address _receiver) internal returns(bool success) {
        require(!isInReview(_receiver), NOTREVIEWED);

        uint rowToDelete  = reviewRequests[_receiver].listPointer;
        address keyToMove = reviewList[reviewList.length-1];
        reviewList[rowToDelete] = keyToMove;
        reviewRequests[keyToMove].listPointer = rowToDelete;
        reviewList.pop();
        return true;
    }

    function isInFinalization(address _receiver) public view returns(bool isIndeed) {
        if(finalizationList.length == 0) return false;
        return (finalizationList[finalizationRequests[_receiver].listPointer] == _receiver);
    }
    function addToFinalization(address _receiver) public returns(bool success) {
        require(isInReview(_receiver),NOTREVIEWED);
        require(!isInFinalization(_receiver),INFINALIZATION);

        finalizationList.push(_receiver);
        finalizationRequests[_receiver].listPointer = finalizationList.length - 1;

        return true;
    }
    function deleteFinalization(address _receiver) internal returns(bool success) {
        require(isInFinalization(_receiver),NOTINFINALIZATION);

        uint rowToDelete = finalizationRequests[_receiver].listPointer;
        address keyToMove   = finalizationList[finalizationList.length-1];
        finalizationList[rowToDelete] = keyToMove;
        finalizationRequests[keyToMove].listPointer = rowToDelete;
        finalizationList.pop();
        return true;
    }

}
