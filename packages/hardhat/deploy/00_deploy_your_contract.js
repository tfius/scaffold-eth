/* eslint-disable prettier/prettier */
// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const delay = ms => new Promise(res => setTimeout(res, ms));
//const { default: DataMinter } = require("../../react-app/src/parts/DataMinter");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments
  // eslint-disable-next-line prettier/prettier
  const { deployer } = await getNamedAccounts();
  const waitTime=1000;

  /*
  console.log("Multibox"); 
  const multibox = await deploy('Multibox', {
    from: deployer,
    //args: ["FDS Memberships", "Member"],
    log: true,
  })*/

  console.log("Deployer", deployer);

  
  console.log("Markable *********************************"); 
  const dmMarkable = await deploy('DMMarkable', {
    from: deployer,
    //args: ["FDS Memberships", "Member"],
    log: true,
  })
  console.log("Graphable *********************************"); 
  const graphable = await deploy('DMGraphable', {
    from: deployer,
    //args: ["FDS Memberships", "Member"],
    log: true,
  })
  console.log("DMHelpers *********************************"); 
  const dmHelpers = await deploy('DMHelpers', {
    from: deployer,
    //args: ["FDS Memberships", "Member"],
    log: true,
  })
  console.log("Goldinar *********************************"); 
  const goldinarToken = await deploy('Goldinar', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    //args: [dataMarket.address, "DM-C-0"],
    log: true,
  })
  const exchangeDM = await deploy('ExchangeDM', {
    from: deployer,
    args: [goldinarToken.address],
    log: true,
  })  
  const avatarAbility = await deploy('AvatarAbility', {
    from: deployer,
    //args: [dataMarket.address, deployer],
    log: true,
  })
  const avatarReputation = await deploy('AvatarReputation', {
    from: deployer,
    //args: [dataMarket.address, deployer],
    log: true,
  })
  const avatarPlur = await deploy('AvatarPlur', {
    from: deployer,
    //args: [dataMarket.address, deployer],
    log: true,
  })
  const avatarRelatable = await deploy('AvatarRelatable', {
    from: deployer,
    //args: [dataMarket.address, deployer],
    log: true,
  })
  const avatar = await deploy('Avatar', {
      from: deployer,
      args: [avatarAbility.address, avatarReputation.address, avatarPlur.address, avatarRelatable.address],
      log: true,
   }); 
   console.log("DataMarket *********************************"); 
   const dataMarket = await deploy('DataMarket', {
     // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
     from: deployer,
     //args: ["DataMarket", "DM", nftCollection.address],   //     //args: [ "Hello", ethers.utils.parseEther("1.5") ],
     args: ["DataMarket", "DMT"],   //     //args: [ "Hello", ethers.utils.parseEther("1.5") ],
     log: true,
   })
 
   console.log("Goldinar Farm *********************************"); 
   const goldinarFarm = await deploy('GoldinarFarm', {
     // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
     from: deployer,
     args: [dataMarket.address, goldinarToken.address],
     log: true,
   })
 
   console.log("Avatar Voting *********************************"); 
   const voting = await deploy('Voting', {
     from: deployer,
     args: [goldinarToken.address, avatar.address],
     log: true,
   })
 
   console.log("Minter *********************************"); 
   const dmMinter = await deploy('DMMinter', {
     // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
     from: deployer,
     args: [dataMarket.address, deployer],
     log: true,
   }) 

  console.log("NFTCollection *********************************"); 
  /*const nftCollection2 = await deploy('DMCollection', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["DMTNFT3", "DM-C-2", dmHelpers.address],
    log: true,
  })*/
  const nftCollection1 = await deploy('DMCollection1', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["DMTNFT2", "DM-C-1", dmHelpers.address],
    log: true,
  })
  const nftCollection0 = await deploy('DMCollection', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: ["DMTNFT", "DM-C-0", dmHelpers.address],
    log: true,
  })  

  console.log("Resistance *********************************"); 
  console.log("Membership *********************************"); 
  const memberShipCollection = await deploy('DMCollectionMember', {
    from: deployer,
    args: ["FDS Memberships", "Member", dmHelpers.address],
    log: true,
  })
  console.log("Sponsorship *********************************"); 
  const sponsorhipCollection = await deploy('DMCollectionSponsor', {
    from: deployer,
    args: ["FDS Sponsorships", "Sponsor", dmHelpers.address],
    log: true,
  })
  console.log("Allegiance *********************************"); 
  const allegianceCollection = await deploy('DMCollectionAllegiance', {
    from: deployer,
    args: ["FDS Allegiance", "Allegiance", dmHelpers.address],
    log: true,
  })
  console.log("Team *********************************"); 
  const teamsCollection = await deploy('DMCollectionTeam', {
    from: deployer,
    args: ["FDS Teams", "Team", dmHelpers.address],
    log: true,
  })
  console.log("Group *********************************"); 
  const groupsCollection = await deploy('DMCollectionGroup', {
    from: deployer,
    args: ["FDS Groups", "Group", dmHelpers.address],
    log: true,
  })


