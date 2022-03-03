# Resistance platform 
This project started as an adventure into scaffold-eth and extending NFTs with functionality that Swarm offers. 
Partially a 

hardhat config: polygon
app.js targetNetwork: NETWORKS.polygon
yarn generate 
yarn account (get address of deployer)

### polygon deployments:
Deployer 0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419

- "DMMarkable" at 0x719739C44f9c6DE441db4455E2D9BD81c80711C6
- "DMGraphable" at 0x5D68cded166fDC10a4BE6131d0339B6b4b35a703
- "DMHelpers" at 0xf0D5c3B4B4644Ff4d9DDEc4AfCf269E455522E89
- "Goldinar" at 0x69b983Fb431cc7aA684bE834F990374b808a4bF3
- "ExchangeDM" at 0x2E6cf9663489C9C91eE4cb782f6548AaB5890C3a
- "AvatarAbility" at 0x6388855bc78e9A8C6676cd7B7eE79E73e7c13b28
- "AvatarReputation" at 0xABd54C1C76a9bD9842C54a6e0a026BC8aBe7b437
- "AvatarPlur" at 0x8D06fbe56B78f70Df97A1d1012D792eC2438fc06
- "AvatarRelatable" at 0x5a401b4Aa067f5fc383761EC946d810139769a08
- "Avatar" at 0xED4bAe937caFA7A74Ca07261E4e471a2dd9DBBC2
- "DataMarket" at 0x40377607Ab5d102a12Ce4A48049bf6C90c3D88F8
- "GoldinarFarm" at 0x2E7599382944caCA52E51EF3A2734a1faBB0f4fa
- "Voting" at 0x30db879398a0A6633320e46e93b53E96F54DB1a0
- "DMMinter" at 0xBA5C999B518d0c70df935f46b82e7d3a43bD7fAf
- "DMCollection1" at 0xf00320fc4208F99b1610380B2Afe2b0f12443d7b
- "DMCollection" at 0x055D6c21CAc978087B1DAc8e815CB9898e8a20EF
- "DMCollectionMember" at 0xc5b8145c1027131797859b41B467c736d71F083d
- "DMCollectionAllegiance" at 0xaEa649bA522C5a501d8A4881172E6AB50A27a4e8
- "DMCollectionTeam" at 0x85Fe3eb1209F9DbFBdca7075E8057a2aCbbBFB00
- "DMCollectionGroup" at 0x1fE231c16d3297E1EEdEE002c5d9B7B3627318A7
# 🏗 scaffold-eth - Composable SVG NFT


## Prerequisites

This branch is an extension of [loogie-svg-nft](https://github.com/scaffold-eth/scaffold-eth/tree/loogies-svg-nft) branch. Watch its [demo](https://www.youtube.com/watch?v=m0bwE5UelEo) to understand more about it.


## Getting Started

### Installation

Clone the repo:
```
git clone -b composable-svg-nft https://github.com/scaffold-eth/scaffold-eth.git composable-svg-nft
cd composable-svg-nft
```

Install dependencies:
```
yarn install
```

Start frontend
```
cd composable-svg-nft
yarn start
```

In a second terminal window, start a local blockchain
```
yarn chain
```

In a third terminal window, deploy contracts:
```
cd composable-svg-nft
yarn deploy
```


## Introduction

This branch shows how to set up an SVG NFT contract so that other NFTs can use it in their SVG code. This leads to an easy composition of SVG NFTs.

Take a look at `Loogies.sol` at `packages/hardhat/contracts`. It describes an SVG NFT that is defined by two parameters: `color` and `chubbiness` randomly generated at mint. It exposes a function:
```
function renderTokenById(uint256 id) public view returns (string memory)
```

It returns the relevant SVG that be embedded in other SVG code for rendering.

To see how, take a look at `LoogieTank.sol` at `packages/hardhat/contracts`. Its `renderTokenById` function calls `Loogies` contracts `renderTokenById` to include the SVG in its own SVG code.

Without this function, `LoogieTank` would have to do additional processing to extract the SVG code.

## Demo

1. Go to the **Mint Loogie Tank** tab and mint some tank by clicking the **MINT** button. Notice that each tank has a unique ID.

   <img width="400" src="https://user-images.githubusercontent.com/1689531/135761678-d7f0c82c-9129-49ca-b943-d8d4a0222d9b.png">

1. Now mint some loogies on **Mint Loogies** tab.

   <img width="400" src="https://user-images.githubusercontent.com/1689531/135761696-4fc759bf-17f6-416d-a454-0d5722d0aa7f.png">


1. Send these loogies to any of the minted tanks by entering the tank ID and click **Transfer**.

   <img width="354" src="https://user-images.githubusercontent.com/1689531/135761726-8c2f5ea4-8c0a-4fa8-b08d-d38a7fe2634a.png">

1. Enjoy your loogies in a tank. 😎

   <img width="400" src="https://user-images.githubusercontent.com/1689531/135761763-0bdb225b-ee33-44e5-a800-1f217a83ec37.jpeg">


## Contact

Join the telegram [support chat 💬](https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA) to ask questions and find others building with 🏗 scaffold-eth!
