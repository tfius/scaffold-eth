import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";

import { SendOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import { Button, Card, Input, notification, Progress, Spin, Tooltip } from "antd";
//const { ethers } = require("ethers");
import { ethers } from "ethers";

import * as helpers from "./helpers";
import FText from "../components/FText";
import DMTViewer from "./DMTViewer";
import DMTSimpleViewer from "./DMTSimpleViewer";
import AboutThisProject from "./AboutThisProject";

function NameProgress(props) {
  const { name, value } = props;
  return (
    <div style={{ display: "block", margin: "auto" }}>
      <small>{name}</small>
      <br />
      <Tooltip
        title={
          <>
            {name} {value}
          </>
        }
      >
        <div style={{ textAlign: "center", fontWeight: "bold" }}>{value}</div>
        {/* <Progress size="small" percent={value} status="active" showInfo={false} strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }} /> */}
      </Tooltip>
    </div>
  );
}
function ValueProgress(props) {
  const { name, value } = props;
  return (
    <div style={{ display: "block", textAlign: "center", margin: "auto" }}>
      <small>{name}</small>
      <br />
      {/* <small>{value}</small> */}
      <div style={{ textAlign: "center", fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

// this is needed for fairdrop to work
async function getPublicKey(signer) {
  // yarn ganache-cli -p 8545 -d
  //const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
  //const signer = provider.getSigner();
  const ethAddress = await signer.getAddress();
  const hash = await ethers.utils.keccak256(ethAddress);
  //
  const message = "Join Resistance";
  const sig = await signer.signMessage(message);
  const msgHash = ethers.utils.hashMessage(message);
  const msgHashBytes = ethers.utils.arrayify(msgHash);
  // Now you have the digest,
  const pk = ethers.utils.recoverPublicKey(msgHashBytes, sig);
  const addr = ethers.utils.recoverAddress(msgHashBytes, sig);
  console.log("Got PK", pk, addr);
  // recover address
  const recoveredAddress = ethers.utils.computeAddress(ethers.utils.arrayify(pk));
  // Throwing here
  if (recoveredAddress != ethAddress) {
    throw Error(`Address recovered do not match, original ${ethAddress} versus computed ${recoveredAddress}`);
    console.log("error", recoveredAddress, ethAddress);
  }
}

/*export default*/ function AbilityView(props) {
  const { ability } = props;
  if (ability == undefined || ability.p1 == undefined) return null;
  return (
    <Card>
      <div style={{ display: "flex", textAlign: "left" }}>
        <NameProgress name={"Training"} value={ability.p1.toNumber()} />
        <NameProgress name={"Charisma"} value={ability.p2.toNumber()} />
        <NameProgress name={"Constitution"} value={ability.p3.toNumber()} />
        <NameProgress name={"Dexterity"} value={ability.p4.toNumber()} />
        <NameProgress name={"Intelligence"} value={ability.p5.toNumber()} />
        <NameProgress name={"Strength"} value={ability.p6.toNumber()} />
        <NameProgress name={"Level"} value={ability.level.toNumber()} />
        <NameProgress name={"Skill Points"} value={ability.points.toNumber()} />
      </div>
    </Card>
  );
}
/*export default*/ function ReputationView(props) {
  const { reputation } = props;
  if (reputation == undefined || reputation.p1 == undefined) return null;
  return (
    <Card>
      <div style={{ display: "flex", textAlign: "left" }}>
        <NameProgress name={"Reputation"} value={reputation.p1.toNumber()} />
        <NameProgress name={"Visibility"} value={reputation.p2.toNumber()} />
        <NameProgress name={"Distinctiveness"} value={reputation.p3.toNumber()} />
        <NameProgress name={"Authenticity"} value={reputation.p4.toNumber()} />
        <NameProgress name={"Transparency"} value={reputation.p5.toNumber()} />
        <NameProgress name={"Consistency"} value={reputation.p6.toNumber()} />
        <NameProgress name={"Level"} value={reputation.level.toNumber()} />
        <NameProgress name={"Reputation Points"} value={reputation.points.toNumber()} />
      </div>
    </Card>
  );
}

/*export default*/ function PlurView(props) {
  const { plur } = props;
  if (plur == undefined || plur.p1 == undefined) return null;
  return (
    <Card>
      <div style={{ display: "flex", textAlign: "left" }}>
        {/* <NameProgress name={"Reputation"} value={drawbacks.reputation.toNumber()} /> */}
        <NameProgress name={"Peace"} value={plur.p1.toNumber()} />
        <NameProgress name={"Love"} value={plur.p2.toNumber()} />
        <NameProgress name={"Unity"} value={plur.p3.toNumber()} />
        <NameProgress name={"Respect"} value={plur.p4.toNumber()} />
        <NameProgress name={"Courage"} value={plur.p5.toNumber()} />
        <NameProgress name={"Justice"} value={plur.p6.toNumber()} />
        <NameProgress name={"Level"} value={plur.level.toNumber()} />
        <NameProgress name={"PLUR Points"} value={plur.points.toNumber()} />
      </div>
    </Card>
  );
}

/*export default*/ function RelatableView(props) {
  const { relatable } = props;
  if (relatable == undefined || relatable.p1 == undefined) return null;
  return (
    <Card>
      <div style={{ display: "flex", textAlign: "left" }}>
        {/* <NameProgress name={"Reputation"} value={drawbacks.reputation.toNumber()} /> */}
        <NameProgress name={"Privacy"} value={relatable.p1.toNumber()} />
        <NameProgress name={"Interoperability"} value={relatable.p2.toNumber()} />
        <NameProgress name={"Sovereignty"} value={relatable.p3.toNumber()} />
        <NameProgress name={"Force for good"} value={relatable.p4.toNumber()} />
        <NameProgress name={"Support"} value={relatable.p5.toNumber()} />
        <NameProgress name={"Symmetry"} value={relatable.p6.toNumber()} />
        <NameProgress name={"Level"} value={relatable.level.toNumber()} />
        <NameProgress name={"Data Points"} value={relatable.points.toNumber()} />
      </div>
    </Card>
  );
}

/*export default*/ function AvatarView(props) {
  const { avatar } = props;
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "left" }}>
        <ValueProgress name={"Experience"} value={avatar.experience.toNumber()} />
        <ValueProgress name={"Cost/h"} value={avatar.askCostPerH.toNumber()} />
        <ValueProgress name={"Journey"} value={avatar.journey.toNumber()} />
        <ValueProgress name={"Duration"} value={avatar.lastJourneyDuration.toNumber()} />
        <ValueProgress name={"Total Time"} value={avatar.totalTime.toNumber()} />
      </div>
    </Card>
  );
}
/*export default*/ function SponsorshipView(props) {
  const { sponsorship } = props;
  return (
    <>
      {sponsorship.length == 0 ? null : (
        <Card key="sm" title={"Sponsorships"}>
          {sponsorship}
        </Card>
      )}
    </>
  );
}
/*export default*/ function MembershipView(props) {
  const { membership } = props;
  return (
    <>
      {membership.length == 0 ? null : (
        <Card key="mm" title={"Membership"}>
          {membership}
        </Card>
      )}
    </>
  );
}
/*export default*/ function TeamsView(props) {
  const { teams } = props;
  return (
    <>
      {teams.length == 0 ? null : (
        <Card key="tm" title={"Teams"}>
          {teams}
        </Card>
      )}
    </>
  );
}
/*export default*/ function GroupsView(props) {
  const { groups } = props;
  return (
    <>
      {groups.length == 0 ? null : (
        <Card key="gm" title={"Groups"}>
          {groups}
        </Card>
      )}
    </>
  );
}
/*export default*/ function AllegianceView(props) {
  const { allegiance } = props;
  return (
    <>
      {allegiance.length == 0 ? null : (
        <Card key="am" title={"Allegiance"}>
          {allegiance}
        </Card>
      )}
    </>
  );
}

/*export default*/ function MintAvatar(props) {
  const [tokenName, setTokenName] = useState("");
  const { avatars, tx, writeContracts, avatarsLoaded } = props;
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {}, [tokenName]);

  if (avatarsLoaded == false || avatars.length != 0 || triggered == true) return <h1></h1>;

  return (
    <>
      Seems like you have no meta representation in Resistance. Create your avatar to start exploring.
      <div style={{ width: "100%" }}>
        <Input
          style={{ width: "80%" }}
          min={0}
          size="large"
          value={tokenName}
          placeholder="Enter Name"
          onChange={e => {
            try {
              setTokenName(e.target.value);
            } catch (e) {
              console.log(e);
            }
          }}
        />
        <Button
          style={{ width: "20%" }}
          type={"primary"}
          onClick={() => {
            if (tokenName.length > 2) {
              tx(writeContracts.Avatar.mintNewAvatar(tokenName, "0x" + helpers.randomString(64)));
              // getPublicKey(props.userProviderAndSigner.signer);
              setTriggered(true);
            }
            //console.log(props.userProviderAndSigner.signer);
          }}
        >
          Create Avatar
        </Button>
      </div>
    </>
  );
}
/*export default*/ function NameAvatar(props) {
  const [tokenName, setTokenName] = useState("");
  const { avatars, tx, writeContracts, avatarsLoaded } = props;
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {}, [tokenName]);

  if (avatars.length == 0 || triggered == true) return null;
  if (avatars[0].name.length > 0) return null;

  return (
    <>
      Would you like to give a name to your Avatar ?
      <div style={{ width: "100%" }}>
        <Input
          style={{ width: "80%" }}
          min={0}
          size="large"
          value={tokenName}
          placeholder="Enter Name"
          onChange={e => {
            try {
              setTokenName(e.target.value);
            } catch (e) {
              console.log(e);
            }
          }}
        />
        <Button
          style={{ width: "20%" }}
          type={"primary"}
          onClick={() => {
            if (tokenName.length > 2) {
              tx(writeContracts.Avatar.setName(tokenName));
              helpers.speak(tokenName);
              setTriggered(true);
            } else {
              notification.error({
                message: "Name",
                description: "Too short, please use at least 3 characters",
                placement: "topLeft",
              });
            }
          }}
        >
          Name Your Avatar
        </Button>
      </div>
    </>
  );
}

