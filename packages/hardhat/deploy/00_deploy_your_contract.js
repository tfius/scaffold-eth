// deploy/00_deploy_your_contract.js

const { ethers } = require('hardhat')

const localChainId = '31337' 

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = await getChainId() 

  // deployer 0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419

  console.log("ChainId", chainId);
  console.log("deployer", deployer);

  console.log('SwarmMail')
  const SwarmMail = await deploy('SwarmMail', {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  })
  console.log('DataHub')
  const DataHub = await deploy('DataHub', {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  })
  /*
  // Verify your contracts with Etherscan
  // You don't want to verify on localhost
  if (chainId !== localChainId) {
    await run("verify:verify", {
      address: YourContract.address,
      contract: "contracts/YourContract.sol:YourContract",
      contractArguments: [],
    });
  } */
}
module.exports.tags = ['SwarmMail', 'DataHub']
