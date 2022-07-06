// deploy/00_deploy_your_contract.js

const { ethers } = require('hardhat')

const localChainId = '31337' 

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = await getChainId() 

  console.log("ChainId", chainId);
  console.log("deployer", deployer);

  console.log('DateTime helper contract')
  const dateTime = await deploy('DateTime', {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  })

  console.log('COP Requests Registry')
  const copRequest = await deploy('COPRequestReviewRegistry', {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  })

  console.log('Carbon Offset Protocol')
  const copToken = await deploy('CarbonOffsetProtocol', {
    from: deployer,
    // args: [dataMarket.address, "DM-C-0"],
    log: true,
  })

  console.log('COP Issuer')
  const copIssuer = await deploy('COPIssuer', {
    from: deployer,
    args: [dateTime.address, copToken.address, copRequest.address],
    log: true,
  })

  console.log('COP Issuer Is Minter');
  const cop = await ethers.getContract('CarbonOffsetProtocol', deployer)
  const copMinter = await cop.MINTER_ROLE()

  console.log('Setting COP Minter Role')
  await cop.grantRole(copMinter, copIssuer.address)

  console.log('Setting ROLES')
  
  const adminAddress = "0xFCb3cEb13d9399257Fc43708A7DAb778fa62E57D";
  

  console.log('Setting Issuer Roles')
  const issuer = await ethers.getContract('COPIssuer', deployer)
  console.log("issuer", issuer.address)

  const addValidator = await issuer.ROLE_ADDVALIDATOR()
  const addInvestor = await issuer.ROLE_INVEST_VALIDATOR()
  const addManufacturer = await issuer.ROLE_MANUFACTURER_VALIDATOR()
  const addProduction = await issuer.ROLE_PRODUCTION_VALIDATOR()

  console.log("grant validator", adminAddress)
  await issuer.grantRole(addValidator, adminAddress)

  console.log("grant investor role", adminAddress)
  await issuer.grantRole(addInvestor, adminAddress)

  console.log("grant manufacturer  role", adminAddress)
  await issuer.grantRole(addManufacturer, adminAddress)

  console.log("grant production role", adminAddress)
  await issuer.grantRole(addProduction, adminAddress)

  const registry = await ethers.getContract('COPRequestReviewRegistry', deployer)
  console.log("registry", registry.address)
  
  const addReviewer = await registry.ROLE_REVIEWER()
  const addFinalizer = await registry.ROLE_FINALIZER()

  console.log("grant reviewer role", adminAddress)
  await registry.grantRole(addReviewer, adminAddress)
  console.log("grant finalizer role", adminAddress)
  await registry.grantRole(addFinalizer, adminAddress)
  


  /*
      ROLE_ADDVALIDATOR
      ROLE_KYC_VALIDATOR
      ROLE_INVEST_VALIDATOR
      ROLE_MANUFACTURER_VALIDATOR
      ROLE_PRODUCTION_VALIDATOR  
   */


  /*
  await deploy("YourContract", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    // args: [ "Hello", ethers.utils.parseEther("1.5") ],
    log: true,
  }); */

  // Getting a previously deployed contract
  /*
  const YourContract = await ethers.getContract("YourContract", deployer);
   await YourContract.setPurpose("Hello");
  
    To take ownership of yourContract using the ownable library uncomment next line and add the 
    address you want to be the owner. 
    // yourContract.transferOwnership(YOUR_ADDRESS_HERE);

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */

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
module.exports.tags = ['YourContract']
