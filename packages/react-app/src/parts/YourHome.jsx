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

import { Link } from "react-dom";
import { Select, Button, Card, Col, Input, List, Menu, Row, Progress, Spin } from "antd";
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
      <Progress size="small" percent={value} status="active" strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }} />
    </div>
  );
}
function ValueProgress(props) {
  const { name, value } = props;
  return (
    <div style={{ display: "block", textAlign: "center", margin: "auto" }}>
      <small>{name}</small>
      <br />
      <small>{value}</small>
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
  return (
    <Card>
      <div style={{ display: "flex", textAlign: "left" }}>
        <NameProgress name={"Experience"} value={ability.charisma.toNumber()} />
        <NameProgress name={"Charisma"} value={ability.charisma.toNumber()} />
        <NameProgress name={"Constitution"} value={ability.constitution.toNumber()} />
        <NameProgress name={"Dexterity"} value={ability.dexterity.toNumber()} />
        <NameProgress name={"Intelligence"} value={ability.intelligence.toNumber()} />
        <NameProgress name={"Strength"} value={ability.strength.toNumber()} />
        <NameProgress name={"Wisdom"} value={ability.wisdom.toNumber()} />
        <NameProgress name={"Skill Points"} value={ability.points.toNumber()} />
      </div>
    </Card>
  );
}
/*export default*/ function ReputationView(props) {
  const { reputation } = props;
  return (
    <Card>
      <div style={{ display: "flex", textAlign: "left" }}>
        <NameProgress name={"Reputation"} value={reputation.reputation.toNumber()} />
        <NameProgress name={"Visibility"} value={reputation.visibility.toNumber()} />
        <NameProgress name={"Distinctiveness"} value={reputation.distinctiveness.toNumber()} />
        <NameProgress name={"Authenticity"} value={reputation.authenticity.toNumber()} />
        <NameProgress name={"Transparency"} value={reputation.transparency.toNumber()} />
        <NameProgress name={"Consistency"} value={reputation.consistency.toNumber()} />
        <NameProgress name={"Vision"} value={reputation.vision.toNumber()} />
        <NameProgress name={"Reputation Points"} value={reputation.points.toNumber()} />
      </div>
    </Card>
  );
}

/*export default*/ function DrawbacksView(props) {
  const { drawbacks } = props;
  return (
    <Card>
      <div style={{ display: "flex", textAlign: "left" }}>
        {/* <NameProgress name={"Reputation"} value={drawbacks.reputation.toNumber()} /> */}
        <NameProgress name={"Proficiency"} value={drawbacks.proficiency.toNumber()} />
        <NameProgress name={"Encumbrance"} value={drawbacks.encumbrance.toNumber()} />
        <NameProgress name={"Constraint"} value={drawbacks.constraint.toNumber()} />
        <NameProgress name={"Obstruction"} value={drawbacks.obstruction.toNumber()} />
        <NameProgress name={"Strain"} value={drawbacks.strain.toNumber()} />
        <NameProgress name={"Pressure"} value={drawbacks.pressure.toNumber()} />
        <NameProgress name={"Drawback"} value={drawbacks.drawback.toNumber()} />
        <NameProgress name={"Drawback Points"} value={drawbacks.points.toNumber()} />
      </div>
    </Card>
  );
}

/*export default*/ function RelatableView(props) {
  const { relatable } = props;
  return (
    <Card>
      <div style={{ display: "flex", textAlign: "left" }}>
        {/* <NameProgress name={"Reputation"} value={drawbacks.reputation.toNumber()} /> */}
        <NameProgress name={"Identity"} value={relatable.identity.toNumber()} />
        <NameProgress name={"Fear"} value={relatable.fear.toNumber()} />
        <NameProgress name={"Desire"} value={relatable.desire.toNumber()} />
        <NameProgress name={"Grief"} value={relatable.grief.toNumber()} />
        <NameProgress name={"Love"} value={relatable.love.toNumber()} />
        <NameProgress name={"Loss"} value={relatable.loss.toNumber()} />
        <NameProgress name={"Humanity"} value={relatable.humanity.toNumber()} />
        <NameProgress name={"Relatable Points"} value={relatable.points.toNumber()} />
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
  return <>{sponsorship.length == 0 ? null : <Card title={"Sponsorships"}>{sponsorship}</Card>}</>;
}
/*export default*/ function MembershipView(props) {
  const { membership } = props;
  return <>{membership.length == 0 ? null : <Card title={"Membership"}>{membership}</Card>}</>;
}
/*export default*/ function TeamsView(props) {
  const { teams } = props;
  return <>{teams.length == 0 ? null : <Card title={"Teams"}>{teams}</Card>}</>;
}
/*export default*/ function GroupsView(props) {
  const { groups } = props;
  return <>{groups.length == 0 ? null : <Card title={"Groups"}>{groups}</Card>}</>;
}
/*export default*/ function AllegianceView(props) {
  const { allegiance } = props;
  return <>{allegiance.length == 0 ? null : <Card title={"Allegiance"}>{allegiance}</Card>}</>;
}

/*export default*/ function MintAvatar(props) {
  const [tokenName, setTokenName] = useState("");
  const { avatars, tx, writeContracts, avatarsLoaded } = props;
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {}, [tokenName]);
  // console.log("mintAvatar", avatars, avatarsLoaded);
   
  if (avatarsLoaded == false || avatars.length != 0 || triggered == true) return <h1></h1>;
  //return <>{avatars.length == 0 ? "Create Explorer" : { avatars }}</>;
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
              getPublicKey(props.userProviderAndSigner.signer);
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

export default function YourHome(props) {
  const history = useHistory();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [sponsorship, setSponsorship] = useState([]);
  const [membership, setMembership] = useState([]);
  const [allegiance, setAllegiance] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [avatarsLoaded, setAvatarsLoaded] = useState();

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
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.Avatar.abi, localProvider);
    return contract;
  }
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
  function getAvatarDrawbackContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.AvatarDrawbacks.abi, localProvider);
    return contract;
  }
  function getAvatarRelatableContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.AvatarRelatable.abi, localProvider);
    return contract;
  }

  async function getTokens(contract, isAvatar) {
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

    setAvatarsLoaded(false);
    try {
      var balance = await helpers.makeCall("balanceOf", contract, [address]);
      if (balance != undefined) balance = balance.toNumber();
    } catch (e) {
      console.log(e);
    }

    if (balance >= 0) {
      for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
        try {
          var tokenId = await helpers.makeCall("tokenOfOwnerByIndex", contract, [address, tokenIndex]);
          var tokenInfo = await helpers.makeCall("tokenData", contract, [tokenId.toNumber()]);
          var tokenUri = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
          //debugger;
          var avatarInfo = await helpers.makeCall("getAvatarInfo", contract, [tokenId.toNumber()]);
          //console.log("avatar", tokenId.toNumber(), avatarInfo, tokenInfo);
          try {
            var token = {};
            token.name = avatarInfo.name;
            token.avatar = avatarInfo;
            token.uri = tokenUri;

            var abilityContract = getAvatarAbilityContract(6);
            token.ability = await helpers.makeCall("getInfo", abilityContract, [avatarInfo.skillId.toNumber()]);

            var reputationContract = getAvatarReputationContract(7);
            token.reputation = await helpers.makeCall("getInfo", reputationContract, [
              avatarInfo.reputationId.toNumber(),
            ]);
            //debugger;
            var drawbacksContract = getAvatarDrawbackContract(8);
            token.drawbacks = await helpers.makeCall("getInfo", drawbacksContract, [avatarInfo.drawbacksId.toNumber()]);
            //debugger;

            var relatableContract = getAvatarRelatableContract(9);
            token.relatable = await helpers.makeCall("getInfo", relatableContract, [avatarInfo.relatableId.toNumber()]);

            //var data = JSON.parse(tokenInfo);
            //data.id = tokenId.toString();
            //data.name = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");
            tokens.push(token);
            console.log("avatar", tokenId.toNumber(), token);
          } catch (e) {
            console.log(e);
            //var token = {name:tokenIndex, uri: tokenInfo};
            //tokens.push(token);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    setAvatarsLoaded(true);
    return tokens;
  }

  async function tokensFromContract(contractIdx) {
    var contract = getDMCollectionContract(contractIdx);
    var tokens = await getTokens(contract);
    return { contract, tokens };
  }
  const fetchAvatar = useCallback(async () => {
    var avatarcontract = getAvatarContract(5);
    var avatartokens = await getAvatars(avatarcontract);
    const avs = avatartokens.map((t, i) => {
      return (
        <div key={"tok" + i}>
          {/* <Card onClick={e => viewToken(t)} className="posParent"> */}
          <span style={{ fontSize: "5vmin" }}>{t.name}</span>
          {/* </Card> */}
          <AvatarView avatar={t.avatar} />
          <AbilityView ability={t.ability} onClick={e => viewToken(t)} />
          <ReputationView reputation={t.reputation} onClick={e => viewToken(t)} />
          <DrawbacksView drawbacks={t.drawbacks} onClick={e => viewToken(t)} />
          <RelatableView relatable={t.relatable} onClick={e => viewToken(t)} />
        </div>
      );
    });
    setAvatars(avs); //getDMTs(av, cav));
  }, []);

  useEffect(() => {
    if (dmCollections === undefined) return;
    fetch();
  }, []);

  const fetch = useCallback(async () => {
    await fetchAvatar();

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
            onClickRedirect={(e) => {
              //viewToken(t);
              console.log("team", t);
              history.push("/team/" + t.id);
            }}
            readContracts={readContracts}
            writeContracts={writeContracts}
            tx={tx}            
          />
        </div>
      );
    });
    setTeams(tes); //getDMTs(te, cte));

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
  }, []);

  useEffect(() => {
    if (dmCollections === undefined) return;
    fetch();
  }, []);

  useEffect(() => {}, [membership, groups, teams, allegiance, sponsorship, avatars]);

  const balance = yourDmBalance == undefined ? "0" : yourDmBalance;

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 15000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  useEffect(() => {
    console.log("Your Home Seconds");
    fetchAvatar();
  }, [seconds]);

  function viewToken(token) {
    console.log("viewAvatars", token);
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "auto",
        marginTop: 16,
        paddingBottom: 16,
        alignItems: "left",
        textAlign: "left",
      }}
    >
      Balance: <strong> {ethers.utils.formatEther(balance)} DMTs</strong> <br />
      {avatars} <br />
      <MintAvatar
        avatars={avatars}
        avatarsLoaded={avatarsLoaded}
        contract={getAvatarContract(5)}
        tx={tx}
        writeContracts={writeContracts}
        userProviderAndSigner={userProviderAndSigner}
      />
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