/*
  console.log("SafeRangePool *********************************"); 
  const safeRangePool = await deploy('SafeRangePool', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    //args: ["DMNFT", "DM-C-0"],
    log: true,
  })
*/

/*
  console.log("Set Goldinar Minter *********************************"); 
  const gt = await ethers.getContract("Goldinar", deployer);
  const goldinarMinter = await gt.MINTER_ROLE();
  console.log("Setting Goldinar Minter Role:" + goldinarMinter); 
  await gt.grantRole(goldinarMinter, goldinarFarm.address);
  console.log("Setting Voting Goldinar Minter Role:"); 
  await gt.grantRole(goldinarMinter, voting.address);
  console.log("Setting Exchange Goldinar Minter Role:"); 
  await gt.grantRole(goldinarMinter, exchangeDM.address);

  console.log("Getting Minter"); 
  const minter = await ethers.getContract("DMMinter", deployer);
  console.log("Getting DataMarket"); 
  const dm = await ethers.getContract("DataMarket", deployer);
  console.log("Getting Exchange"); 
  const em = await ethers.getContract("ExchangeDM", deployer);
  console.log("Get Minter, DataMarket, Exchange"); 


  console.log("SetController *********************************"); 
  await dm.setController(deployer); 



  console.log("Adding memberShipCollection *********************************"); 
  await dm.collectionAdd(memberShipCollection.address); // 0
  console.log("Adding sponsorhipCollection *********************************"); 
  await dm.collectionAdd(sponsorhipCollection.address); // 1 should be 1 

  
  console.log("Adding allegianceCollection *********************************"); 
  await dm.collectionAdd(allegianceCollection.address); // 2
  console.log("Adding teamsCollection *********************************"); 
  await dm.collectionAdd(teamsCollection.address);      // 3

  console.log("Adding groupsCollection *********************************"); 
  await dm.collectionAdd(groupsCollection.address);     // 4
  
 
  console.log("Treasury DataMarket *********************************"); 
  await dm.setTreasury("0xa4E8433686D1A2ae7187D5a08d639d63Ba38A260"); // deployer
  console.log("Treasury Exchange *********************************"); 
  await em.setTreasury("0xa4E8433686D1A2ae7187D5a08d639d63Ba38A260"); // deployer

  console.log("Granting Exchange roles");   
  const roleReview = await em.REVIEWER_ROLE()
  await em.grantRole(roleReview, deployer)

  
  console.log("Setting minter");   
  await dm.setMinter(dmMinter.address);

  
  console.log("Define collection fee");   
  await dm.defineCollectionFee(1, 5000);  // sponsorship fee 5%


  console.log("Templates Membership");   
  ////////////////////////////// await dm.templatesInCollectionCreate(0, ["Patron","Mecene","Curator"], ["500000000000000000000","1000000000000000000000","5000000000000000000000"]); // membership
  await dm.templatesInCollectionCreate(0, ["Patron","Mecene","Curator"], ["10000000000000000","1000000000000000000","10000000000000000000"]); // membership
  console.log("Templates Sponsor");     
  await dm.templatesInCollectionCreate(1, ["Bronze","Silver","Gold"], ["1000000000000000000","10000000000000000000","100000000000000000000"] ); // sponsorship


  console.log("Templates Allegiance");     
  await dm.templatesInCollectionCreate(2, ["Developer","Artist","Manager","Publisher","Player"],[0,0,0,0,0]); // Allegiance // ,"Grunt"

  console.log("Templates Team");     
  await dm.templatesInCollectionCreate(3, ["Artisan Landscape","Research Cave","Innovators Den", "Game Devisers", "Digital Nation", "Space Che"], [0,0,0,0,0,0]); // Teams


  console.log("Templates Group");     
  await dm.templatesInCollectionCreate(4, ["Metier", "Evolve", "Trendsetter", "Fearless", "Nekkhamma"], [0,0,0,0,0]); // Groups

  console.log("Additional Team");
  await delay(waitTime);
  await dm.templatesInCollectionCreate(3, ["Party Warriors","Flag Wavers","Love Protectors", "Equality Advocates","Peace Champions", "Radical Decentral"], [0,0,0,0,0,0]); // Teams


  //*** NOT DEPLOYED
  console.log("Additional Groups");
  //await dm.templatesInCollectionCreate(4, ["Humanists","Technologists","Democratizers", "Traditionalists", "Industrialists", "Pluralists", "Paternalists", "Anarchists", "Revolutionists"],  [0,0,0,0,0,0,0,0,0]); // Groups

  // await delay(waitTime);
  // The most useful technology is the unwritten knowledge in people's heads, not intellectual property.                                          
  // define properties 
  console.log("Requirements 1");
  await minter.defineBalanceRequirements(2, 0, 0, 3);   // allegianceCollection requires memberShipCollection balanceof 1 and can have max 3 tokens


  console.log("Requirements 2");
  await minter.defineBalanceRequirements(3, 2, 1, 42);  // teamsCollection requires allegianceCollection balanceof 1 and max 42 tokens
  console.log("Requirements 3");
  await minter.defineBalanceRequirements(4, 3, 1, 42);  // groupsCollection requires teamsCollection balanceof 1  and max 42
  console.log("Uniqueness");
  await minter.defineUniqueRequirements(2, 1, false); // you can't have 2 tokens of same template (allegiance)
  console.log("Uniqueness 2");
  await minter.defineUniqueRequirements(3, 1, true); // you can't have 2 tokens of same template (team)
  console.log("Uniqueness 3");
  await minter.defineUniqueRequirements(4, 1, true); // you can't have 2 tokens of same template (group)
  console.log("params Membership");   
  await dm.setCollectionParams(0,true,1); // Membership not transferable, can have only one

  console.log("params Sponsorship");     
  await dm.setCollectionParams(1,true,0); // Sponsorship not transferable, infinite amount
  console.log("params Allegiance");     
  await dm.setCollectionParams(2,true,0); // Allegiance not transferable, finiteCount

  console.log("params Teams");     
  await dm.setCollectionParams(3,true,0); // Teams not transferable, finiteCount
  console.log("params Groups");     
  await dm.setCollectionParams(4,true,0); // Groups not transferable, finiteCount

  console.log("AvatarAbility Connections *********************************");  
  // called from avatar constructor  
  const avatarAbilityContract = await ethers.getContract("AvatarAbility", deployer);
  await avatarAbilityContract.setAvatarCollection(avatar.address);

  console.log("AvatarReputation Connections *********************************");  
  const avatarReputationContract = await ethers.getContract("AvatarReputation", deployer);
  await avatarReputationContract.setAvatarCollection(avatar.address);

  console.log("AvatarPlur Connections *********************************");  
  const avatarPlurContract = await ethers.getContract("AvatarPlur", deployer);
  await avatarPlurContract.setAvatarCollection(avatar.address);

  console.log("AvatarRelatable Connections *********************************");  
  const AvatarRelatableContract = await ethers.getContract("AvatarRelatable", deployer);
  await AvatarRelatableContract.setAvatarCollection(avatar.address);  


  
  console.log("avatar Collections *********************************");  
  await dm.collectionAdd(avatar.address);  
  console.log("avatarAbility Collections *********************************");  
  await dm.collectionAdd(avatarAbility.address);  
  console.log("avatarReputation Collections *********************************");  
  await dm.collectionAdd(avatarReputation.address);  
  console.log("avatarPlur Collections *********************************");  
  await dm.collectionAdd(avatarPlur.address);  
  console.log("avatarRelatable Collections *********************************");  
  await dm.collectionAdd(avatarRelatable.address);  

  
  // add apps 
  // quake https://bee-9.gateway.ethswarm.org/bzz/2e805e4c38566d8351ccc4b255552632bf15d389d62e59939c3d6082dfcc263f/ 
  // 

  
  await delay(waitTime);
  console.log("Collections Adding");     
  await dm.collectionAdd(nftCollection0.address);

  console.log("Collection 0 added", nftCollection0.address); 
  await dm.collectionAdd(nftCollection1.address);
*/  
  /*
  await dm.collectionAdd(nftCollection2.address);
  console.log("Collection 2 added", nftCollection2.address); */
/*  
  console.log("Graphable set"); 
  await dm.setGraphable(graphable.address); 

  console.log("Thats all"); 
*/

/*
  // this is old exchange
  console.log("Exchange *********************************"); 
  const exchange = await deploy('Exchange', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [dataMarket.address, 1], //     //args: [ "Hello", ethers.utils.parseEther("1.5") ],
    log: true,
  }) */
  
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
