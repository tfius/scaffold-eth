// SPDX-License-Identifier: MIT
// Author: @tfius
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TaskBroker is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum UserRole { Client, Broker, Service, Administrator }
    enum BrokerStatus { Active, Inactive }
    enum ServiceStatus { Active, Inactive }
    enum ApprovalStage { Submitted, UnderReview, Approved, Rejected }
    enum ServiceLevel { Basic, Premium, VIP }
    enum TaskStatus { Pending, Canceled, Taken, Completed, Disputed }

    uint256 public schedulerFee = 1000; // 1%yar
    uint256 public feesCollected = 0;
    uint256 private constant FEE_PRECISION = 1e5;


    struct Broker {
        uint256 earned;          
        uint256 inEscrow;
        bytes32 infoLocation; 
        uint[]  servicesIndices;           
        bool    isAway;
        BrokerStatus status;
        ApprovalStage approvalStage;
        UserRole role;
    }
    struct Service {
        uint256 price;
        bytes32 infoLocation;
        address broker;
        bool    isActive;
        ServiceLevel level;
    }
    struct Task {
        uint256 taskId; // unique id
        uint256 serviceId; // index of the service in the broker's services list
        uint256 submittedAt; // when the task was submitted
        uint256 takenAt; // 0 if not taken
        uint256 completedAt; // 0 if not completed
        uint256 payment; // in escrow
        address owner; // who submitted the task
        address broker; // who will complete the task
        bytes32 data; // data for the task
        bytes32 result; // result of the task
        TaskStatus status;
    }
    struct TaskStruct {
        Task task;
        uint256 index;  // Index in the tasksList
    }

    mapping(address => mapping(address => bool)) public blockList;  
    mapping(address => Broker) public brokers;
    mapping(uint256 => Service) public services;
    uint256 public lastServiceId = 0;

    mapping(uint256 => Task) public tasks;
    uint256 public lastTaskId = 0;
    
    //mapping(address => mapping(uint256 => bool)) public completedTasks;
    mapping(address => mapping(uint256 => uint256[])) public completedTasksByServiceId; // address cen retrieved completed tasks for serviceId and its results

    mapping(uint256 => TaskStruct) public pendingTasks; // taskId to task struct, are pending and can be taken by brokers
    uint256[] public pendingTaskIds; // list of pending task ids, this one grows and shrinks

    //mapping(address => uint256[]) public pendingTasksByBroker;

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

    function setBlockAddress(address _address, bool _isBlocked) public onlyOwner validAddress(_address) {
        blockList[msg.sender][_address] = _isBlocked;
    }

    function setAway(bool _away) public {
        brokers[msg.sender].isAway = _away;
    }

    function setApprovalStage(address _forBroker, ApprovalStage _stage) public onlyOwner {
        brokers[_forBroker].approvalStage = _stage;
    }

    function setRole(address _forAddress, UserRole _role) public onlyOwner {
        brokers[_forAddress].role = _role;
    }

    function getBrokers(address[] memory _addresses) public view returns (Broker[] memory) {
        Broker[] memory _brokers = new Broker[](_addresses.length);
        for(uint i = 0; i < _addresses.length ; i++) {
            _brokers[i] = brokers[_addresses[i]];
        }
        return _brokers;        
    }
    function getServices(uint _start, uint length) public view returns (Service[] memory) {
        if(_start + length > lastServiceId) {
            length = lastServiceId - _start;
        }
        Service[] memory _services = new Service[](length);
        for(uint i = _start; i < length ; i++) {
            _services[i] = services[i];
        }
        return _services;
    }

    function getBroker(address _address) public view returns (Broker memory) {
        return brokers[_address];
    }

    function brokerAddService(bytes32 _infoLocation, uint256 _price) public returns (uint) {
        Service memory newService = Service(_price,  _infoLocation, msg.sender, true, ServiceLevel.Basic);
        services[lastServiceId] = newService;
        brokers[msg.sender].servicesIndices.push(lastServiceId);
        lastServiceId++;
        
        return brokers[msg.sender].servicesIndices.length - 1;
    }

    function brokerUpdateServiceInfo(uint _serviceId, bytes32 _infoLocation, uint _newPrice, bool _isActive, ServiceLevel serviceLevel) public {
        uint index = brokers[msg.sender].servicesIndices[_serviceId];
        Service storage service = services[index];
        service.infoLocation = _infoLocation;
        service.price = _newPrice;
        service.isActive = _isActive;
        service.level = serviceLevel;
    }

    function brokerGetServices(address _broker, uint _start, uint _length) public view returns (Service[] memory) {
        if(_start + _length > brokers[_broker].servicesIndices.length) {
            _length = brokers[_broker].servicesIndices.length - _start;
        }
        Service[] memory _services = new Service[](_length);
        for(uint i = _start; i < _length ; i++) {
            _services[i] = services[brokers[_broker].servicesIndices[i]];
        }
        return _services;
    }

    function brokerGetService(address _broker, uint _serviceId) public view returns (Service memory) {
        uint index = brokers[_broker].servicesIndices[_serviceId];
        return services[index];
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    function addTask(address _forBroker, uint _brokerServiceId, bytes32 _data) public payable nonReentrant {
        require(blockList[_forBroker][msg.sender] == false, "Blocked");
        require(brokers[_forBroker].isAway == false, "Broker away");
        require(blockList[_forBroker][msg.sender] == false, "Blocked by broker"); // check that broker did not block sender 
        uint serviceIndex = brokers[_forBroker].servicesIndices[_brokerServiceId];
        Service memory service = services[serviceIndex];
        require(service.isActive == true, "Service not active");
        require(msg.value >= service.price, "Insufficient funds");

        uint payment = msg.value - service.price;
        
        uint256 fee = getFee(service.price);
        uint256 payout = service.price - fee;
        feesCollected += fee;
        brokers[_forBroker].inEscrow += payout;

        Task memory newTask =  Task(lastTaskId, _brokerServiceId, block.timestamp, 0, 0, payout, msg.sender, _forBroker, _data, bytes32(0), TaskStatus.Pending);
        tasks[lastTaskId] = newTask;
        pendingTasks[lastTaskId] = TaskStruct(newTask, lastTaskId);
        pendingTaskIds.push(lastTaskId);
         emit TaskAdded(msg.sender, lastTaskId, _data);     
        lastTaskId++;
             
        if(payment > 0) {
            payable(msg.sender).transfer(payment); // refund sender if overpaid
        }
    }
    // internal function to remove a task from the pendingTasks and pendingTaskIds
    function removePendingTask(uint256 taskId) internal {
        uint256 lastIndex = pendingTaskIds.length - 1; // Move the last task in the list to the deleted slot
        uint256 lastId = pendingTaskIds[lastIndex];
        pendingTaskIds[pendingTasks[taskId].index] = lastId;
        pendingTasks[lastId].index = pendingTasks[taskId].index;
        delete pendingTasks[taskId];  // Delete the task from the map and the list
        pendingTaskIds.pop();
    }
    function takePendingTask(uint taskId) public nonReentrant {
        require(taskId < pendingTaskIds.length, "Task is not pending or does not exist");
        require(pendingTasks[taskId].task.broker == msg.sender, "Task is not for caller");
        removePendingTask(taskId); // Remove the task from pendingTasks and pendingTaskIds
        tasks[taskId].status = TaskStatus.Taken; // Update task status
        tasks[taskId].takenAt = block.timestamp;
    }
    // broker can cancel task if not taken, returns funds to owner
    function cancelPendingTask(uint taskId) public nonReentrant {
        require(taskId < pendingTaskIds.length, "Task is not pending or does not exist");
        require(pendingTasks[taskId].task.owner == msg.sender, "Task is not for caller");
        payable(pendingTasks[taskId].task.owner).transfer(pendingTasks[taskId].task.payment); // Refund the owner

        tasks[taskId].status = TaskStatus.Canceled; // Update task status
        removePendingTask(taskId);  // Remove the task from pendingTasks and pendingTaskIds
    }
    // can take back funds if task has not been completed in 12h
    function disputeTaks(uint256 _taskId) public nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.owner == msg.sender, "Task can only be disputed by owner");
        require(task.completedAt == 0, "Task has already been completed");
        require(task.status != TaskStatus.Disputed, "Task has already been disputed");
        require(task.takenAt > 0 && task.takenAt < block.timestamp + 12 hours, "Task has not been taken");
        require(block.timestamp > task.takenAt + 12 hours, "Task is not yet eligible for dispute");

        task.status = TaskStatus.Disputed;
        brokers[task.broker].inEscrow -= task.payment; // in escrow
        payable(task.owner).transfer(task.payment); // release funds to owner
    }
    // broker can complete task and provide result to get the funds
    function completeTask(uint256 _taskId, bytes32 _result) public nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.broker == msg.sender, "Task can only be completed by owner");
        require(task.status == TaskStatus.Taken, "Task has not been taken");
        require(task.completedAt == 0, "Task has already been completed");
        require(task.takenAt != 0, "Task has not been taken");
        task.completedAt = block.timestamp;
        task.result = _result;

        payable(task.broker).transfer(task.payment); // release funds to broker
        brokers[task.broker].inEscrow -= task.payment; // in escrow
        brokers[task.broker].earned += task.payment; // earned 

        //completedTasks[task.owner][_taskId] = true;
        task.status = TaskStatus.Completed;

        completedTasksByServiceId[task.owner][task.serviceId].push(_taskId);
        emit TaskCompleted(msg.sender, _taskId, _result);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    function getCompletedTasksForService(address _address, uint serviceId, uint start, uint length) public view returns (Task[] memory) {
        uint256[] memory taskIds = completedTasksByServiceId[_address][serviceId];
        if(start + length > taskIds.length) {
            length = taskIds.length - start;
        }
        Task[] memory _tasks = new Task[](length);
        for(uint i = start; i < length ; i++) {
            _tasks[i] = tasks[taskIds[i]];
        }
        return _tasks;
    }
    function getCompletedTasksCountForService(address _address, uint serviceId) public view returns (uint) {
        return completedTasksByServiceId[_address][serviceId].length;
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    /*
    function getCompletedTask(address owner, uint256 _taskId) public view returns (Task memory) {
        require(completedTasks[owner][_taskId], "Task is not completed or does not exist");
        return tasks[_taskId];
    } */
    function getPendingTask(uint256 _taskId) public view returns (Task memory) {
        require(pendingTasks[_taskId].task.taskId != 0, "Task is not pending or does not exist");
        return pendingTasks[_taskId].task;
    }
    // broker gets tasks assigned to him
    function getPendingTasksForBroker(address _broker) public view returns (Task[] memory) {
        // Calculate the number of tasks for this broker
        uint256 taskCount = 0;
        for(uint256 i = 0; i < pendingTaskIds.length; i++) {
            if(pendingTasks[pendingTaskIds[i]].task.broker == _broker) {
                taskCount++;
            }
        }

        // Create an array to hold the tasks
        Task[] memory brokerTasks = new Task[](taskCount); 
        // Iterate over all pending tasks again and add the broker's tasks to the array
        uint256 index = 0;
        for(uint256 i = 0; i < pendingTaskIds.length; i++) {
            if(pendingTasks[pendingTaskIds[i]].task.broker == _broker) {
                brokerTasks[index] = pendingTasks[pendingTaskIds[i]].task;
                index++;
            }
        }
        
        return brokerTasks;
    }

    function getTask(uint256 _taskId) public view returns (Task memory) {
        return tasks[_taskId];
    }

    function collectFees() public onlyOwner {
        uint256 fees = feesCollected;
        feesCollected = 0;
        payable(msg.sender).transfer(fees); // transfer fees to owner
    }
}

   /*
    function removeAtIndex(uint256[] storage array, uint256 index) internal {
        // Check if the index is within the range of our array
        require(index < array.length, "Index out of bounds");
        // Move the element to delete to the end of the array
        array[index] = array[array.length - 1];
        // Remove the last element from the array
        array.pop();
    }*/
    /*
    function getAllPendingTasks() public view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](pendingTaskIds.length);
        for(uint i = 0; i < pendingTaskIds.length ; i++) {
            _tasks[i] = pendingTasks[pendingTaskIds[i]].task;
        }
        return _tasks;
    }*/
 /*
    function getCompletedTasksForAddress(address _address) public view returns (Task[] memory) {
        // Calculate the number of tasks for this address
        uint256 taskCount = 0;
        for(uint256 i = 0; i < pendingTaskIds.length; i++) {
            if(tasks[i].owner == _address && tasks[i].status == TaskStatus.Completed) {
                taskCount++;
            }
        }

        // Create an array to hold the tasks
        Task[] memory completedTasksArray = new Task[](taskCount);
        
        // Iterate over all tasks again and add the completed tasks to the array
        uint256 index = 0;
        for(uint256 i = 0; i < tasks.length; i++) {
            if(tasks[i].owner == _address && tasks[i].status == TaskStatus.Completed) {
                completedTasksArray[index] = tasks[i];
                index++;
            }
        }
        
        return completedTasksArray;
    }*/