export default function YourHome(props) {
  const history = useHistory();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [sponsorship, setSponsorship] = useState([]);
  const [membership, setMembership] = useState([]);
  const [allegiance, setAllegiance] = useState([]);
  const [avatarTokens, setAvatarTokens] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [avatarsLoaded, setAvatarsLoaded] = useState();
  const [canMint, setCanMint] = useState();

  const {
    yourDmBalance,
    dmCollections,
    localProvider,
    writeContracts,
    readContracts,
    mainnetProvider,
    userProviderAndSigner,
    address,
    contractConfig,
    tx,
  } = props;

  function getDMTs(tokens, contract) {
    console.log("getDMTs", tokens, contract);
    const dmts = tokens.map((t, i) => {
      return <DMTViewer key={"tok" + i} token={t} contract={contract} address={address} />;
    });

    return dmts;
  }
  function getDMCollectionContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.DMCollection.abi, localProvider);
    return contract;
  }
  function getAvatarContract(contractIndex) {
    if (dmCollections === undefined) return null;
    //debugger;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.Avatar.abi, localProvider);
    return contract;
  }
 /*
  function getAvatarAbilityContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.AvatarAbility.abi, localProvider);
    return contract;
  }
  function getAvatarReputationContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.AvatarReputation.abi, localProvider);
    return contract;
  }
  function getAvatarPlurContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.AvatarPlur.abi, localProvider);
    return contract;
  }
  function getAvatarRelatableContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.AvatarRelatable.abi, localProvider);
    return contract;
  }
*/
  async function getTokens(contract, isAvatar) {
    if(contract===null || address===undefined)
    {
      console.log("getTokens", contract, address);
      return [];
    }

    var tokens = [];
    var balance = await helpers.makeCall("balanceOf", contract, [address]);
    if (balance != undefined) balance = balance.toNumber();

    if (balance >= 0) {
      for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
        try {
          const tokenId = await helpers.makeCall("tokenOfOwnerByIndex", contract, [address, tokenIndex]);
          var tokenInfo = await helpers.makeCall("tokenData", contract, [tokenId.toNumber()]);
          var tokenUri = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
          try {
            var data = JSON.parse(tokenInfo);
            data.id = tokenId.toString();
            data.tokenUri = tokenUri;
            data.name = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");
            data.uri = tokenUri; //ethers.utils.toUtf8String(tokenUri).replace(/[^\x01-\x7F]/g, "");;
            tokens.push(data);
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return tokens;
  }
  async function getAvatars(contract, isAvatar) {
    var tokens = [];
    
    if(contract===null || address===undefined)
    {
      console.log("getAvatars", contract, address);
      return;
    }

    setAvatarsLoaded(false);
    try {
      
      var balance = await helpers.makeCall("balanceOf", contract, [address]);
      if (balance != undefined) balance = balance.toNumber();

      var isMint = await readContracts.Avatar.canMint();
      // var isMint = await readContracts.Avatar.canUserMint(address);
      console.log("isMint", isMint);

      setCanMint(isMint);
    } catch (e) {
      console.log(e);
    }

    if (balance >= 0) {
      for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
        try {
          var tokenId = await helpers.makeCall("tokenOfOwnerByIndex", contract, [address, tokenIndex]);
          var tokenInfo = await helpers.makeCall("tokenData", contract, [tokenId.toNumber()]);
          var tokenUri = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
          var avatarInfo = await helpers.makeCall("getAvatarInfo", contract, [tokenId.toNumber()]);
          //console.log("avatar", tokenId.toNumber(), avatarInfo, tokenInfo);
          try {
            var token = {};
            token.name = avatarInfo.name;
            token.avatar = avatarInfo;
            token.uri = tokenUri;
            // console.log("avatar uri", token.uri);
            // console.log("avatarInfo", avatarInfo);
            token.ability = await readContracts.AvatarAbility.getInfo(avatarInfo.skillId.toNumber()) 
            token.reputation = await readContracts.AvatarReputation.getInfo(avatarInfo.reputationId.toNumber());
            token.plur = await readContracts.AvatarPlur.getInfo(avatarInfo.plurId.toNumber());
            token.relatable = await readContracts.AvatarRelatable.getInfo(avatarInfo.relatableId.toNumber());
            //var data = JSON.parse(tokenInfo);
            //data.id = tokenId.toString();
            //data.name = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");
            tokens.push(token);
            //console.log("avatar", tokenId.toNumber(), token);
          } catch (e) {
            console.log(e);
            //var token = {name:tokenIndex, uri: tokenInfo};
            //tokens.push(token);
          }
        } catch (e) {
          console.log(e);
        }
      }
      //console.log("avatarTokens", tokens);
      setAvatarTokens(tokens);
      setAvatarsLoaded(true);
      return tokens;
    }
    
    return [];
  }

  async function tokensFromContract(contractIdx) {
    var contract = getDMCollectionContract(contractIdx);
    var tokens = await getTokens(contract);
    return { contract, tokens };
  }
  const fetchAvatar = useCallback(async () => {
    var avatarcontract = getAvatarContract(5);
    var avatartokens = await getAvatars(avatarcontract);
    if(avatartokens===undefined) return; 
    const avs = avatartokens.map((t, i) => {
      return (
        <div key={"tok" + i}>
          {/* <Card onClick={e => viewToken(t)} className="posParent"> */}
          <div style={{ fontSize: "5vmin", textAlign: "center" }}>
            <div style={{ background: "black" }}>
              <img src={t.uri} style={{ maxWidth: "30%" }} className="avatar" />
            </div>
            <div>
              <span style={{ fontSize: "5vmin", textAlign: "center" }}>{t.name}</span>
            </div>
          </div>
          {/* </Card> */}

          <div>
            {/* <div
              style={{
                position: "absolute",
                zIndex: "-1",
                top: "0px",
                left: "0px",
                right: "0px",
                nottom: "0px",
                opacity: "0.91"
              }}
            >
              <img src={t.uri} style={{ maxWidth: "100%", maxHeight: "100%" }} />
            </div> */}

            <AvatarView avatar={t.avatar} />
            <AbilityView ability={t.ability} onClick={e => viewToken(t)} />
            <ReputationView reputation={t.reputation} onClick={e => viewToken(t)} />
            <PlurView plur={t.plur} onClick={e => viewToken(t)} />
            <RelatableView relatable={t.relatable} onClick={e => viewToken(t)} />
          </div>
        </div>
      );
    });
    setAvatars(avs); //getDMTs(av, cav));
  }, []);

  const fetchAll = useCallback(async () => {
    await fetchAvatar();

    /*
    let member = await tokensFromContract(0);
    const mes = member.tokens.map((t, i) => {
      //return <span onClick={e => viewToken(t)}>{t.name}</span>;
      return (
        <DMTSimpleViewer
          key={"mtok" + i}
          token={t}
          contract={member.contract}
          address={address}
          onClick={e => viewToken(t)}
          readContracts={readContracts}
          writeContracts={writeContracts}
          tx={tx}
        />
      );
    });
    setMembership(mes);
*/
    let alliance = await tokensFromContract(2);
    const als = alliance.tokens.map((t, i) => {
      //return <span onClick={e => viewToken(t)}>{t.name} </span>;
      return (
        <DMTSimpleViewer
          key={"atok" + i}
          token={t}
          contract={alliance.contract}
          address={address}
          onClick={e => viewToken(t)}
          readContracts={readContracts}
          writeContracts={writeContracts}
          tx={tx}
          onClickRedirect={e => {
            //viewToken(t);
            console.log("allegiance", t);
            history.push("/edittoken/" + alliance.contract.address + "/" + t.id);
          }}
        />
      );
    });
    setAllegiance(als); //getDMTs(al, cal));

    let team = await tokensFromContract(3);
    const tes = team.tokens.map((t, i) => {
      //return <span onClick={e => viewToken(t)}>{t.name} </span>;
      return (
        <div>
          <DMTSimpleViewer
            key={"ttok" + i}
            token={t}
            link={"/team/"}
            contract={team.contract}
            address={address}
            readContracts={readContracts}
            writeContracts={writeContracts}
            tx={tx}
            onClickRedirect={e => {
              //viewToken(t);
              console.log("team", t);
              history.push("/edittoken/" + team.contract.address + "/" + t.id);
            }}
          />
        </div>
      );
    });
    setTeams(tes); //getDMTs(te, cte));
/*
    let group = await tokensFromContract(4);
    const grs = group.tokens.map((t, i) => {
      //return <span onClick={e => viewToken(t)}>{t.name} </span>;
      return (
        <DMTSimpleViewer
          key={"gtok" + i}
          token={t}
          contract={group.contract}
          address={address}
          onClick={e => viewToken(t)}
          readContracts={readContracts}
          writeContracts={writeContracts}
          tx={tx}
        />
      );
    });
    setGroups(grs); //getDMTs(gr, cgr));

    let sponsor = await tokensFromContract(1);
    const sps = sponsor.tokens.map((t, i) => {
      return (
        <DMTSimpleViewer
          key={"stok" + i}
          token={t}
          contract={sponsor.contract}
          address={address}
          onClick={e => viewToken(t)}
          readContracts={readContracts}
          writeContracts={writeContracts}
          tx={tx}
        />
      );
    });
    setSponsorship(sps); //getDMTs(sp, csp));
    */
  }, []);

  //useEffect(() => {}, [membership, groups, teams, allegiance, sponsorship, avatars, canMint]);

  const balance = yourDmBalance == undefined ? "0" : yourDmBalance;

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 60000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  useEffect(() => {
    //console.log("Your Home Seconds", avatarsLoaded);
    // if(readContracts!=undefined)
    //   fetchAvatar();
    if(!avatarsLoaded)
        fetchAll();
    else 
        fetchAvatar();

  }, [seconds]);

  useEffect(() => {
    //console.log("Write Contracts", avatarsLoaded);
    if(!avatarsLoaded && writeContracts!=undefined && readContracts!=undefined && address!=undefined) 
        fetchAll();

  }, [writeContracts]);


  function viewToken(token) {
    console.log("viewAvatars", token);
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "auto",
        marginTop: 16,
        paddingBottom: 16,
        alignItems: "left",
        textAlign: "left",
      }}
    >
      <NameAvatar
        avatars={avatarTokens}
        avatarsLoaded={avatarsLoaded}
        contract={getAvatarContract(5)}
        tx={tx}
        writeContracts={writeContracts}
        userProviderAndSigner={userProviderAndSigner}
      />
      {avatars} 
      <div style={{ textAlign: "center" }}>
        {/* Claim your Experience points <br/> */}
        {avatarsLoaded && 
        <Button
          type="primary"
          disabled={!canMint}
          onClick={e => {
            setCanMint(false);

            tx(writeContracts.Avatar.mint());
            // helpers.speak("Claim experience");
            /*notification.success({
                    message: "Claim",
                    description: "Claiming Experience",
                    placement: "topLeft",
                  });*/
          }}
        >
          Claim Experience
        </Button>
  }
        <br />
      </div>
      {/* <MintAvatar
        avatars={avatars}
        avatarsLoaded={avatarsLoaded}
        contract={getAvatarContract(5)}
        tx={tx}
        writeContracts={writeContracts}
        userProviderAndSigner={userProviderAndSigner}
      /> */}
      <AllegianceView allegiance={allegiance} />
      <TeamsView teams={teams} />
      <GroupsView groups={groups} />
      <MembershipView membership={membership} />
      <SponsorshipView sponsorship={sponsorship} />
      {/* {sponsorship} */}
      {/* <SponsorshipView sponsorship={sponsorship} /> */}
      <br />
      <AboutThisProject />
    </div>
  );
}
