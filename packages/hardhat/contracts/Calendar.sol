// SPDX-License-Identifier: MIT
// written by @tfius 
pragma solidity ^0.8.0;
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
/*
struct Event {
        bytes eventName;
        bytes description;
        bytes category;
        bytes32 location;
        bytes32[] participants;
        uint64 duration;
        uint64 date;
        uint64 time;
    }
*/ 

contract Calendar {
    
    struct Event {
        bytes32 location; // swarm location
        uint64 time;
        uint64 duration;       
    }
    struct Invite {
        address creator;
        bytes32 location; // swarm location
        uint64 time;
        uint64 duration;
        uint64 date;
        address[] participants;
        address[] accepted;
    }
    
    Event[] private _events;
    mapping(address => mapping(uint64 => uint256[])) private _userEvents; // user to date to event index

    Invite[] private _invites;
    mapping(address => mapping(uint64 => uint256[])) private _userInvites; // user to date to invite index

    mapping(address => mapping(address => bool)) private _userAllowList; // allow list per address -> address -> bool
    
    /*  1. The function takes 4 parameters: date, time, duration, swarmLocation.
        2. The first line creates a new Event struct and stores it in the memory variable e. The parameters are passed to the Event struct constructor.
        3. The second line pushes the newly created Event struct to the _events array.
        4. The third line pushes the index of the newly created Event struct to the _userEvents mapping. */
    function addEvent(uint64 _date, uint64 _time, uint64 _duration, bytes32 _swarmLocation) public {
        Event memory e = Event(_swarmLocation, _time, _duration);
        _events.push(e);
        _userEvents[msg.sender][_date].push(_events.length);
    }

    function allowAddress(address _address, bool allow) public {
        _userAllowList[msg.sender][_address] = allow;
    }

    function addEventForAddress(address _address, uint64 _date, uint64 _time, uint64 _duration, bytes32 _swarmLocation) public {
        require(_userAllowList[_address][msg.sender], "Not allowed to add event");
        require(_duration >= 900, "Duration too small > 900s");

        //uint256 _end = _time + _duration;
        //require(_end % 86400 == _time % 86400, "Event must start and end on the same day");

        Event memory e = Event(_swarmLocation, _time, _duration);
        _events.push(e);
        _userEvents[_address][_date].push(_events.length);
    }
    /* 1. We use the keyword 'require' to check if the index is valid. 
       2. We use the keyword 'storage' to indicate that we are modifying the existing event. 
       3. We use the keyword 'memory' to indicate that we are returning a copy of the event.
    */
    function updateEventsByDate(uint64 _date, uint64 _index, uint64 _newTime, uint64 _newDuration, bytes32 _swarmLocation) public returns (Event memory) {
        require(_index < _userEvents[msg.sender][_date].length, "Invalid index");
        Event storage e =  _events[_userEvents[msg.sender][_date][_index]];
        e.time = _newTime;
        e.duration = _newDuration;
        e.location = _swarmLocation;
        return e;
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

    function isOwnerAvailable(address owner, uint64 _date, uint64 _time, uint64 _duration) public view returns (bool) {
        Event[] memory events = getEventsByDate(owner, _date);
        for (uint256 i=0; i < events.length; i++) {
            if (_time > events[i].time && _time < events[i].time + events[i].duration) {
                return false;
            }
            if (_time + _duration > events[i].time && _time + _duration < events[i].time + events[i].duration) {
                return false;
            }
        }
        return true;
    }

    function getFreeSlot(address owner, uint64 _date, uint64 _duration) public view returns (uint64) {
        Event[] memory events = getEventsByDate(owner, _date);
        uint64 time = 0;
        for (uint256 i=0; i < events.length; i++) {
            if (events[i].time - time >= _duration) {
                return time;
            }
            time = events[i].time + events[i].duration;
        }
        return time;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    /* function that adds invites to the calendar */
    function addInvite(uint64 _date, uint64 _time, uint64 _duration, bytes32 _swarmLocation, address[] memory _participants) public {
        address[] memory accepted = new address[](0);
        Invite memory i = Invite(msg.sender, _swarmLocation, _time, _duration, _date, _participants, accepted);
        _invites.push(i);

        // for all participants, add invite to their invites
        for (uint256 j=0; j < _participants.length; j++) {
            _userInvites[_participants[j]][_date].push(_invites.length);
        }
        _userInvites[msg.sender][_date].push(_invites.length);
    }

    /* function to get invites for date */
    function getInvitesByDate(address owner, uint64 _date) public view returns (Invite[] memory) {
        Invite[] memory invites = new Invite[](_userInvites[owner][_date].length);
        for (uint256 i=0; i < invites.length; i++) {
            invites[i] = _invites[_userInvites[owner][_date][i]-1];
        }
        return invites;
    }
    /* function to get invites for dates */
    function getInvitesByDates(address owner, uint64[] memory _dates) public view returns (Invite[] memory) {
        uint totalLength = 0;
        for(uint i = 0; i < _dates.length; i++) {
            totalLength += _userInvites[owner][_dates[i]].length;
        }
        uint c = 0;
        Invite[] memory invites = new Invite[](totalLength);
        for(uint i = 0; i < _dates.length; i++) {
            for (uint64 j=0; j < _userInvites[owner][_dates[i]].length; j++) {
                invites[c] = _invites[_userInvites[owner][_dates[i]][j]-1];
                c++;
            }
        }
        return invites;
    }

    /* function to confirm invite, add event to calendar and remove invite from user invites */
    function confirmInvite(uint64 _date, uint64 _index) public {
        require(_index < _userInvites[msg.sender][_date].length, "Invalid index");
        Invite storage i = _invites[_userInvites[msg.sender][_date][_index]];
        i.accepted.push(msg.sender);
        addEvent(_date, i.time, i.duration, i.location);
        removeInviteByIndex(_date, _index);
    }

    function removeInviteByIndex(uint64 _date, uint64 _index) public  {
        require(_index < _userInvites[msg.sender][_date].length, "Invalid index");
        
        for (uint i = _index; i < _userInvites[msg.sender][_date].length - 1; i++) {
            _userInvites[msg.sender][_date][i] =_userInvites[msg.sender][_date][i+1];
        }
        _userInvites[msg.sender][_date].pop();
    }
}