// SPDX-License-Identifier: AGPL-3.0-or-later
// written by @tfius 
pragma solidity ^0.8.0;

contract FaveACL {
    struct Entry {
        uint8 permissions; // Permissions are stored as a bit mask
        uint256 timestamp; // used for dispute resolution
        uint256 access_cost;  // Cost in ETH to access this resource
        uint256 payed_amount; // Amount of ETH paid to access this resource
    }

    // Mapping from owner to resource identifier to Ethereum address to entry
    mapping(address => mapping(bytes32 => mapping(address => Entry))) public aclEntries;

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

    // Function to add or update an ACL entry
    function addOrUpdateEntry(
        bytes32 _resourceIdentifier,
        address _ethereumAddress,
        uint8 _permissions,
        uint256 _accessCost
    ) public {
        aclEntries[msg.sender][_resourceIdentifier][_ethereumAddress] = Entry({
            permissions: _permissions,
            timestamp: 0, // block.timestamp, // nothing paid for yet
            access_cost: _accessCost,
            payed_amount: 0
        });

        emit ACLModified(_ethereumAddress, _resourceIdentifier, _permissions, block.number, _accessCost);
    }

    // Function to remove an ACL entry
    function removeEntry(bytes32 _resourceIdentifier, address _ethereumAddress) public {
        Entry storage entry = aclEntries[msg.sender][_resourceIdentifier][_ethereumAddress];
        uint256 accessCost = entry.access_cost;
        uint256 payments = entry.payed_amount;
        if(payments > 0)
        { 
            entry.payed_amount = 0;
            contractBalance -= payments; // Update contract balance
            payable(msg.sender).transfer(payments); // return paid ETH to the sender
        }
          
        delete aclEntries[msg.sender][_resourceIdentifier][_ethereumAddress];
        emit ACLModified(_ethereumAddress, _resourceIdentifier, 0, block.number, accessCost);
    }

    // Function to get entry (to get permissions for a specific resource)
    function getEntry(address owner, bytes32 _resourceIdentifier, address _ethereumAddress) public view returns (Entry memory) {
        return aclEntries[owner][_resourceIdentifier][_ethereumAddress];
    }

    // Function to transfer ETH for access
    function transferForAccess(
        bytes32 _resourceIdentifier,
        address _provider
    ) public payable {
        Entry storage entry = aclEntries[_provider][_resourceIdentifier][msg.sender];
        require(msg.value >= entry.access_cost, "Insufficient ETH sent");

        // Update entry information
        entry.payed_amount += msg.value;
        entry.timestamp = block.number; // timestamp for dispute resolution starts

        // Update contract balance
        contractBalance += msg.value;

        emit ACLTransfer(msg.sender, _provider, _resourceIdentifier, msg.value);
    }

    // Function to charge ETH for serving a resource
    function chargeForServing(
        bytes32 _resourceIdentifier, 
        address _consumer
    ) public {
        Entry storage entry = aclEntries[msg.sender][_resourceIdentifier][_consumer];
        require(entry.payed_amount >= entry.access_cost, "Insufficient payed ETH");

        // Transfer ETH to the provider
        uint256 amountToTransfer = entry.access_cost;
        entry.payed_amount -= entry.access_cost;
        contractBalance -= amountToTransfer; // Update contract balance
        payable(msg.sender).transfer(amountToTransfer);
        entry.timestamp = block.number; // timestamp for dispute resolution starts

        emit ACLTransfer(msg.sender, _consumer, _resourceIdentifier, amountToTransfer);
    }

    // Function if nothing happened in 24 hours, transfer ETH from the provider Entry to sender
    function dispute(
        bytes32 _resourceIdentifier,
        address _provider
    ) public {
        Entry storage entry = aclEntries[_provider][_resourceIdentifier][msg.sender];
        require(entry.payed_amount > 0, "Nothing to dispute");
        if (block.number >= entry.timestamp + (24 hours / 15 seconds)) 
        {
            uint256 amountToRefund = entry.payed_amount;
            entry.payed_amount = 0;
            contractBalance -= amountToRefund; // Update contract balance
            payable(msg.sender).transfer(amountToRefund); // return ETH back to the sender (consumer)
            entry.timestamp = 0;
        }
    }
}
