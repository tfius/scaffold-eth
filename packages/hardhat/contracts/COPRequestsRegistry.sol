// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./COPToken.sol";
import "./COPIssuer.sol";

/// @title  COP Request Review Registry
/// @author Tadej Fius 
/// @notice This contract allows users to request reviews
///         reviewed addresses can be verified by COP issuer and COP tokens can be issued for requested address
/// @dev    1. requestReview for _receiver with data in dataHash
///         2. approveReview for _receiver with verification data in dataHash
///         3. rejectReview if not valid
///         4. completeReview if everything checks out ok then review is completed  


contract COPRequestReviewRegistry is ReentrancyGuard, AccessControl { 
    bytes32 public constant ROLE_REVIEWER = keccak256("ROLE_REVIEWER");
    bytes32 public constant ROLE_FINALIZER = keccak256("ROLE_FINALIZER"); 

    string public constant NOROLE = "No role";
    string public constant NOTREVIEWER = "No reviewer role";
    string public constant NOTFINALIZER = "No finalizer role";
    string public constant NOTREVIEWERNOTOWNER = "No role No owner";

    string public constant INREVIEW = "In review";
    string public constant NOTINREVIEW = "Not in review";
    
    string public constant INFINALIZATION = "In finalization";
    string public constant NOTINFINALIZATION = "Not in finalization";

    // string public constant APROVED = "Already Approved";
    // string public constant NOTAPPROVED = "Not Approved";

    string public constant ALREADYACCEPTED = "Already accepted for verification";
    
    COPToken public copToken;

    string public   name = "Carbon Offset Protocol Request Registry";
    address public  owner;
    mapping(address => bool) public validators;
    address[] public allValidators; 

    struct ReviewRequest { 
        address candidate;

        address requestor; // who triggered review request 
        bytes32 requestorDataHash;
        uint    startTime;

        address reviewer;
        bytes32 reviewerDataHash;
        uint    reviewedTime;

        address finalizer;
        bytes32 finalizerDataHash;
        uint    endTime;
        
        uint    state; // 0 request, 1 approved, 2 finalized, 3 approver rejected, 4 finalization rejected
        uint    listPointer;
    }

    struct RequestIndex { 
        uint    listPointer;
    }

    constructor() 
    {
        owner = msg.sender;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
    }


    /***************************************************************************************************/ 
    /* Users request reviews */
    //mapping(address => ReviewRequest) public reviewRequests; // all requests
    mapping(address => ReviewRequest) public requests; // all requests are here

    mapping(address => RequestIndex) public reviewRequests; // what requests must be reviewed
    address[] public reviewRequestList; // those waiting for review 

    mapping(address => RequestIndex) public finalizationRequests; // what requests need to be finalized 
    address[] public finalizationList; // those that are ready to be finalized

    mapping(address => bool) public addressReviewed; //reviewedAddresses;
    //mapping(address => ReviewRequest) public completedReviews; // array of all completed reviews by address
    address[] public   approvedRequests; // those that are reviewed and finalized
    mapping(address => uint256) public addressToApprovedRequest; //reviewedAddresses;

    mapping(address => bytes32[]) public rejectionReasonsDataHash; // array of all completed reviews by address

    event RequestReview(address approver, address receiver, ReviewRequest);
    event ApproveReview(address approver, ReviewRequest);
    event FinalizeReview(address approver, ReviewRequest);
    event RejectReview(address approver, ReviewRequest); 
    event RejectFinalization(address approver, ReviewRequest); 

    function isInReview(address _receiver) public view returns(bool isIndeed) {
        if(reviewRequestList.length == 0) return false;
        return (reviewRequestList[reviewRequests[_receiver].listPointer] == _receiver);
    }
    function getReviewRequestsCount() public view returns(uint entityCount) {
        return reviewRequestList.length;
    }
    function getReviewRequests() public view returns(address[] memory)
    {
        return reviewRequestList;
    }
    function getReviewRequest(address _receiver) public view returns(ReviewRequest memory)
    {
        return requests[_receiver];
    }
    /*function getCompletedReview(address _receiver) public view returns (ReviewRequest memory)
    {
        return completedReviews[_receiver];
    }*/
    function getRejectionReasons(address _receiver) public view returns (bytes32[] memory)
    {
        return rejectionReasonsDataHash[_receiver];
    }
    function isInFinalization(address _receiver) public view returns(bool isIndeed) {
        if(finalizationList.length == 0) return false;
        return (finalizationList[finalizationRequests[_receiver].listPointer] == _receiver);
    }
    function getFinalizationCount() public view returns(uint entityCount) {
        return finalizationList.length;
    }
    function getFinalization(uint256 index) public view returns(address)
    {
        return finalizationList[index];
    }    
    function getFinalizations() public view returns(address[] memory)
    {
        return finalizationList;
    }

    function isAddressReviewed(address _receiver) public view returns (bool)
    {
        return addressReviewed[_receiver];
    }

    function getApprovedRequestCount() public view returns(uint entityCount) {
        return approvedRequests.length;
    }
    function getApprovedRequest(uint256 index) public view returns(address)
    {
        return approvedRequests[index];
    }    
    function getApprovedRequests() public view returns(address[] memory)
    {
        return approvedRequests;
    }

    /* @dev admin cen remove already reviewed address so it can apply again */  
    function revokeReviewedAddress(address _receiver) public returns (bool)
    {
        require(hasRole(ROLE_REVIEWER, msg.sender) || 
                hasRole(ROLE_FINALIZER, msg.sender) || 
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
                msg.sender == _receiver, NOTREVIEWERNOTOWNER);

        addressReviewed[_receiver] = false;
        return addressReviewed[_receiver];
    }

    // addresses that went through review process and will be available in COP Issuer for verification
    function requestReview(address _receiver, bytes32 requestorDataHash) public returns(bool success) {
        require(!isInReview(_receiver),INREVIEW);
        require(!isInFinalization(_receiver),INFINALIZATION);
        require(!addressReviewed[_receiver], ALREADYACCEPTED);

        requests[_receiver].requestor = msg.sender;
        requests[_receiver].requestorDataHash = requestorDataHash;
        requests[_receiver].candidate = _receiver;
        requests[_receiver].startTime = block.timestamp;
        requests[_receiver].state = 0; // request for approval

        addToReviews(_receiver);

        emit RequestReview(msg.sender, _receiver, requests[_receiver]);
        return true;
    }

    /** reviewer can update review request with his data  */
    function approveReview(address _receiver, bytes32 _reviewerDataHash) public returns(bool success) {
        require(hasRole(ROLE_REVIEWER, msg.sender), NOTREVIEWER);
        require(isInReview(_receiver), INREVIEW);
        require(!isInFinalization(_receiver), NOTINFINALIZATION);
        require(!addressReviewed[_receiver], ALREADYACCEPTED);
        
        requests[_receiver].reviewer = msg.sender; 
        requests[_receiver].reviewerDataHash = _reviewerDataHash;
        requests[_receiver].reviewedTime = block.timestamp;
        requests[_receiver].state = 1; // approved

        deleteReview(_receiver);
        addToFinalization(_receiver); 
        // addToApproved(_receiver);
 
        emit ApproveReview(msg.sender, requests[_receiver]);
        return true; 
    }  

    /** finalizer can complete review request if its in finalization */
    function finalizeReview(address _receiver, bytes32 _reviewerDataHash) public returns(bool success) {
        require(hasRole(ROLE_FINALIZER, msg.sender), NOTFINALIZER);
        require(!isInReview(_receiver), NOTINREVIEW);
        require(isInFinalization(_receiver), INFINALIZATION);

        addressReviewed[_receiver] = true;

        requests[_receiver].finalizer = msg.sender; 
        requests[_receiver].finalizerDataHash = _reviewerDataHash;
        requests[_receiver].endTime = block.timestamp;
        requests[_receiver].state = 2; // finalized

        // completedReviews[_receiver] = requests[_receiver]; 
        approvedRequests.push(_receiver);

        deleteFinalization(_receiver); // delete from finalizations
        //deleteReview(_receiver); // delete from reviews

        emit FinalizeReview(msg.sender, requests[_receiver]);

        return true;
    }
        /** finalizer role can reject review request if its in finaliation */
    function rejectReview(address _receiver, bytes32 _reviewerDataHash) public returns(bool success) {
        require(hasRole(ROLE_REVIEWER, msg.sender), NOTREVIEWER);
        require(isInReview(_receiver), NOTINREVIEW);
        require(!isInFinalization(_receiver), INFINALIZATION);

        requests[_receiver].state = 3; // approver rejected
        requests[_receiver].reviewerDataHash = _reviewerDataHash;

        rejectionReasonsDataHash[_receiver].push(_reviewerDataHash);
        addressReviewed[_receiver] = false;

        deleteReview(_receiver);

        emit RejectReview(msg.sender, requests[_receiver]);
        return true; 
    }
    function rejectFinalization(address _receiver, bytes32 _finalizationDataHash) public returns(bool success) {
        require(hasRole(ROLE_FINALIZER, msg.sender), NOTREVIEWER);
        require(!isInReview(_receiver), INREVIEW);
        require(isInFinalization(_receiver), NOTINFINALIZATION);
        
        requests[_receiver].state = 4; // finalizer rejected 
        requests[_receiver].finalizerDataHash = _finalizationDataHash;

        rejectionReasonsDataHash[_receiver].push(_finalizationDataHash);
        addressReviewed[_receiver] = false;

        //deleteApproved(_receiver); // no longer approved 
        //deleteReview(_receiver);
        deleteFinalization(_receiver); // no longer in finalization

        emit RejectFinalization(msg.sender, requests[_receiver]);
        return true; 
    }

    /***************************************************************************/
    /* INTERNAL */ 

    function addToReviews(address _receiver) internal returns(bool success) {
        require(!isInReview(_receiver),INREVIEW);
        // require(!isInFinalization(_receiver),INFINALIZATION);

        reviewRequestList.push(_receiver);
        reviewRequests[_receiver].listPointer = reviewRequestList.length - 1;

        return true;
    }

    function deleteReview(address _receiver) internal returns(bool success) {
        require(isInReview(_receiver), INREVIEW);

        uint rowToDelete  = reviewRequests[_receiver].listPointer;
        address keyToMove = reviewRequestList[reviewRequestList.length-1];

        reviewRequestList[rowToDelete] = keyToMove;
        reviewRequests[keyToMove].listPointer = rowToDelete;
        reviewRequestList.pop();
        return true;
    }


    function addToFinalization(address _receiver) internal returns(bool success) {
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
