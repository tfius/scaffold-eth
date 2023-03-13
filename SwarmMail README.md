# SwarmMail Contract Documentation

## Overview
The code provided defines a set of structures and functions to manage user registration, email management, lockers, shared lockers, subscription requests, and active bids.


## Introduction
This is a Solidity smart contract. The code defines a data structure to represent a user, which includes their public key, email address, and various lists of emails, subscription requests, active bids, and subscription items.

The code also includes a modifier `isRegistered()` that requires that the user is registered before executing a function. There is a function `register()` that allows a user to register with a public key.

There are also functions to set and get portable addresses for users, and a receive function that allows the contract to receive Ether.

### Function modifier `isRegistered()`
This modifier checks if a user is registered by verifying if their key is not equal to bytes32(0). If the user is not registered, it throws an error message.

### Function `getPublicKeys(address addr) public view returns (bool registered, bytes32 key, bytes32 smail, address portable)` 
This function returns the public keys of a user with the given addr. It checks if the user is registered, sets the registered boolean value to true or false accordingly. It then returns the key, smail, and portable values of the user.

### Structure struct `Email`
This structure defines an email object with the following attributes:

- `isEncryption`: a boolean value indicating whether the email is encrypted or not.
- `time`: a timestamp indicating the time the email was sent.
- `from`: the address of the sender.
- `to`: the address of the receiver.
- `swarmLocation`: a bytes32 value indicating the location of the email in the swarm network.
- `signed`: a boolean value indicating whether the email is signed or not.
### Structure struct `SubRequest`
This structure defines a subscription request object with the following attributes:

- `fdpBuyerNameHash`: a bytes32 value representing the name of the buyer in hashed format.
- `buyer`: the address of the buyer.
- `subHash`: a bytes32 value representing the subscription.
- `requestHash`: a bytes32 value representing the hash of the request.

### Structure struct `ActiveBid`
This structure defines an active bid object with the following attributes:

- `seller`: the address of the seller.
- `requestHash`: a bytes32 value representing the hash of the request.

### Structure struct `SubItem`
This structure defines a subscription item object with the following attributes:

- `subHash`: a bytes32 value representing the subscription.
- `unlockKeyLocation`: a bytes32 value indicating the location of the key to unlock the subscription.
- `validTill`: a uint256 value indicating the expiry time of the subscription.

### Structure struct `User`
This structure defines a user object with the following attributes:

- `key`: a bytes32 value representing the user's public key.
- `smail`: a bytes32 value representing the user's email address.
- `sentEmails`: an array of Email objects representing the emails sent by the user.
- `sentEmailIds`: a mapping of bytes32 values to uint256 values representing the IDs of the sent emails.
- `inboxEmails`: an array of Email objects representing the emails received by the user.
- `inboxEmailIds`: a mapping of bytes32 values to uint256 values representing the IDs of the received emails.
- `lockerEmails`: an array of Email objects representing the emails stored in the user's locker.
- `lockerEmailIds`: a mapping of bytes32 values to uint256 values representing the IDs of the stored emails.
- `sharedLockerEmails`: an array of Email objects representing the emails shared by the user.
- `sharedLockerEmailIds`: a mapping of bytes32 values to uint256 values representing the IDs of the shared emails.
- `subRequests`: an array of SubRequest objects representing the subscription requests made by the user.
- `subRequestIds`: a mapping of bytes32 values to uint256 values representing the IDs of the subscription requests.
- `subItems`: an array of SubItem objects representing the subscriptions of


#### Arguments
- `addr`, which is the address of the user whose inbox is to be retrieved.

### Function `getInboxCount(address addr)`
***deprecated**
This function returns the length of the inbox of a given user with the address `addr`. The function is a public view function, which means it does not modify the state of the contract and can be called from any address. 
#### Arguments
- `addr`, which is the address of the user whose inbox count is to be retrieved.

### Function `getInboxRange(address addr, uint start, uint length)`
This function returns a range of `Email` struct objects representing the inbox of a given user with the address `addr`. The function is a public view function, which means it does not modify the state of the contract and can be called from any address. 
#### Arguments
- `addr` is the address of the user whose inbox is to be retrieved, 
- `start` is the starting index of the range to be retrieved, and 
- `length` is the length of the range to be retrieved.

