// SPDX-License-Identifier: AGPL-3.0-or-later
// written by @tfius 
pragma solidity ^0.8.0;

contract FaveACL {
    struct Entry {
        address owner;
        bytes32 resourceIdentifier;

        uint8 permissions; // Permissions are stored as a bit mask
        uint256 timestamp; // used for dispute resolution
        uint256 access_cost;  // Cost in ETH to access this resource
        uint256 payed_amount; // Amount of ETH paid to access this resource
    }

    Entry[] public entries; // all entries
    mapping(address => uint256[]) public userEntries;

    // Mapping from owner to resource identifier to Ethereum address to entry
    mapping(address => mapping(bytes32 => mapping(address => uint256))) public aclEntries;
    mapping(address => uint256) public stakeBalance;
    mapping(address => uint256) public amountInDispute;

    // Contract balance
    uint256 public contractBalance;

    // Permission flags
    uint8 constant READ_PERMISSION = 0x01;
    uint8 constant WRITE_PERMISSION = 0x02;
    uint8 constant EXECUTE_PERMISSION = 0x04;
    // Add more permission flags as needed

    // Event to log ACL entry modifications
    event ACLModified(
        address indexed ethereumAddress,
        bytes32 indexed resourceIdentifier,
        uint8 permissions,
        uint256 timestamp,
        uint256 accessCost
    );
    // Event to log ACL entry modifications
    event ACLTransfer(
        address indexed fromAddress,
        address indexed toAddress,
        bytes32 indexed resourceIdentifier,
        uint256 accessCost
    );
    // Event to log ACL dispute resolution
    event ACLNotServed(
        address indexed fromAddress,
        bytes32 indexed resourceIdentifier,
        address indexed toAddress,
        uint256 amount
    );

    // Function to add or update an ACL entry
    function addOrUpdateEntry(
        bytes32 _resourceIdentifier,
        address _userAddress,
        uint8 _permissions,
        uint256 _accessCost
    ) public {
         uint256 entryId = aclEntries[msg.sender][_resourceIdentifier][_userAddress];
        if (entryId == 0) {
            // Add new entry
            entries.push(Entry({
                owner: msg.sender,
                resourceIdentifier: _resourceIdentifier,
                permissions: _permissions,
                timestamp: 0, // block.timestamp, // nothing payed for yet
                access_cost: _accessCost,
                payed_amount: 0
            }));
            aclEntries[msg.sender][_resourceIdentifier][_userAddress] = entries.length;
            userEntries[_userAddress].push(entryId);
        } else {
            // Update existing entry
            Entry storage entry = entries[aclEntries[msg.sender][_resourceIdentifier][_userAddress]-1];
            // check to see if there is no outstanding payed_amount
            require(entry.payed_amount == 0, "Cannot update entry with outstanding payed_amount");
            entry.permissions = _permissions;
            entry.access_cost = _accessCost;
        }

        emit ACLModified(_userAddress, _resourceIdentifier, _permissions, block.number, _accessCost);
    }

    // Function to get entry (to get permissions for a specific resource)
    function getEntry(address owner, bytes32 _resourceIdentifier, address _userAddress) public view returns (Entry memory) {
        uint256 entryId = aclEntries[owner][_resourceIdentifier][_userAddress];
        require(entryId != 0, "Entry does not exist");
        return entries[aclEntries[owner][_resourceIdentifier][_userAddress]-1];
    }
    // Function get all entries for ethereum address
    function getEntries(address _userAddress) public view returns (Entry[] memory) {
        Entry[] memory _entries = new Entry[](userEntries[_userAddress].length);
        for (uint256 i = 0; i < userEntries[_userAddress].length; i++) {
            _entries[i] = entries[userEntries[_userAddress][i]-1];
        }
        return _entries;
    }

    // Function to transfer ETH for access
    function payForAccess(
        bytes32 _resourceIdentifier,
        address _provider
    ) public payable returns (Entry memory) {
        uint256 entryId = aclEntries[_provider][_resourceIdentifier][msg.sender];
        require(entryId != 0, "Entry does not exist");
        Entry storage entry = entries[entryId-1];        
        require(msg.value >= entry.access_cost, "Insufficient ETH sent");
        // requrire that no previous payForAccess was made
        require(entry.payed_amount == 0, "Already payed for access");

        // Update entry information
        entry.payed_amount += entry.access_cost;
        entry.timestamp = block.number; // timestamp for dispute resolution starts

        // check to see  if msg.value is more than access_cost
        if(msg.value > entry.access_cost)
        {
            uint256 amountToRefund = msg.value - entry.access_cost;
            payable(msg.sender).transfer(amountToRefund); // return ETH back to the sender (consumer)
        }

        // Update contract balance
        contractBalance += entry.access_cost;

        emit ACLTransfer(msg.sender, _provider, _resourceIdentifier, msg.value);
        return entry;
    }

    // Function to charge ETH for serving a resource
    function getPayedForServing(
        bytes32 _resourceIdentifier, 
        address _consumer
    ) public {
        uint256 entryId = aclEntries[msg.sender][_resourceIdentifier][_consumer];
        require(entryId != 0, "Entry does not exist");

        Entry storage entry = entries[entryId-1];
        require(entry.payed_amount != 0, "Insufficient payed ETH");

        // Transfer ETH to the provider
        uint256 amountToTransfer = entry.payed_amount;
        contractBalance -= amountToTransfer; // Update contract balance
        payable(msg.sender).transfer(amountToTransfer);
        entry.timestamp = 0; // served, no more time disputes

        emit ACLTransfer(msg.sender, _consumer, _resourceIdentifier, amountToTransfer);
    }

    // Function if nothing happened in 24 hours, transfer ETH from the provider Entry to sender
    function dispute(
        bytes32 _resourceIdentifier,
        address _provider
    ) public {
        uint256 entryId = aclEntries[_provider][_resourceIdentifier][msg.sender];
        require(entryId != 0, "Entry does not exist");

        Entry storage entry = entries[entryId-1];        
        require(entry.payed_amount > 0, "Nothing to dispute");
        require(entry.timestamp != 0, "Nothing to dispute");

        if (block.number >= entry.timestamp + (24 hours / 15 seconds)) 
        {
            uint256 amountToRefund = entry.payed_amount;
            entry.payed_amount = 0;
            stakeBalance[_provider] -= amountToRefund;
            contractBalance -= amountToRefund; // Update contract balance
            payable(msg.sender).transfer(amountToRefund); // return ETH back to the sender (consumer)
            entry.timestamp = 0;
            emit ACLNotServed(_provider, _resourceIdentifier, msg.sender, amountToRefund);
        }
    }
    // each provider must stake ETH if they wanna charge for serving
    function stake() public payable {
        require(msg.value > 0, "Insufficient ETH sent");
        contractBalance += msg.value;
        stakeBalance[msg.sender] += msg.value;
    }

    function withdrawStake(uint256 _amount) public {
        require(stakeBalance[msg.sender] >= _amount, "Insufficient balance");
        stakeBalance[msg.sender] -= _amount;
        contractBalance -= _amount;
        payable(msg.sender).transfer(_amount);
    }

    // how much provider has staked
    function getStake(address _provider) public view returns (uint256) {
        return stakeBalance[_provider];
    }
}
