// SPDX-License-Identifier: AGPL-3.0-or-later
// written by @tfius 
pragma solidity ^0.8.0;

contract FaveACL {
    struct Entry {
        uint8 permissions; // Permissions are stored as a bit mask
        uint256 timestamp; // used for dispute resolution
        uint256 access_cost;  // Cost in tokens to access this resource
        uint256 payed_amount; // Amount of tokens payed to access this resource
    }

    // Mapping from owner to resource identifier to Ethereum address to entry
    mapping(address => mapping(bytes32 => mapping(address => Entry))) public aclEntries;

    // Permission flags
    uint8 constant READ_PERMISSION = 0x01;
    uint8 constant WRITE_PERMISSION = 0x02;
    uint8 constant EXECUTE_PERMISSION = 0x04;
    // Add more permission flags as needed
    uint256 constant TOKENS_PER_ETH = 10000;

    // ERC20 events
    event Transfer(address indexed from,address indexed to,uint256 value);
    event Approval(address indexed owner,address indexed spender,uint256 value);

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
            timestamp: 0, // block.timestamp, // nothing payed for yet
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
        if(payments>=0)
        { 
            _balances[_ethereumAddress] += payments; // return payed tokens to the sender
        }
          
        delete aclEntries[msg.sender][_resourceIdentifier][_ethereumAddress];
        emit ACLModified(_ethereumAddress, _resourceIdentifier, 0, block.number, accessCost);
    }

    // Function to get entry (to get permissions for a specific resource)
    function getEntry(address owner, bytes32 _resourceIdentifier, address _ethereumAddress) public view returns (Entry memory) {
        return aclEntries[owner][_resourceIdentifier][_ethereumAddress];
    }


    string private _name = "FaVe";
    uint256 public currentSupply = 0;
    mapping(address => uint256) private _balances;  // Token balances
    mapping (address => mapping (address => uint256)) private _allowed;
    //mapping(address => uint256) public staked;    // Staked tokens

    event DepositedAndStaked(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event Withdrawn(address indexed user, uint256 ethAmount, uint256 tokenAmount);

    // Function to deposit ETH, receive tokens, and stake them immediately
    function depositAndStake() external payable {
        require(msg.value > 0, "Must send ETH to deposit");
        uint256 tokens = msg.value * TOKENS_PER_ETH;

        // Directly adding the tokens to the staked amount
        _balances[msg.sender] += tokens;

        currentSupply += tokens;

        emit DepositedAndStaked(msg.sender, msg.value, tokens);
    }
    // Function to unstake tokens and withdraw ETH
    function unstakeAndWithdraw(uint256 tokenAmount) external {
        require(_balances[msg.sender] >= tokenAmount, "Insufficient balance");

        uint256 ethAmount = tokenAmount / TOKENS_PER_ETH;

        _balances[msg.sender] -= tokenAmount;

        currentSupply -= tokenAmount;

        payable(msg.sender).transfer(ethAmount);
        emit Withdrawn(msg.sender, ethAmount, tokenAmount);
    }


    // Function to transfer tokens from the receiver's stake to the entry from provider 
    function transferForAccess(
        bytes32 _resourceIdentifier,
        address _provider,
        uint256 _amount // can transfer more than access cost
    ) public {
        Entry storage entry = aclEntries[_provider][_resourceIdentifier][msg.sender];
        require(_balances[msg.sender] >= _amount, "Insufficient balance");

        _balances[msg.sender] -= _amount;
        
        // Transfer tokens from the receiver's stake to the sender
        entry.payed_amount += _amount;
        entry.timestamp = block.number; // timestamp for dispute resolution starts

        emit ACLTransfer(msg.sender, _provider, _resourceIdentifier, _amount);
    }

    // Function to transfer tokens from the consumer's access stake to the provider
    function chargeForServing(
        bytes32 _resourceIdentifier, 
        address _consumer) public 
    {
        Entry storage entry = aclEntries[msg.sender][_resourceIdentifier][_consumer];
        require(entry.payed_amount >= entry.access_cost, "Insufficient payed tokens");

        entry.payed_amount  -= entry.access_cost;
        _balances[msg.sender]  += entry.access_cost;
        entry.timestamp = block.number; // timestamp for dispute resolution starts

        emit ACLTransfer(msg.sender, _consumer, _resourceIdentifier, entry.access_cost);
    }

    // Function if nothing happened in 24 hours, transfer tokens from the provider Entry to sender
    function dispute(
        bytes32 _resourceIdentifier,
        address _provider) public
    {
        Entry storage entry = aclEntries[_provider][_resourceIdentifier][msg.sender];
        require(entry.payed_amount > 0, "Nothing to dispute");
        if (block.number >= entry.timestamp + (24 hours / 15 seconds)) 
        {
            _balances[msg.sender] += entry.payed_amount; // return funds back to the sender (consumer)
            entry.payed_amount = 0;
            entry.timestamp = 0;
        }
    }



    // ERC20 token functions
    function name() public view returns (string memory) { return _name;}
    function symbol() public view returns (string memory) { return _name;}
    function decimals() public pure returns (uint8) { return 18; }
    function totalSupply() public view returns (uint256) { return currentSupply; }
    function balanceOf(address _owner) public view returns (uint256 balance) { return _balances[_owner]; }
    function transfer(address _to, uint256 _value) public returns (bool success) 
    { 
        require(_value <= _balances[msg.sender]);
        require(_to != address(0));

        _balances[msg.sender] -= _value;
        _balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) 
    {
        require(_value <= _balances[_from]);
        require(_value <= _allowed[_from][msg.sender]);
        require(_to != address(0));

        _balances[_from] -= _value;
        _balances[_to] += _value;
        _allowed[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
    function approve(address _spender, uint256 _value) public returns (bool success)
    {
        require(_spender != address(0));

        _allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    function allowance(address _owner, address _spender) public view returns (uint256 remaining)
    {
        return _allowed[_owner][_spender];
    }
}