### Function `getInbox(address addr)`
***Deprecated***
This function returns an array of Email struct objects representing the inbox of a given user with the address `addr`. The function is a public view function, which means it does not modify the state of the contract and can be called from any address. 
### Function `getSent(address addr)`
***Deprecated***
This function returns an array of Email struct objects representing the sent messages of a given user with the address `addr`. The function is a public view function, which means it does not modify the state of the contract and can be called from any address. Returned objects are unreadable by sender.

#### Arguments
- `addr`, which is the address of the user whose sent messages are to be retrieved.

### Function `getSubRequests(address addr)`
This function returns an array of SubRequest struct objects representing the subscription requests of a given user with the address `addr`. The function is a public view function, which means it does not modify the state of the contract and can be called from any address. 
#### Arguments
`addr`, which is the address of the user whose subscription requests are to be retrieved.

### Function `getSubItemsCount(address addr)`
This function returns the count of active subscription items of a given user with the address `addr`. The function is a public view function, which means it does not modify the state of the contract and can be called from any address. The function takes one argument `addr`, which is the address of the user whose active subscription items count is to be retrieved. An active subscription item is an item whose `validTill` property is greater than the current block timestamp.

### Function `getSubItems(address addr, uint start, uint length)`
This function returns an array of SubItem struct objects for a given user's active subscriptions. The function takes in three arguments, 
#### Arguments 
- `addr` which is the user's address, 
- `start` which is the starting index of the returned array, and 
- `length` which is the number of SubItems to be returned.

If the user has no active subscriptions, the function returns an empty array. If the number of requested SubItems exceeds the total active subscriptions, the function returns only the available subscriptions.

Internally, the function iterates through all SubItems in the user's subscription list to check if they are active, and then returns only the active subscriptions within the specified range.

### Function `getSubItemBy(address addr, bytes32 subHash)`
This function takes two arguments, addr which is the user's address and `subHash` which is the hash of the SubItem struct object to be retrieved. The function returns the SubItem struct object for the given hash if the subscription is active, and throws an error if the subscription is inactive or does not exist.

Internally, the function checks if the SubItem is active by comparing the `validTill` property of the `SubItem` with the current timestamp. If the subscription is active, the function returns the `SubItem`.

### Function `getAllSubItems(address addr)`
This function returns an array of all the `SubItem` struct objects for a given user, including both `active` and `inactive` subscriptions. The function takes in one argument, 
#### Arguments 
`addr` which is the user's address.

Internally, the function iterates through all SubItems in the user's subscription list and sets the `unlockKeyLocation` property to bytes32(0) for active subscriptions and inactive subscriptions. The function then returns the updated array of all `SubItems`.

### Function `getInboxAt(address addr, uint index)` public view returns (Email memory)
Returns the Email object located at the given index of the inboxEmails array for the specified addr user.
#### Arguments 
- `addr`: The Ethereum address of the user whose inboxEmails array is being queried.
- `index`: The index of the Email object to retrieve from the inboxEmails array.

### Function `getSentAt(address addr, uint index)` public view returns (Email memory)
Returns the Email object located at the given index of the sentEmails array for the specified addr user.
#### Arguments 
- `addr`: The Ethereum address of the user whose sentEmails array is being queried.
- `index`: The index of the Email object to retrieve from the sentEmails array.

### Function `getSubRequestAt(address addr, uint index)` public view returns (SubRequest memory)
Returns the `SubRequest` object located at the given index of the subRequests array for the specified addr user.
#### Arguments 
- `addr`: The Ethereum address of the user whose subRequests array is being queried.
- `index`: The index of the SubRequest object to retrieve from the subRequests array.

### Function `getSubItemAt(address addr, uint index)` public view returns (SubItem memory)
Returns the `SubItem` object located at the given index of the subItems array for the specified addr user.
#### Arguments 
- `addr`: The Ethereum address of the user whose subItems array is being queried.
- `index`: The index of the SubItem object to retrieve from the subItems array.

### Function `getActiveBidAt(address addr, uint index)` public view returns (ActiveBid memory)
Returns the `ActiveBid` object located at the given index of the activeBids array for the specified addr user.
#### Arguments 
- `addr`: The Ethereum address of the user whose activeBids array is being queried.
- `index`: The index of the `ActiveBid` object to retrieve from the activeBids array.

### Function `signEmail(bytes32 swarmLocation)` public
Allows the recipient of an email to sign it by setting the signed flag to true in the corresponding Email object.
#### Arguments 
- `swarmLocation`: The swarm location hash of the email being signed.
This function can only be called by the recipient of the email and the email must exist in the recipient's inbox.

