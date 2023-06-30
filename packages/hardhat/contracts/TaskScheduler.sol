// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TaskScheduler is Ownable {

    uint256 public schedulerFee = 1000; // 1%
    uint256 public feesCollected = 0;
    uint256 private constant FEE_PRECISION = 1e5;

    // Broker offers Services that users can consume by issuing tasks
    struct Broker {
        bytes32 infoLocation;    // swarm location
        uint256 earned;          // in wei
        uint256 inEscrow;        // in wei
        bool    isAway;          // away status 
        uint[]  servicesIndices; // offers service
    }
    struct Service {
        bytes32 infoLocation;    // swarm location with service metadata
        uint256 price;           // in wei per second
        bool    isActive;        // services that are not active can not get tasks
    }
    struct Task {
        uint256 taskId;
        uint256 serviceId;
        bytes32 data;            // user provided data for service must be compliant with service schema defined in metadata 
        bytes32 result;          // result of service execution on data provided by user
        uint256 submittedAt;     // timestamp of when submitted
        uint256 takenAt;         // timestamp when taken by broker
        uint256 completedAt;     // timestamp of when completed
        uint256 payment;         // in wei
        address owner;           // user that submitted task
        address broker;          // broker that took task
    }

    mapping(address => mapping(address => bool)) public blockList;  // block list per address -> address -> bool
    mapping(address => Broker) public brokers;

    Service[] public services;
    Task[] public tasks;

    mapping(address => uint256[]) public pendingTasks; // tasks waiting to be taken
    // mapping(address => uint256[]) public takenTasks; // tasks taken by broker
    mapping(address => uint256[]) public completedTasks; // tasks completed by broker for user

    event TaskAdded(address indexed user, uint256 taskId, bytes32 data);
    event TaskCompleted(address indexed user, uint256 taskId, bytes32 result);

    constructor() {
    }
    receive() external payable {}
    function getFee(uint256 amount) public view returns (uint256) {
        return (amount * schedulerFee) / FEE_PRECISION;
    }
    function setFee(uint256 newFee) onlyOwner public  {
        schedulerFee = newFee; 
    }
    function setBlockAddress(address _address, bool _isBlocked) public {
        blockList[msg.sender][_address] = _isBlocked;
    }
    function setAway(bool _away) public {
        brokers[msg.sender].isAway = _away;
    }
    function getPriceForService(address _address, uint serviceId, uint _duration) public view returns (uint256) {
        return _duration * services[serviceId].price;
    }
    function setServicePrice(uint _serviceId, uint _newPrice) public view returns (Service memory) {
        Service storage service = services[brokers[msg.sender].servicesIndices[_serviceId]-1]; // from services get brokers service
        service.price = _newPrice;
        return service;
    }
    function setServiceActive(uint _serviceId, bool _isActive) public view returns (Service memory) {
        Service storage service = services[brokers[msg.sender].servicesIndices[_serviceId]-1]; // from services get brokers service
        service.isActive = _isActive;
        return service;
    }
    function setServiceInfoLocation(uint _serviceId, bytes32 _infoLocation) public view returns (Service memory) {
        Service storage service = services[brokers[msg.sender].servicesIndices[_serviceId]-1]; // from services get brokers service
        service.infoLocation = _infoLocation;
        return service;
    }

    function getBroker(address _address) public view returns (Broker memory) {
        return brokers[_address];
    }
    function brokerAddService(bytes32 _infoLocation, uint256 _price) public view returns (Service memory) {
        Service memory newService = Service(_infoLocation, _price, true);
        services.push(newService);
        brokers[msg.sender].servicesIndices.push(services.length);
        return newService;
    }
    function brokerGetServices(address _forAddress, uint _start, uint _length) public view returns (Service[] memory) {
        require(_start + _length <= brokers[_forAddress].servicesIndices.length, "Invalid range");
        Service[] memory _services = new Service[](_length);
        
        uint c = 0;
        for(uint i = _start; i < _length ; i++) {
            _services[c] = services[brokers[_forAddress].servicesIndices[c]-1]; // from services get brokers service
            c++;
        }
        return _services;
    }
    function brokerGetService(address _forAddress, uint _serviceId) public view returns (Service memory) {
        return services[brokers[_forAddress].servicesIndices[_serviceId]-1]; // from services get brokers service
    }


    function addTask(address _forBroker, uint _brokerServiceId, bytes32 _data) public payable {
        require(blockList[_forBroker][msg.sender]==true, "Blocked");
        require(brokers[_forBroker].isAway==false, "Brooker away");
        Service memory service = services[brokers[_forBroker].servicesIndices[_brokerServiceId]-1];
        require(service.isActive==true, "Service not active");
        require(msg.value >= service.price, "Insufficient funds");

        uint absoulutePrice = msg.value - service.price; // 10-1 = 9
        //uint paymentAmount = msg.value;
        
        if(msg.value > 0)
        {
            uint256 fee = getFee(service.price);
            uint256 payout = service.price-fee;
            feesCollected += fee;
            brokers[_forBroker].inEscrow += payout; // in escrow
            payable(_forBroker).transfer(payout);

            // add task with index starting at 0 (pendingTaskId?)
            Task memory newTask = Task(tasks.length, _brokerServiceId,  _data, bytes32(0), block.timestamp, 0, 0, payout, msg.sender, _forBroker);
            pendingTasks[_forBroker].push(tasks.length); // 0
            tasks.push(newTask);
            
            emit TaskAdded(msg.sender, tasks.length-1, _data);
            // if msg.value > price then refund    
            payable(msg.sender).transfer(absoulutePrice); // refund            
        }        
    }

    // broker takes task from pending tasks
    function takePendingTask(uint pendingTaskId) public returns (Task memory) {
        // require(pendingTasks[msg.sender].length > 0, "No pending tasks");
        // uint lastPending = pendingTasks[msg.sender].length-1;
        //uint taskId = pendingTasks[msg.sender][pendingTaskId];
        Task storage task = tasks[pendingTasks[msg.sender][pendingTaskId]];
        task.takenAt = block.timestamp;
        removePendingTask(msg.sender, pendingTaskId);
        // pendingTasks[msg.sender].pop(); // no longer pending
        return task;
    }

    // remove task by pending task id from pending tasks by swapping with last element
    function removePendingTask(address _broker, uint pendingTaskId) private {
        uint removeIndex = pendingTaskId; 
        uint lastIndex = pendingTasks[_broker].length - 1;
        if (lastIndex != removeIndex) {
            pendingTasks[_broker][removeIndex] = pendingTasks[_broker][lastIndex];
        }
        pendingTasks[_broker].pop();
    }
    
    function completeTask(uint256 _taskId, bytes32 _result) public {
        Task storage task = tasks[_taskId];
        require(task.completedAt == 0, "Task has already been completed");
        require(task.takenAt != 0, "Task has not been taken");
        require(task.broker == msg.sender, "Task can only be completed by owner");
        task.completedAt = block.timestamp;
        task.result = _result;

        payable(task.broker).transfer(task.payment); // release funds to broker
        brokers[task.broker].inEscrow -= task.payment; // in escrow
        brokers[task.broker].earned += task.payment; // in balance

        completedTasks[task.owner].push(_taskId); //notify owner that his task has been completed
    }

    // can take back funds if task has not been completed in 12h
    function disputeTaks(uint256 _taskId) public  {
        Task storage task = tasks[_taskId];
        require(task.owner == msg.sender, "Task can only be disputed by owner");
        require(task.completedAt == 0, "Task has already been completed");
        require(task.takenAt>0 && task.takenAt < block.timestamp + 12 hours, "Task has not been taken");

        brokers[task.broker].inEscrow -= task.payment; // in escrow
        payable(task.owner).transfer(task.payment); // release funds to owner
    }

    function getPendingTaskCount(address _user) public view returns (uint256) {
        return pendingTasks[_user].length;
    }

    function getCompletedTaskCount(address _user) public view returns (uint256) {
        return completedTasks[_user].length;
    }

    function getCompletedTasks(address _forAddress, uint start, uint length) public view returns (Task[] memory)
    {
        require(start + length <= completedTasks[_forAddress].length, "Invalid range");
        Task[] memory userCompletedTasks = new Task[](length);
        for (uint256 i=start; i < start+length; i++) {
            userCompletedTasks[i] = tasks[completedTasks[_forAddress][i]];
        }
        return userCompletedTasks;
    }

    function collectFees() onlyOwner public returns () {
        feesCollected = 0;
        payable(msg.sender).transfer(feesCollected); // owner can only collect fees 
    } 
    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    function contractFees() public view returns (uint256) {
        return feesCollected;
    }
    // function fundsTransfer() onlyOwner public payable {
    //     payable(msg.sender).transfer((address(this).balance));
    // }
    function release(address token, uint amount) public virtual {
        SafeERC20.safeTransfer(IERC20(token), owner(), amount);
    }
}
