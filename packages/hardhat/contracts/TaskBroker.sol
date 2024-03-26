// SPDX-License-Identifier: MIT
// Author: @tfius
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TaskBroker is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum TaskStatus { Pending, Taken, Completed, Disputed }

    uint256 public schedulerFee = 1000; // 1%yar
    uint256 public feesCollected = 0;
    uint256 private constant FEE_PRECISION = 1e5;

    struct Broker {
        bytes32 infoLocation;    
        uint256 earned;          
        uint256 inEscrow;        
        bool    isAway;          
        uint[]  servicesIndices;
    }
    struct Service {
        address broker;
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
    //mapping(address => mapping(uint256 => bool)) public pendingTasks;
    mapping(address => mapping(uint256 => bool)) public completedTasks;
    // get all completed tasks by serviceId for owner
    mapping(address => mapping(uint256 => uint256[])) public completedTasksByServiceId;

    mapping(uint256 => TaskStruct) public pendingTasks;
    uint256[] public pendingTaskIds;

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

    /*
    function getPriceForService(address _address, uint serviceId, uint _duration) public view returns (uint256) {
        return _duration * services[serviceId].price;
    }*/
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
        Service memory newService = Service(msg.sender, _infoLocation, _price, true);
        services[lastServiceId] = newService;
        brokers[msg.sender].servicesIndices.push(lastServiceId);
        lastServiceId++;
        
        return brokers[msg.sender].servicesIndices.length - 1;
    }

    function brokerUpdateServiceInfo(uint _serviceId, bytes32 _infoLocation, uint _newPrice, bool _isActive) public {
        uint index = brokers[msg.sender].servicesIndices[_serviceId];
        Service storage service = services[index];
        service.infoLocation = _infoLocation;
        service.price = _newPrice;
        service.isActive = _isActive;
    }

    function brokerGetServices(address _broker, uint _start, uint _length) public view returns (Service[] memory) {
        // require(_start + _length <= brokers[_broker].servicesIndices.length, "Invalid range");
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

        uint256 newTaskId = pendingTaskIds.length;
        Task memory newTask = Task(newTaskId, _brokerServiceId,  _data, bytes32(0), block.timestamp, 0, 0, payout, msg.sender, _forBroker, TaskStatus.Pending);
        pendingTasks[newTaskId] = TaskStruct(newTask, newTaskId);
        pendingTaskIds.push(newTaskId);

        emit TaskAdded(msg.sender, newTaskId, _data);
             
        if(payment > 0) {
            payable(msg.sender).transfer(payment); // refund   
        }        
    }

    function removeTask(uint256 taskId) internal {
        // Move the last task in the list to the deleted slot
        uint256 lastIndex = pendingTaskIds.length - 1;
        uint256 lastTaskId = pendingTaskIds[lastIndex];
        pendingTaskIds[pendingTasks[taskId].index] = lastTaskId;
        pendingTasks[lastTaskId].index = pendingTasks[taskId].index;

        // Delete the task from the map and the list
        delete pendingTasks[taskId];
        pendingTaskIds.pop();
    }

    function takePendingTask(uint taskId) public nonReentrant {
        require(taskId < pendingTaskIds.length, "Task is not pending or does not exist");
        require(pendingTasks[taskId].task.broker == msg.sender, "Task is not for caller");
        // Remove the task from pendingTasks and pendingTaskIds
        removeTask(taskId);
        // Update task status
        tasks[taskId].status = TaskStatus.Taken;
        tasks[taskId].takenAt = block.timestamp;
    }

    // broker can cancel task if not taken, returns funds to owner
    function cancelPendingTask(uint taskId) public nonReentrant {
        require(taskId < pendingTaskIds.length, "Task is not pending or does not exist");
        require(pendingTasks[taskId].task.owner == msg.sender, "Task is not for caller");
        // Remove the task from pendingTasks and pendingTaskIds
        removeTask(taskId);
        // Refund the owner
        payable(msg.sender).transfer(pendingTasks[taskId].task.payment);
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
        require(tasks[_taskId].broker == msg.sender, "Task can only be completed by owner");
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Taken, "Task has not been taken");
        require(task.completedAt == 0, "Task has already been completed");
        require(task.takenAt != 0, "Task has not been taken");
        task.completedAt = block.timestamp;
        task.result = _result;

        payable(task.broker).transfer(task.payment); // release funds to broker
        brokers[task.broker].inEscrow -= task.payment; // in escrow
        brokers[task.broker].earned += task.payment; // earned 

        completedTasks[task.owner][_taskId] = true;
        task.status = TaskStatus.Completed;

        completedTasksByServiceId[task.owner][task.serviceId].push(_taskId);

        emit TaskCompleted(msg.sender, _taskId, _result);
    }

    function getCompletedTasksFor(address _address, uint serviceId) public view returns (Task[] memory) {
        uint256[] memory taskIds = completedTasksByServiceId[_address][serviceId];
        Task[] memory _tasks = new Task[](taskIds.length);
        for(uint i = 0; i < taskIds.length ; i++) {
            _tasks[i] = tasks[taskIds[i]];
        }
        return _tasks;
    }
    
    function getCompletedTask(address owner, uint256 _taskId) public view returns (Task memory) {
        require(completedTasks[owner][_taskId], "Task is not completed or does not exist");
        return tasks[_taskId];
    }

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
    function getAllPendingTasks() public view returns (Task[] memory) {
        Task[] memory _tasks = new Task[](pendingTaskIds.length);
        for(uint i = 0; i < pendingTaskIds.length ; i++) {
            _tasks[i] = pendingTasks[pendingTaskIds[i]].task;
        }
        return _tasks;
    }
    
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

    function getTask(uint256 _taskId) public view returns (Task memory) {
        return tasks[_taskId];
    }

    function collectFees() public onlyOwner {
        uint256 fees = feesCollected;
        feesCollected = 0;
        payable(msg.sender).transfer(fees); // transfer fees to owner
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

}