### Function `sendEmail(address toAddress, bool isEncryption, bytes32 swarmLocation)` public payable
This function allows a user to send an email to another user with the specified toAddress. The email can be encrypted or unencrypted, depending on the value of isEncryption. The location of the email in the Swarm network is specified by swarmLocation. The function also requires the sender to provide some Ether for the transaction.
#### Arguments
- `toAddress`: The Ethereum address of the recipient of the email.
- `isEncryption`: A boolean value indicating whether the email is encrypted or not.
- `swarmLocation`: The swarm location hash of the email being sent. 

### Function `removeSentEmail(bytes32 swarmLocation)` public
This function allows a user to remove a sent email with the specified swarmLocation from their sent email list.
#### Arguments
- `swarmLocation`: The swarm location hash of the email being removed. 

### `removeInboxEmail(bytes32 swarmLocation)` public
This function allows a user to remove an email with the specified swarmLocation from their inbox.
#### Arguments
- `swarmLocation`: The swarm location hash of the email being removed.

### Function `removeEmails(uint256 types, bytes32[] memory swarmLocations)` public
This function allows a user to remove one or more emails based on their types (types parameter) and swarmLocation. The types parameter should be set to 0 for sent emails, 1 for inbox emails, and 2 for locker emails. The swarmLocations parameter should be an array of the swarmLocation values of the emails to be removed.

Note that these functions modify the email lists of the user calling the function and cannot be used to modify the emails of other users.
#### Arguments
- `types`: The type of emails to be removed. 0 for sent emails, 1 for inbox emails, and 2 for locker emails.
- `swarmLocations`: An array of the swarmLocation values of the emails to be removed. 

#### Arguments 


# Locker and sharing 
This part of smart contract provides functionality for creating and managing shared lockers.
### Function `getSharedLocker(address addr)`
Returns an array of `Email` structs representing the shared lockers of the given address.
#### Arguments
- `addr` - The address of the user whose shared lockers should be returned.
#### Return Value
An array of `Email` structs representing the shared lockers of the given address.

### Function `getSharedLockerCount(address addr)`
Returns the number of shared lockers owned by the given address.
#### Arguments
- `addr` - The address of the user whose shared locker count should be returned.
#### Return Value
The number of shared lockers owned by the given address.

### Function `getSharedLockerRange(address addr, uint start, uint length)`
Returns a range of `Email` structs representing the shared lockers of the given address.
#### Arguments
- `addr` - The address of the user whose shared lockers should be returned.
- `start` - The index of the first shared locker to be returned.
- `length` - The number of shared lockers to be returned.
#### Return Value
An array of `Email` structs representing the shared lockers of the given address.

### Function `shareLockerWith(bytes32 swarmLocation, address withAddress)`
Shares a locker with another user.
#### Arguments
- `swarmLocation` - The location of the locker on Swarm.
- `withAddress` - The address of the user with whom the locker is being shared.

### Function `unshareLockerWith(bytes32 swarmLocation, address withAddress)`
Stops sharing a locker with another user.
#### Arguments
- `swarmLocation` - The location of the locker on Swarm.
- `withAddress` - The address of the user with whom the locker is no longer being shared.

# Marketplace
The following code defines a smart contract that implements a marketplace for pod subscriptions. It includes several functions for setting and getting the subscription fees, enabling and listing subscriptions, and requesting and allowing access on them.

## **User MUST be** ##
- connected with FairOS account 
- bonded with Smail contract 
To list pod subscriptions and request access. 

### Function `getListedSubs(address addr)` public view returns (bytes32[] memory)
This function retrieves the list of subscription hashes that the user has listed for sale.
#### Arguments
- `addr`: Ethereum address of the user
#### Returns
- `bytes32[]`: An array of subscription hashes that the user has listed for sale.

### Function `getActiveBids(address addr)` public view returns (ActiveBid[] memory)
This function retrieves the active bids made by the user on other users' listed subscriptions.
#### Arguments
- `addr`: Ethereum address of the user
#### Returns
- `ActiveBid[]`: An array of ActiveBid structs representing the active bids made by the user.

### Function `getSubRequestByHash(address addr, bytes32 requestHash)` public view returns (SubRequest memory)
This function retrieves a SubRequest struct by its hash.
#### Arguments
- `addr`: Ethereum address of the user
- `requestHash`: The hash of the SubRequest struct to retrieve.
#### Returns
- `SubRequest`: The SubRequest struct with the given hash.

