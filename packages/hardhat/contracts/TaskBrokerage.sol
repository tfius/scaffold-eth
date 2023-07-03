// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TaskBroker is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public schedulerFee = 1000; // 1%
    uint256 public feesCollected = 0;
    uint256 private constant FEE_PRECISION = 1e5;

    struct Broker {
        bytes32 infoLocation;    
        uint256 earned;          
        uint256 inEscrow;        
        bool    isAway;          
        uint[] servicesIndices;
    }
    struct Service {
        bytes32 infoLocation;
        uint256 price;
        bool    isActive;
    }
    struct Task {
        uint256 taskId;
        uint256 serviceId;
        bytes32 data;            
        bytes32 result;
        uint256 submittedAt;
        uint256 takenAt;         
        uint256 completedAt;     
        uint256 payment;
        address owner;
        address broker;
    }

    mapping(address => mapping(address => bool)) public blockList;  
    mapping(address => Broker) public brokers;
    mapping(uint256 => Service) public services;
    mapping(uint256 => Task) public tasks;
    mapping(address => mapping(uint256 => bool)) public pendingTasks;
    mapping(address => mapping(uint256 => bool)) public completedTasks;

    uint256 public lastServiceId = 0;
    uint256 public lastTaskId = 0;

    event TaskAdded(address indexed user, uint256 taskId, bytes32 data);
    event TaskCompleted(address indexed user, uint256 taskId, bytes32 result);
    event FeeChanged(uint256 newFee);

    constructor() {}

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Address is zero");
        _;
    }

    function getFee(uint256 amount) public view returns (uint256) {
        return (amount * schedulerFee) / FEE_PRECISION;
    }

    function setFee(uint256 newFee) onlyOwner public  {
        schedulerFee = newFee; 
        emit FeeChanged(newFee);
    }

    function setBlockAddress(address _address, bool _isBlocked) public validAddress(_address) {
        blockList[msg.sender][_address] = _isBlocked;
    }

    function setAway(bool _away) public {
        brokers[msg.sender].isAway = _away;
    }

    function getPriceForService(address _address, uint serviceId, uint _duration) public view returns (uint256) {
        return _duration * services[serviceId].price;
    }

    function getBroker(address _address) public view returns (Broker memory) {
        return brokers[_address];
    }

    // function brokerAddService(bytes32 _infoLocation, uint256 _price) public {
    //     Service memory newService = Service(_infoLocation, _price, true);
    //     services[lastServiceId] = newService;
    //     brokers[msg.sender].servicesIndices[lastServiceId] = true;
    //     lastServiceId++;
    // }
    function brokerAddService(bytes32 _infoLocation, uint256 _price) public returns (uint serviceIndex) {
        Service memory newService = Service(_infoLocation, _price, true);
        services[lastServiceId] = newService;
        brokers[msg.sender].servicesIndices.push(lastServiceId);
        lastServiceId++;
    }
    function brokerUpdateServiceInfo(uint _serviceId, bytes32 _infoLocation, uint _newPrice, bool _isActive) public {
        uint index = brokers[msg.sender].servicesIndices[_serviceId];
        Service storage service = services[index];
        service.infoLocation = _infoLocation;
        service.price = _newPrice;
        service.isActive = _isActive;
    }
    function brokerGetServices(uint _start, uint _length) public view returns (Service[] memory) {
        require(_start + _length <= brokers[msg.sender].servicesIndices.length, "Invalid range");
        Service[] memory _services = new Service[](_length);
        for(uint i = _start; i < _length ; i++) {
            _services[i] = services[brokers[msg.sender].servicesIndices[i]];
        }
        return _services;
    }
    function brokerGetService(uint _serviceId) public view returns (Service memory) {
        uint index = brokers[msg.sender].servicesIndices[_serviceId];
        return services[index];
    }

    function addTask(address _forBroker, uint _brokerServiceId, bytes32 _data) public payable nonReentrant {
        require(blockList[_forBroker][msg.sender] == false, "Blocked");
        require(brokers[_forBroker].isAway == false, "Broker away");
        uint serviceIndex = brokers[_forBroker].servicesIndices[_brokerServiceId];
        Service memory service = services[serviceIndex];
        require(service.isActive == true, "Service not active");
        require(msg.value >= service.price, "Insufficient funds");

        uint payment = msg.value - service.price;
        
        uint256 fee = getFee(service.price);
        uint256 payout = service.price - fee;
        feesCollected += fee;
        brokers[_forBroker].inEscrow += payout;

        Task memory newTask = Task(lastTaskId, _brokerServiceId,  _data, bytes32(0), block.timestamp, 0, 0, payout, msg.sender, _forBroker);
        pendingTasks[_forBroker][lastTaskId] = true;
        tasks[lastTaskId] = newTask;
        lastTaskId++;
        
        emit TaskAdded(msg.sender, lastTaskId - 1, _data);
             
        if(payment > 0) {
            payable(msg.sender).transfer(payment); // refund   
        }        
    }

    function takePendingTask(uint taskId) public nonReentrant {
        require(pendingTasks[msg.sender][taskId], "Task is not pending or does not exist");
        Task storage task = tasks[taskId];
        task.takenAt = block.timestamp;
        delete pendingTasks[msg.sender][taskId];
    }

    function completeTask(uint256 _taskId, bytes32 _result) public nonReentrant {
        require(tasks[_taskId].broker == msg.sender, "Task can only be completed by owner");
        Task storage task = tasks[_taskId];
        require(task.completedAt == 0, "Task has already been completed");
        require(task.takenAt != 0, "Task has not been taken");
        task.completedAt = block.timestamp;
        task.result = _result;

        payable(task.broker).transfer(task.payment); // release funds to broker
        brokers[task.broker].inEscrow -= task.payment; // in escrow
        brokers[task.broker].earned += task.payment; // earned 

        completedTasks[task.owner][_taskId] = true;

        emit TaskCompleted(msg.sender, _taskId, _result);
    }
    
    function collectFees() public onlyOwner {
        uint256 fees = feesCollected;
        feesCollected = 0;
        payable(msg.sender).transfer(fees); // transfer fees to owner
    }

    function getCompletedTask(address owner, uint256 _taskId) public view returns (Task memory) {
        require(completedTasks[owner][_taskId], "Task is not completed or does not exist");
        return tasks[_taskId];
    }

    function getPendingTask(address broker, uint256 _taskId) public view returns (Task memory) {
        require(pendingTasks[broker][_taskId], "Task is not pending or does not exist");
        return tasks[_taskId];
    }

    function getTask(uint256 _taskId) public view returns (Task memory) {
        return tasks[_taskId];
    }
}
