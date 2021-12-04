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
import { Link } from "react-dom";
import { Select, Button, Card, Col, Input, List, Menu, Row, Progress } from "antd";
//const { ethers } = require("ethers");
import { ethers } from "ethers";

import * as helpers from "./helpers";
import DMTViewer from "./DMTViewer";

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
        <NameProgress name={"Skillpoints"} value={ability.skillpoints.toNumber()} />
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
    return <Card>{sponsorship}</Card>;
  }
/*export default*/ function MembershipView(props) {
    const { membership } = props;
    return <Card>{membership}</Card>;
  }
/*export default*/ function TeamsView(props) {
  const { teams } = props;
  return <Card>{teams}</Card>;
}
/*export default*/ function GroupsView(props) {
  const { groups } = props;
  return <Card>{groups}</Card>;
}
/*export default*/ function AllegianceView(props) {
  const { allegiance } = props;
  return <Card>{allegiance}</Card>;
}

export default function YourHome(props) {
  const [sponsorship, setSponsorship] = useState(null);
  const [membership, setMembership] = useState(null);
  const [allegiance, setAllegiance] = useState(null);
  const [avatars, setAvatars] = useState(null);
  const [teams, setTeams] = useState(null);
  const [groups, setGroups] = useState(null);

  const {
    yourDmBalance,
    dmCollections,
    localProvider,
    writeContracts,
    readContracts,
    mainnetProvider,
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
    const contracts = helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.DMCollection.abi, localProvider);
    return contract;
  }
  function getAvatarContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.Avatar.abi, localProvider);
    return contract;
  }
  function getAvatarAbilityContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const contract = new ethers.Contract(dmCollections[contractIndex], contracts.AvatarAbility.abi, localProvider);
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
          var tokenInfo = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
          try {
            var data = JSON.parse(tokenInfo);
            data.id = tokenId.toString();
            data.name = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");
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
    var balance = await helpers.makeCall("balanceOf", contract, [address]);
    if (balance != undefined) balance = balance.toNumber();

    if (balance >= 0) {
      for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
        try {
          const tokenId = await helpers.makeCall("tokenOfOwnerByIndex", contract, [address, tokenIndex]);
          var tokenInfo = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
          //debugger;
          var avatarInfo = await helpers.makeCall("getAvatarInfo", contract, [tokenId.toNumber()]);
          console.log("avatar", tokenId.toNumber(), avatarInfo, tokenInfo);
          try {
            var token = {};
            token.name = avatarInfo.name;
            token.avatar = avatarInfo;

            var abilityContract = getAvatarAbilityContract(6);
            token.ability = await helpers.makeCall("getAbility", abilityContract, [avatarInfo.skillId.toNumber()]);

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
    return tokens;
  }

  async function tokensFromContract(contractIdx) {
    var contract = getDMCollectionContract(contractIdx);
    var tokens = await getTokens(contract);
    return { contract, tokens };
  }

  const fetch = useCallback(async () => {
    //let avatar = await tokensFromContract(5, true);
    var avatarcontract = getAvatarContract(5);
    var avatartokens = await getAvatars(avatarcontract);
    const avs = avatartokens.map((t, i) => {
      return (
        <>
          {/* <Card onClick={e => viewToken(t)} className="posParent"> */}
              <span style={{ fontSize: "5vmin" }}>{t.name}</span>
          {/* </Card> */}
          <AvatarView avatar={t.avatar} />
          <AbilityView ability={t.ability} onClick={e => viewToken(t)} />
        </>
      );
    });
    setAvatars(avs); //getDMTs(av, cav));

    let sponsor = await tokensFromContract(1);
    const sps = sponsor.tokens.map((t, i) => {
      return <DMTViewer key={"tok" + i} token={t} contract={sponsor.contract} address={address} />;
    });
    setSponsorship(sps); //getDMTs(sp, csp));

    let member = await tokensFromContract(0);
    const mes = member.tokens.map((t, i) => {
      return <span>{t.name}</span>;
    });
    setMembership(mes);

    let alliance = await tokensFromContract(2);
    const als = alliance.tokens.map((t, i) => {
      return <span onClick={e => viewToken(t)}>{t.name} </span>;
    });
    setAllegiance(als); //getDMTs(al, cal));

    let team = await tokensFromContract(3);
    const tes = team.tokens.map((t, i) => {
      return <span onClick={e => viewToken(t)}>{t.name} </span>;
    });
    setTeams(tes); //getDMTs(te, cte));

    let group = await tokensFromContract(4);
    const grs = group.tokens.map((t, i) => {
      return <span onClick={e => viewToken(t)}>{t.name} </span>;
    });
    setGroups(grs); //getDMTs(gr, cgr));
  }, []);

  useEffect(() => {
    if (dmCollections === undefined) return;
    fetch();
  }, []);

  useEffect(() => {}, [membership, groups, teams, allegiance, sponsorship, avatars]);

  const balance = yourDmBalance == undefined ? "0" : yourDmBalance;

  function viewToken(token) {
    console.log("viewAvatars", token);
  }

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "auto",
        marginTop: 16,
        paddingBottom: 16,
        alignItems: "left",
        textAlign: "left",
      }}
    >
      Balance: <strong> {ethers.utils.formatEther(balance)} DM</strong> <br />
      {avatars} <br />

      <MembershipView membership={membership} />
      <AllegianceView allegiance={allegiance} />
      <TeamsView teams={teams} />
      <GroupsView groups={groups} />

      {sponsorship}
      {/* <SponsorshipView sponsorship={sponsorship} /> */}

    </div>
  );
}