### Function `getBoxCount(address addr)` public view returns (uint numInboxItems, uint numSentItems, uint numSubRequests, uint numSubItems, uint numActiveBids)
This function retrieves the count of items in various boxes of the user.
#### Arguments
- `addr`: Ethereum address of the user
#### Returns
- `uint`: Five uint values representing the count of items in the following boxes respectively:
- `numInboxItems`: Number of items in the inbox of the user.
- `numSentItems`: Number of items in the sent box of the user.
- `numSubRequests`: Number of subscription requests made by the user.
- `numSubItems`: Number of subscription items owned by the user.
- `numActiveBids`: Number of active bids made by the user on other users' listed subscriptions.
### Constants:
- `FEE_PRECISION` with a value of 1e5
- `marketFee` with a value of 1000
- `minListingFee` with a value of 1000000 gwei
- `feesCollected` with an initial value of 0
- `inEscrow` with an initial value of 0

### Structs:
#### Struct `Category` 
   with a uint array subIdxs field
#### Struct `Sub` with fields:
- `subHash` (bytes32)
- `fdpSellerNameHash` (bytes32)
- `seller` (address)
- `swarmLocation` (bytes32)
- `price` (uint256)
- `active` (bool)
- `earned` (uint256)
- `bids` (uint32)
- `sells` (uint32)
- `reports` (uint32)
- `daysValid` (uint)
### Functions:
- `getFee(uint256 _fee, uint256 amount) public pure returns (uint256)`
- `setFee(uint256 newFee) public`
- `setListingFee(uint256 newListingFee) public`
- `getSubSubscribers(bytes32 subHash) public view returns (address[] memory)`
- `getSubInfoBalance(bytes32 subHash, address forAddress) public view returns (uint256)`
- `getSubs() public view returns (Sub[] memory)`
- `getCategory(bytes32 category) public view returns (Category memory)`
- `getSub(uint index) public view returns (Sub memory)`
- `getSubBy(bytes32 subHash) public view returns (Sub memory)`
- `enableSub(bytes32 subHash, bool active) public`
- `listSub(bytes32 fdpSellerNameHash, bytes32 dataSwarmLocation, uint price, bytes32 category, - address podAddress, uint daysValid) public payable`
- `bidSub(bytes32 subHash, bytes32 fdpBuyerNameHash) public nonReentrant payable`
- `sellSub(bytes32 requestHash, bytes32 encryptedKeyLocation) public payable`
- `removeUserActiveBid(bytes32 requestHash) public`
- `removeActiveBid(address user, bytes32 requestHash) private`
- `removeSubItem(uint256 index) public`
- `removeSubRequest(address owner, bytes32 requestHash) private`
## Marketplace Functions
### Function `getFee(uint256 _fee, uint256 amount)`
Description: Calculates the fee based on the percentage and amount.
#### Arguments
- `_fee`: the percentage of the fee.
- `amount`: the amount to apply the fee.
#### Returns
Return Value: The calculated fee.

### Function `setFee(uint256 newFee)`
Description: Sets the market fee percentage.
#### Arguments
- `newFee`: the new market fee percentage.

### Function `setListingFee(uint256 newListingFee)`
Description: Sets the minimum listing fee.
#### Arguments
- `newListingFee`: the new minimum listing fee.

### Function `getSubSubscribers(bytes32 subHash)`
Description: Retrieves the list of subscribers for a given subscription.
#### Arguments
- `subHash`: the hash of the subscription.
#### Returns
Return Value: An array of addresses that subscribed to the subscription.

### Function `getSubInfoBalance(bytes32 subHash, address forAddress)`
Description: Retrieves the balance of a subscriber for a given subscription.
#### Arguments
- `subHash`: the hash of the subscription.
- `forAddress`: the address of the subscriber.
#### Returns
Return Value: The balance of the subscriber.

### Function `getSubs()`
Description: Retrieves all subscriptions.
#### Returns
Return Value: An array of Sub structs representing all subscriptions.

### Function `getCategory(bytes32 category)`
Description: Retrieves the category information.
#### Arguments
- `category`: the name of the category.
#### Returns
Return Value: A Category struct representing the category.

### Function `getSub(uint index)`
Description: Retrieves the subscription at the specified index.
#### Arguments
- `index`: the index of the subscription.
#### Returns
Return Value: A Sub struct representing the subscription.

