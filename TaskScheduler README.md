# Brokerage Smart Contract Documentation

This document describes the functionality of the Brokerage smart contract written in Solidity, a language for implementing smart contracts on the Ethereum blockchain.

## Overview
The Brokerage contract provides an Ethereum-based escrow system for service buyers and brokers. It maintains a list of brokers, their associated services, and tasks related to those services.

## Data Structures

### Broker
A broker is an entity that offers one or more services. They are defined by the following fields:

- `isAway`: A boolean flag indicating whether the broker is available.
- `inEscrow`: The amount of Ether currently held in escrow for the broker.
- `earned`: The total amount of Ether earned by the broker.
- `servicesIndices`: A mapping between service IDs and a boolean flag indicating whether the service is offered by this broker.

### Service
A service is an entity that a broker can provide. It is defined by the following fields:

- `infoLocation`: The IPFS hash for additional service information.
- `price`: The cost of the service in Wei.
- `isActive`: A boolean flag indicating whether the service is currently active.

### Task
A task is a unit of work related to a service. It is defined by the following fields:

- `taskId`: The ID of the task.
- `serviceId`: The ID of the associated service.
- `data`: The IPFS hash for the data associated with the task.
- `result`: The IPFS hash for the result of the task.
- `createdAt`: The time the task was created.
- `takenAt`: The time the task was taken by the broker.
- `completedAt`: The time the task was completed.
- `payment`: The payment held in escrow for this task.
- `owner`: The address of the task owner.
- `broker`: The address of the associated broker.

## Functions

The contract includes various functions for managing brokers, services, and tasks. They fall into three main categories:

### Broker Management

- `addBroker()`: Adds a new broker.
- `setBrokerAwayStatus()`: Sets the broker's away status.
- `getBroker()`: Retrieves information about a broker.

### Service Management

- `brokerAddService()`: Adds a new service to a broker's offerings.
- `brokerUpdateServiceInfo()`: Updates information about a service.
- `brokerGetService()`: Retrieves information about a specific service.
- `brokerGetServices()`: Retrieves information about all services offered by a broker.

### Task Management

- `addTask()`: Adds a new task related to a service.
- `takePendingTask()`: Allows a broker to take a pending task.
- `completeTask()`: Marks a task as completed and transfers payment from escrow to the broker.
- `getTask()`: Retrieves information about a specific task.
- `getPendingTask()`: Retrieves information about a specific pending task.
- `getCompletedTask()`: Retrieves information about a specific completed task.

### Fee Management

- `collectFees()`: Transfers collected fees to the contract owner.

## Events

The contract emits events to allow tracking of key state changes:

- `TaskAdded`: Emitted when a new task is added.
- `TaskCompleted`: Emitted when a task is completed.

## Security Measures

The contract employs reentrancy guards to prevent reentrant calls, and the contract owner has administrative privileges to manage fees. Additionally, the contract provides a mechanism to block and unblock users as needed.

**Note**: Before deploying this contract, it is highly recommended to have a security audit conducted by professionals to ensure its safety and functionality. The contract handles valuable assets
s