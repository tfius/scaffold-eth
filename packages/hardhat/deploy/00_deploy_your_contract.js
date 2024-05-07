/* eslint-disable no-unused-vars */
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

  console.log("SDF Token");
  const Token = await deploy("TestToken", {
    from: deployer,
    log: true,
    args: ["Social Data Funds", "SDF", "1000000000000000000000000000"],
  });

  // transfer tokens to deployer
  const token = await ethers.getContract("TestToken");
  await token.transfer(
    "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419",
    ethers.utils.parseEther("100")
  );
  await token.transfer(deployer, ethers.utils.parseEther("1000000"));

  console.log("DataRelayService");
  const DataRelayService = await deploy("DataRelayService", {
    from: deployer,
    log: true,
    args: [token.address],
  });

  const dataRelayService = await ethers.getContract("DataRelayService");
  await dataRelayService.changeBeneficiary(
    "0xdaa070D909E010211606144eDe5B2ca6864C2c1c",
    { from: deployer }
  );
  await dataRelayService.changeOwner(
    "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419",
    { from: deployer }
  );

  //return;

  console.log("SwarmMail");
  const SwarmMail = await deploy("SwarmMail", {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  });

  console.log("DocumentNotarization");
  const DocumentNotarization = await deploy("DocumentNotarization", {
    from: deployer,
    log: true,
    args: [SwarmMail.address],
  });

  const swarmMail = await ethers.getContract("SwarmMail");
  await swarmMail.setNotarizationContract(DocumentNotarization.address);

  const notarizationService = await ethers.getContract("DocumentNotarization");
  await notarizationService.grantNotarizerRole(
    "0xdaa070D909E010211606144eDe5B2ca6864C2c1c",
    { from: deployer }
  );
  await notarizationService.grantNotarizerRole(
    "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419",
    { from: deployer }
  );
  await notarizationService.grantAttestorRole(
    "0xdaa070D909E010211606144eDe5B2ca6864C2c1c",
    { from: deployer }
  );
  await notarizationService.grantAttestorRole(
    "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419",
    { from: deployer }
  );

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
