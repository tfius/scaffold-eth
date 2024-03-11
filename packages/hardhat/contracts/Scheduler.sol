// SPDX-License-Identifier: MIT
// written by @tfius 
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
/*
 Expected JSON format for event
   [{
        "eventName": "string",
        "description": "string",
        "category": "string",
        "location": "string",
        "participants": ["string"],
        "date": "uint64",
        "duration": "uint64",
        "time": "uint64"
    }]
*/ 

contract Scheduler is Ownable {
    
    struct Event {
        address sender;
        bytes32 location; // swarm location
        uint64 time;
        uint64 duration;
        bytes32 resultLocation;  // where are results stored    
    }

    struct User {
        uint256 payment; // in wei per second
        uint256 balance; // in wei
        bool    isAway;

        uint64  startTime; // 25200; // 7am
        uint64    endTime; // 64800; // 6pm
    }

    uint256 public schedulerFee = 1000; // 1%
    uint256 public feesCollected = 0;
    uint256 private constant FEE_PRECISION = 1e5;

    Event[] private _events;
    mapping(address => User) users;
    mapping(address => mapping(uint64 => uint256[])) private _userEvents; // user to date to event index
    mapping(address => mapping(address => bool)) private _userBlockList;  // block list per address -> address -> bool

    event EventScheduled(
        address indexed user,
        uint64 indexed date,
        uint64 indexed time,
        uint64 duration,
        bytes32 swarmLocation
    );

    event EventCompleted(
        address indexed user,
        uint64 indexed date,
        uint256 indexed index,
        bytes32 resultLocation
    );

    constructor() {
    }
    receive() external payable {}
    function getFee(uint256 amount) public view returns (uint256) {
        return (amount * schedulerFee) / FEE_PRECISION;
    }
    function setFee(uint256 newFee) onlyOwner public  {
        schedulerFee = newFee; 
    }
    function getUser(address _address) public view returns (User memory) {
        return users[_address];
    }

    function setBlockAddress(address _address, bool allow) public {
        _userBlockList[msg.sender][_address] = allow;
    }
    function setPayment(uint256 _paymentPerS) public {
        users[msg.sender].payment = _paymentPerS;
    }
    function setAway(bool _away) public {
        users[msg.sender].isAway = _away;
    }
    function setStartEndTime(uint64 _startTime, uint64 _endTime) public {
        users[msg.sender].startTime = _startTime;
        users[msg.sender].endTime = _endTime;
    }
    function getPriceForEvent(address _address, uint64 _duration) public view returns (uint256) {
        return _duration * users[_address].payment;
    }

    function addEvent(address _address, uint64 _date, uint64 _time, uint64 _duration, bytes32 _swarmLocation) private {
        Event memory e = Event(msg.sender, _swarmLocation, _time, _duration, bytes32(0));
        _events.push(e);
        _userEvents[_address][_date].push(_events.length);

        emit EventScheduled(_address, _date, _time, _duration, _swarmLocation);

    }

    function completeEvent(uint64 _date, uint256 _index, bytes32 _resultLocation) public {
        require(_index < _userEvents[msg.sender][_date].length, "Invalid index");

        Event storage e = _events[_userEvents[msg.sender][_date][_index]];
        e.resultLocation = _resultLocation;

        emit EventCompleted(msg.sender, _date, _index, _resultLocation);
    }

    function scheduleEvent(address _address, uint64 _date, uint64 _time, uint64 _duration, bytes32 _swarmLocation) public payable {
        require(_userBlockList[_address][msg.sender]==false, "Not allowed to add event");
        //require(_duration >= 900 && <= 3600, "Duration >15 <60 min");
        require(users[_address].isAway==false, "User is away");

        uint256 _end = _time + _duration;
        require(_end <= 86400, "Event must start / end same day");

        if(users[_address].startTime != 0 && users[_address].endTime != 0)
           require(_time >= users[_address].startTime && _time + _duration <= users[_address].endTime, "Event not between start/end");

        uint256 paymentAmount = _duration * users[_address].payment;
        require(msg.value >= paymentAmount, "Insufficient payment");

        require(isOwnerAvailable(_address, _date, _time, _duration), "Not available");

        addEvent(_address, _date, _time, _duration, _swarmLocation);

        if(paymentAmount > 0)
        {
            uint256 fee = getFee(paymentAmount);
            uint256 payout = paymentAmount-fee;
            feesCollected += fee;
            users[_address].balance += payout;
            payable(_address).transfer(payout);
        }
    }

    /* 1. We require that the index is less than the length of the array. Otherwise we will get an out-of-bounds error.
       2. We loop over the array and shift the elements to the left. We start from the index that we want to remove and end at the second-to-last element.
       3. We then use the pop function to remove the last element of the array.
    */
    function removeEventByIndex(uint64 _date, uint64 _index) public  {
        require(_index < _userEvents[msg.sender][_date].length, "Invalid index");
        
        for (uint i = _index; i < _userEvents[msg.sender][_date].length - 1; i++) {
            _userEvents[msg.sender][_date][i] =_userEvents[msg.sender][_date][i+1];
        }
        _userEvents[msg.sender][_date].pop();
    }

    /*  1. The first line creates an array of type Event and sets it's size to the length of the array of event IDs for the user and date passed in.
        2. The for loop iterates through the array of event IDs and sets the array of events to the actual event data.
        3. The function then returns the array of events. */
    function getEventsByDate(address owner, uint64 _date) public view returns (Event[] memory) {
        Event[] memory events = new Event[](_userEvents[owner][_date].length);
        for (uint256 i=0; i < events.length; i++) {
            events[i] = _events[_userEvents[owner][_date][i]-1];
        }
        return events;
    }

    /*  1. _dates is an array of timestamps
        2. We get the length of the array and loop through it
        3. For each date we get the length of the events array and we add it to a variable called totalLength
        4. We initialize the c variable to 0
        5. We initialize an array of events with the length of totalLength
        6. We loop through the _dates array again
        7. For each date we loop through the array of events for that date
        8. We set the events array at index c to the event at index j
        9. We increment c by 1
        10. We return the events array */
    function getEventsByDates(address owner, uint64[] memory _dates) public view returns (Event[] memory) {
        uint totalLength = 0;
        for(uint i = 0; i < _dates.length; i++) {
            totalLength += _userEvents[owner][_dates[i]].length;
        }
        uint c = 0;
        Event[] memory events = new Event[](totalLength);
        for(uint i = 0; i < _dates.length; i++) {
            for (uint64 j=0; j < _userEvents[owner][_dates[i]].length; j++) {
                events[c] = _events[_userEvents[owner][_dates[i]][j]-1];
                c++;
            }
        }
        return events;
    }

    function isOwnerAvailable(address _address, uint64 _date, uint64 _time, uint64 _duration) public view returns (bool) {
        Event[] memory events = getEventsByDate(_address, _date);
        for (uint256 i=0; i < events.length; i++) {
            if(users[_address].startTime != 0 && users[_address].endTime != 0)
            {
                //if(users[_address].startTime > _time && users[_address].endTime < _time + _duration) {
                if(_time < users[_address].startTime || _time + _duration > users[_address].endTime) {  
                    return false;
                }
            }
            // can't start at same time as other event and between event
            if(_time >= events[i].time && _time < events[i].time + events[i].duration) { // start time inside event
                return false;
            }
            if(_time + _duration > events[i].time && _time + _duration < events[i].time + events[i].duration) { // start time inside event
                return false;
            }
        }
        return true;
    }

    function getFreeSlot(address _address, uint64 _date, uint64 _duration) public view returns (uint64) {
        Event[] memory events = getEventsByDate(_address, _date);
        uint64 time = 0;
        for (uint256 i=0; i < events.length; i++) {
            if (events[i].time - time >= _duration) {
                return time;
            }
            time = events[i].time + events[i].duration;
        }
        return time;
    }

    function fundsBalance() public view returns (uint256) {
        return address(this).balance;
    }    
    function fundsTransfer() onlyOwner public payable {
        payable(msg.sender).transfer((address(this).balance));
    }
    function release(address token, uint amount) public virtual {
        SafeERC20.safeTransfer(IERC20(token), owner(), amount);
    }
}