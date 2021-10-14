/* eslint-disable prettier/prettier */
// deploy/00_deploy_your_contract.js

//const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments
  // eslint-disable-next-line prettier/prettier
  const { deployer } = await getNamedAccounts();

  console.log("Deploying NFTCollection"); 
  const nftCollection = await deploy('NFTCollection', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["DataMarketNFT", "DM-C-0"],
    log: true,
  })

  console.log("Deploying Datamarket"); 
  const dataMarket = await deploy('DataMarket', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    //args: ["DataMarket", "DM", nftCollection.address], //     //args: [ "Hello", ethers.utils.parseEther("1.5") ],
    args: ["DataMarket", "DM", nftCollection.address],   //     //args: [ "Hello", ethers.utils.parseEther("1.5") ],
    log: true,
  })
  /*
  console.log("Deploying Loogies"); 
  const loogies = await deploy('Loogies', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    //args: [ "Hello", ethers.utils.parseEther("1.5") ],
    log: true,
  })

  console.log("Deploying LoogieTank"); 
  const loogieTank = await deploy('LoogieTank', {
    from: deployer,
    args: [loogies.address],
    log: true,
  })
  */

  /*
    // Getting a previously deployed contract
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
}
module.exports.tags = ['Loogies', 'LoogieTank']