### Function `getSubBy(bytes32 subHash)`
Description: Retrieves the subscription with the specified hash.
#### Arguments
- `subHash`: the hash of the subscription.
#### Returns
Return Value: A Sub struct representing the subscription.

### Function `enableSub(bytes32 subHash, bool active)`
Description: Enables or disables a subscription.
#### Arguments
- `subHash`: the hash of the subscription.
- `active`: true to enable or false to disable.

### Function `listSub(bytes32 fdpSellerNameHash, bytes32 dataSwarmLocation, uint price, bytes32 category, address podAddress, uint daysValid)`
Description: Lists a subscription.
#### Arguments
- `fdpSellerNameHash`: the hash of the seller's name.
- `dataSwarmLocation`: the location of the subscription's metadata.
- `price`: the price of the subscription.
- `category`: the category of the subscription.
- `podAddress`: the address of the pod.
- `daysValid`: the number of days the subscription is valid.

### Function `bidSub(bytes32 subHash, bytes32 fdpBuyerNameHash)`
Description: Places a bid on a subscription.
#### Arguments
- `subHash`: the hash of the subscription.
- `fdpBuyerNameHash`: the hash of the buyer's name.


### Function `sellSub(bytes32 requestHash, bytes32 encryptedKeyLocation) public payable`
This function is used to sell a subscription to a buyer who has previously placed a bid. The function takes in two arguments, the `requestHash` which is a hash of the bid request placed by the buyer, and the `encryptedKeyLocation` which is the encrypted location of the subscription unlock key.

The function first checks if the seller has a corresponding bid request in their list of sub requests. If not, it throws an error. If the request is found, it checks if the subscription corresponding to the bid exists in the subscription list. If not, it throws an error. If the subscription exists, it checks if the message sender is the seller. If not, it throws an error.

Next, the function calculates the fee payable to the market and the amount payable to the seller. The fee is calculated using the `getFee()` function. The value sent must be equal to the subscription price. If the value sent is less than the subscription price, the transaction is reverted.

The function then updates the subscription's sell count and earnings. It also adds the subscription to the buyer's list of subscriptions and updates the subscription's balance per subscriber.

If the buyer is not already a subscriber, they are added to the subscription's list of subscribers. Finally, the function removes the bid request from the seller's list of sub requests and removes the bid request from the buyer's list of active bids.

#### Arguments
- `requestHash`: the hash of the bid request.
- `encryptedKeyLocation`: the encrypted location of the subscription unlock key.

#### Returns

### Function `removeUserActiveBid(bytes32 requestHash) public`

This function is used to remove a bid request from a user's list of active bids. It takes in one argument, `requestHash` which is a hash of the bid request.

The function first checks if the user has a corresponding active bid request in their list of active bids. If not, it throws an error. If the request is found, it checks if the seller has a corresponding sub request in their list of sub requests. If not, it throws an error. If the subscription corresponding to the bid exists in the subscription list, the function returns the funds back to the buyer.
#### Arguments
- `requestHash`: the hash of the bid request.
#### Returns

### Function `removeActiveBid(address user, bytes32 requestHash) private`
This function is used to remove an active bid request from a user's list of active bids. It takes in two arguments, `user` which is the address of the user and `requestHash` which is a hash of the bid request.

The function first checks if the user has a corresponding active bid request in their list of active bids. If not, it throws an error. If the request is found, the function replaces the bid request at the remove index with the last bid request and pops the last bid request.
#### Arguments
- `user`: the address of the user.
- `requestHash`: the hash of the bid request.
#### Returns

### Function `removeSubItem(uint256 index) public`
This function is used to remove a subscription item from a user's list of subscriptions. It takes in one argument, `index` which is the index of the subscription item to remove.

The function first checks if the index is valid for the user's list of subscription items. If not, it throws an error. If the index is valid, the function replaces the subscription item at the remove index with the last subscription item and pops the last subscription item.
#### Arguments
- `index`: the index of the subscription item to remove.
#### Returns


### Function `removeSubRequest(address owner, bytes32 requestHash) private`
This function is used to remove a sub request from a seller's list of sub requests. It takes in two arguments, `owner` which is the address of the seller and `requestHash` which is a hash of the sub request.

The function first checks if the seller has a corresponding sub request in their list of sub requests. 
#### Arguments
- `owner`: the address of the seller.
- `requestHash`: the hash of the sub request.
#### Returns
