// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./COPToken.sol";
import "./IDateTime.sol";

interface ICOPRequestsRegistry  {

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

    function isAddressReviewed(address _receiver) external view returns (bool);
    function getReview(address _receiver) external view returns (ReviewRequest memory);
}
/// @title  COP Issuer
/// @author Tadej Fius 
/// @notice This contract defines procedure to issue COP tokens 
//          can issue tokens to address only if all demands are met, KYC, approved by Investor, Producer, Manufacturer, Amount of tokens that cah be issued 
//          COP tokens have expiry,
/// @dev 
///      
contract COPIssuer is ReentrancyGuard, AccessControl {  
    bytes32 public constant ROLE_ADDVALIDATOR = keccak256("ROLE_ADDVALIDATOR");
    bytes32 public constant ROLE_KYC_VALIDATOR = keccak256("ROLE_KYC_VALIDATOR");
    bytes32 public constant ROLE_INVEST_VALIDATOR = keccak256("ROLE_INVEST_VALIDATOR");
    bytes32 public constant ROLE_MANUFACTURER_VALIDATOR = keccak256("ROLE_MANUFACTURER_VALIDATOR");
    bytes32 public constant ROLE_PRODUCTION_VALIDATOR = keccak256("ROLE_PRODUCTION_VALIDATOR");

    string public constant NOTREVIEWED = "Address not reviewed";
    string public constant NOTVALIDATOR = "Not Validator";
    string public constant NORIGHTS = "No rights";
    string public constant CANTADDVALIDATOR = "Can't add Validator"; 
    string public constant NOTKYC = "Not KYC";
    string public constant NOTINVESTOR = "Not investor";
    string public constant NOTMANUFACTURER = "Not manufacturer";
    string public constant NOTPRODUCTION = "Not production";
    string public constant AMOUNTNOTVALIDATED = "Amount not validated";
    string public constant INVALIDAMOUNT = "Invalid Amount";
    string public constant ALREADYISSUEDYEAR = "Already Issued Tokens For Year";

    COPToken public copToken;
    IDateTime            public dateTimeContract;
    ICOPRequestsRegistry public requestReviewRegistry;

    string public   name = "Carbon Offset Protocol Issuer";
    address public  owner;
    //mapping(address => bool) public validators;
    //address[] public allValidators; 

    struct ValidationProcedure { 
        bool kyc;
        bool investor;
        bool manufacturer;
        bool production;
        uint amountIssued;
        uint amountApproved;
    }
    struct ValidationSignatures { 
        bytes32 kyc;
        bytes32 investor;
        bytes32 manufacturer;
        bytes32 production;
    }
    struct IssuanceEvent { 
        uint time;
        uint amount;
        bytes32 proof;
    }

    mapping(address => ValidationProcedure)  public validationProcedures; // validation procedure status per address
    mapping(address => ValidationSignatures) public validationSignatures; // validation procedure status per address
    mapping(address => IssuanceEvent[])      public issuedEvents; // all issuance events per address

    uint256 public  totalIssued = 0; // all issued tokens
    mapping(uint16 => uint) public issuedPerYear; // how much was issued per year
    mapping(uint16 => mapping(address => uint)) public perYearIssuedTokensToAddress; // how much each address was issued to per year 

    event Minted(address issuer, address indexed to, uint amount);
    event AddValidator(address issuer, address validator, bytes32 role);
    event RemoveValidator(address issuer, address validator);
    event VerifiedKYC(address issuer, address to, bool verified);
    event VerifiedInvestor(address issuer, address to, bool verified);
    event VerifiedManufacture(address issuer, address to, bool verified);
    event VerifiedProduction(address issuer, address to, bool verified);

    constructor(IDateTime _dateTimeContract, COPToken _copToken, ICOPRequestsRegistry _requestReviewRegistry) 
    {
        owner = msg.sender;
        dateTimeContract = _dateTimeContract;
        copToken = _copToken;
        requestReviewRegistry = _requestReviewRegistry;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
    }

    function mint(address _to) nonReentrant public {
        require(requestReviewRegistry.isAddressReviewed(_to), NOTREVIEWED);
        checkValidationProcedure(_to); // address must be approved with all validation steps

        uint16 year = dateTimeContract.getYear(block.timestamp);
        //require(perYearIssuedTokensToAddress[year][to] == 0, ALREADYISSUEDYEAR); // can be issued many times a year if production amount is verified (added after issuance)

        uint256 amount = validationProcedures[_to].amountApproved;
        require(amount!=0, INVALIDAMOUNT); 

        issuedEvents[_to].push(
            IssuanceEvent(
                block.timestamp, 
                amount,
                keccak256(abi.encode(validationProcedures[_to], block.timestamp))
                )
            ); 
        
        totalIssued += amount;
        issuedPerYear[year] += amount;  
        // check if this address had tokens issued this year 
        
        perYearIssuedTokensToAddress[year][_to] += amount;
        validationProcedures[_to].amountIssued += amount;
        validationProcedures[_to].amountApproved = 0; // cant issue any more until production validator validates new amount, then it can be minted next year 

        copToken.mint(_to, amount); // mint tokens for address 
        emit Minted(msg.sender, _to, amount);
    }

    /* get issued tokens per year for address */
    function getIssuedPerYear(uint16 year, address _address) public view returns (uint) {
        return perYearIssuedTokensToAddress[year][_address];
    }
    /* CHECK VALIDATION PROCEDURE STATUS */
    function getValidationProcedure(address _to) public view returns (ValidationProcedure memory) {
        return validationProcedures[_to];
    }
    function checkValidationProcedure(address _to) public view returns (bool)
    {
        require(validationProcedures[_to].kyc==true, NOTKYC);
        require(validationProcedures[_to].investor==true, NOTINVESTOR);
        require(validationProcedures[_to].manufacturer==true, NOTMANUFACTURER);
        require(validationProcedures[_to].production==true, NOTPRODUCTION);

        return true;
    }
    /* ISSUANCE EVENTS */
    function getIssuanceEvents(address _to) public view returns (IssuanceEvent[] memory) {
        return issuedEvents[_to];
    }
    function getIssuanceEventsCount(address _to) public view returns (uint256) {
        return issuedEvents[_to].length;
    }
    function getIssuanceEvent(address _to, uint256 eventIndex) public view returns (IssuanceEvent memory) {
        return issuedEvents[_to][eventIndex];
    }
    /* VALIDATOR MANAGEMENT */
    function isValidator(address _address) public view returns (bool) {
        return hasRole(ROLE_KYC_VALIDATOR, _address) || 
               hasRole(ROLE_INVEST_VALIDATOR, _address) || 
               hasRole(ROLE_MANUFACTURER_VALIDATOR, _address) || 
               hasRole(ROLE_PRODUCTION_VALIDATOR, _address) || 
               hasRole(DEFAULT_ADMIN_ROLE, _address);
    }
    function approveValidator(address _to, bytes32 _role) nonReentrant public {
        require(hasRole(ROLE_ADDVALIDATOR, msg.sender), CANTADDVALIDATOR);
        
        grantRole(_role, _to);  // validator now has role 
        emit AddValidator(msg.sender, _to, _role);
    }
    function removeValidator(address _to) nonReentrant public {
        require(isValidator(_to) == true, NOTVALIDATOR); 
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || 
                hasRole(ROLE_ADDVALIDATOR, msg.sender), NORIGHTS);

        if (hasRole(ROLE_ADDVALIDATOR, _to)) 
            revokeRole(ROLE_ADDVALIDATOR, _to);

        if (hasRole(ROLE_KYC_VALIDATOR, _to)) 
            revokeRole(ROLE_KYC_VALIDATOR, _to);

        if (hasRole(ROLE_INVEST_VALIDATOR, _to))     
            revokeRole(ROLE_INVEST_VALIDATOR, _to);

        if (hasRole(ROLE_MANUFACTURER_VALIDATOR, _to))     
            revokeRole(ROLE_MANUFACTURER_VALIDATOR, _to);

        if (hasRole(ROLE_PRODUCTION_VALIDATOR, _to))      
            revokeRole(ROLE_PRODUCTION_VALIDATOR, _to);

        emit RemoveValidator(msg.sender, _to);
    }

    /* VERIFY ADDRESS FOR VALIDATION STEPS */ 
    function verify(address _to, bytes32 _messageHash, bool _isVerified) nonReentrant public {
        //require(validators[msg.sender] = true, NOTVALIDATOR); 
        require(requestReviewRegistry.isAddressReviewed(_to), NOTREVIEWED);
        require(hasRole(ROLE_KYC_VALIDATOR, msg.sender) || 
                hasRole(ROLE_INVEST_VALIDATOR, msg.sender) || 
                hasRole(ROLE_MANUFACTURER_VALIDATOR, msg.sender) || 
                hasRole(ROLE_PRODUCTION_VALIDATOR, msg.sender), NOTVALIDATOR);

        if(hasRole(ROLE_KYC_VALIDATOR, msg.sender) && validationProcedures[_to].kyc==false)
        {
            validationProcedures[_to].kyc = _isVerified; 
            validationSignatures[_to].kyc = _messageHash; 
            emit VerifiedKYC(msg.sender, _to, _isVerified);  
            return;
        }
        if(hasRole(ROLE_INVEST_VALIDATOR, msg.sender) && validationProcedures[_to].investor==false)
        {
            validationProcedures[_to].investor = _isVerified; 
            validationSignatures[_to].investor = _messageHash; 
            emit VerifiedInvestor(msg.sender, _to, _isVerified);  
            return;
        }
        if(hasRole(ROLE_MANUFACTURER_VALIDATOR, msg.sender) && validationProcedures[_to].manufacturer==false)
        {
            validationProcedures[_to].manufacturer = _isVerified;     
            validationSignatures[_to].manufacturer = _messageHash; 
            emit VerifiedManufacture(msg.sender, _to, _isVerified);  
            return;
        }
        if(hasRole(ROLE_PRODUCTION_VALIDATOR, msg.sender) && validationProcedures[_to].production==false)
        {
            validationProcedures[_to].production = _isVerified; 
            validationSignatures[_to].production = _messageHash; 
            emit VerifiedProduction(msg.sender, _to, _isVerified);  
            return;
        }
    }

    /* APPROVE AMOUNT */
    function approveAmount(address _to, uint _amount) nonReentrant public {
        require(requestReviewRegistry.isAddressReviewed(_to), NOTREVIEWED);

        checkValidationProcedure(_to);

        if(hasRole(ROLE_PRODUCTION_VALIDATOR, msg.sender))
           validationProcedures[_to].amountApproved = _amount; 
    }

    /****************************************************************************************/
    // hash = getMessageHash(to, amount, messageHash, nonce
    // web3.personal.sign(hash, account)
    // verifySigner(signer, to, amount, messageHash, nonce, signature)
    function verifySigner(address _signer, address _to, uint _amount, bytes32 _message, uint _nonce, bytes memory signature) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_to, _amount, _message, _nonce);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }
    function getMessageHash(address _to, uint _amount, bytes32 _message, uint _nonce) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_to, _amount, _message, _nonce));
    }
    function getEthSignedMessageHash(bytes32 _messageHash) public pure returns (bytes32) {
        /* Signature is produced by signing a keccak256 hash with the following format: "\x19Ethereum Signed Message\n" + len(msg) + msg */
        return keccak256( abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }
    function splitSignature(bytes memory sig) public pure returns ( bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            /*
            First 32 bytes stores the length of the signature
            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature
            mload(p) loads next 32 bytes starting at the memory address p into memory
            */
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        // implicitly return (r, s, v)
    }

    /****************************************************************************************/
    /* https://github.com/pipermerriam/ethereum-datetime/blob/master/contracts/DateTime.sol */ 
}
