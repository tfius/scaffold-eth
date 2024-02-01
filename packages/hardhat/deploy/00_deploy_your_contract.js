// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // deployer 0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419

  console.log("ChainId", chainId);
  console.log("deployer", deployer);

  console.log("TestToken");
  const Token = await deploy("TestToken", {
    from: deployer,
    log: true,
    args: ["localBZZ", "LBZZ", "1000000000000000000000000000"],
  });

  // transfer tokens to deployer
  const token = await ethers.getContract("TestToken");
  await token.transfer(
    "0x1894F06a48acD00A2793A0eB00FFE7B6184B630e",
    ethers.utils.parseEther("1000000")
  );
  await token.transfer(deployer, ethers.utils.parseEther("1000000"));

  return;

  console.log("SwarmMail");
  const SwarmMail = await deploy("SwarmMail", {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  });
  console.log("DataHub");
  const DataHub = await deploy("DataHub", {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  });
  console.log("Calendar");
  const Calendar = await deploy("Calendar", {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  });
  console.log("Scheduler");
  const Scheduler = await deploy("Scheduler", {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  });
  console.log("TaskBroker");
  const TaskBroker = await deploy("TaskBroker", {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  });
  console.log("SocialGraph");
  const SocialGraph = await deploy("SocialGraph", {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  });
  console.log("Governance");
  const Governance = await deploy("Governance", {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  });

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
};
module.exports.tags = ["SwarmMail", "DataHub"];
