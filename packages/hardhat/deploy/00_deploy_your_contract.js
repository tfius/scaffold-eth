/* eslint-disable prettier/prettier */
// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");
//const { default: DataMinter } = require("../../react-app/src/parts/DataMinter");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments
  // eslint-disable-next-line prettier/prettier
  const { deployer } = await getNamedAccounts();

  const memberShipCollection = await deploy('DMCollection', {
    from: deployer,
    args: ["FDS Memberships", "Member"],
    log: true,
  })
  const sponsorhipCollection = await deploy('DMCollection', {
    from: deployer,
    args: ["FDS Sponsorships", "Sponsor"],
    log: true,
  })
  const allegianceCollection = await deploy('DMCollection', {
    from: deployer,
    args: ["FDS Allegiance", "Allegiance"],
    log: true,
  })
  const teamsCollection = await deploy('DMCollection', {
    from: deployer,
    args: ["FDS Teams", "Team"],
    log: true,
  })
  const groupsCollection = await deploy('DMCollection', {
    from: deployer,
    args: ["FDS Groups", "Group"],
    log: true,
  })


  const nftCollection2 = await deploy('DMCollection', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["DMNFT3", "DM-C-2"],
    log: true,
  })
  const nftCollection1 = await deploy('DMCollection', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["DMNFT2", "DM-C-1"],
    log: true,
  })

  console.log("NFTCollection *********************************"); 
  const nftCollection0 = await deploy('DMCollection', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["DMNFT", "DM-C-0"],
    log: true,
  })


  console.log("DataMarket *********************************"); 
  const dataMarket = await deploy('DataMarket', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    //args: ["DataMarket", "DM", nftCollection.address],   //     //args: [ "Hello", ethers.utils.parseEther("1.5") ],
    args: ["DataMarket", "DM"],   //     //args: [ "Hello", ethers.utils.parseEther("1.5") ],
    log: true,
  })

  console.log("SafeRangePool *********************************"); 
  const safeRangePool = await deploy('SafeRangePool', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    //args: ["DMNFT", "DM-C-0"],
    log: true,
  })

  console.log("Goldinar *********************************"); 
  const goldinarToken = await deploy('Goldinar', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    //args: [dataMarket.address, "DM-C-0"],
    log: true,
  })
  console.log("Goldinar Farm *********************************"); 
  const goldinarFarm = await deploy('GoldinarFarm', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [dataMarket.address, goldinarToken.address],
    log: true,
  })

  console.log("Set Goldinar Minter *********************************"); 

  const gt = await ethers.getContract("Goldinar", deployer);
  const goldinarMinter = await gt.MINTER_ROLE();
  console.log("Setting Goldinar Minter Role:" + goldinarMinter); 
  await gt.grantRole(goldinarMinter, goldinarFarm.address);

  console.log("Minter *********************************"); 
  const dmMinter = await deploy('DMMinter', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [dataMarket.address, deployer],
    log: true,
  })
  const minter = await ethers.getContract("DMMinter", deployer);

  console.log("Getting DataMarket", deployer); 
  const dm = await ethers.getContract("DataMarket", deployer);

  

  await dm.collectionAdd(memberShipCollection.address); // 0
  await dm.collectionAdd(sponsorhipCollection.address); // 1
  await dm.collectionAdd(allegianceCollection.address); // 2
  await dm.collectionAdd(teamsCollection.address);      // 3
  await dm.collectionAdd(groupsCollection.address);     // 4

  console.log("Treasury"); 
  await dm.setTreasury(deployer); 
  await dm.setMinter(dmMinter.address);
  await dm.defineCollectionFee(1, 5000);  // sponsorship fee 5%

  console.log("Templates");   
    // await dm.templatesInCollectionCreate(0, ["Patron","Mecene","Curator"], ["500000000000000000000","1000000000000000000000","5000000000000000000000"]); // membership
  await dm.templatesInCollectionCreate(0, ["Patron","Mecene","Curator"], ["500000000000000000","1000000000000000000","5000000000000000000"]); // membership
  await dm.templatesInCollectionCreate(1, ["Bronze","Silver","Gold"], ["1000000000000000000","10000000000000000000","100000000000000000000"] ); // sponsorship
  await dm.templatesInCollectionCreate(2, ["Developer","Artist","Manager","Player","Grunt"],[0,0,0,0,0]); // Allegiance
  await dm.templatesInCollectionCreate(3, ["Artisan Landscape","Research Cave","Innovators Den","Game Devisers"],[0,0,0,0]); // Teams
  await dm.templatesInCollectionCreate(4, ["Metier","Evolve","Trendsetter","Fearless"],[0,0,0,0]); // Teams

  // define properties 
  console.log("Requirements");
  await minter.defineBalanceRequirements(2, 0, 1, 3);   // allegianceCollection requires memberShipCollection balanceof 1 and can have max 3 tokens
  await minter.defineBalanceRequirements(3, 2, 1, 42);  // teamsCollection requires allegianceCollection balanceof 1 and max 42 tokens
  await minter.defineBalanceRequirements(4, 3, 1, 42);  // groupsCollection requires teamsCollection balanceof 1  and max 42

  console.log("Uniqueness");
  await minter.defineUniqueRequirements(2, 1); // you can not have two tokens of same template (allegiance)
  await minter.defineUniqueRequirements(3, 1); // you can not have two tokens of same template (team)
  await minter.defineUniqueRequirements(4, 1); // you can not have two tokens of same template (group)

  console.log("params Membership");   
    await dm.setCollectionParams(0,true,1); // Membership not transferable, can have only one
  console.log("params Sponsorship");     
    await dm.setCollectionParams(1,true,0); // Sponsorship not transferable
  console.log("params Allegiance");     
    await dm.setCollectionParams(2,true,0); // Allegiance not transferable, but can have many
  console.log("params Teams");     
    await dm.setCollectionParams(3,true,0); // Teams not transferable, can have many
  console.log("params Groups");     
    await dm.setCollectionParams(4,true,0); // Groups not transferable, can have many
  
  console.log("Collections Adding");     
    await dm.collectionAdd(nftCollection0.address);
    console.log("Collection 0 added", nftCollection0.address); 
    await dm.collectionAdd(nftCollection1.address);
    console.log("Collection 1 added", nftCollection2.address); 
    await dm.collectionAdd(nftCollection2.address);
    console.log("Collection 2 added", nftCollection2.address); 

  console.log("Graphable *********************************"); 
  const graphable = await deploy('DMGraphable', {
    from: deployer,
    //args: ["FDS Memberships", "Member"],
    log: true,
  })
  console.log("Graphable set"); 
  await dm.setGraphable(graphable.address); 

  console.log("Markable *********************************"); 
  const dmMarkable = await deploy('DMMarkable', {
    from: deployer,
    //args: ["FDS Memberships", "Member"],
    log: true,
  })

  console.log("Exchange *********************************"); 
  const exchange = await deploy('Exchange', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [dataMarket.address, 1], //     //args: [ "Hello", ethers.utils.parseEther("1.5") ],
    log: true,
  })
  
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
