import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button } from "antd";
import * as helpers from "../helpers";
import { uploadJsonToBee } from "../SwarmUpload/BeeService";
import * as tokens from "./tokenDrop";
//import * as eligableTokens from "../../../public/eligableTokens";
// to you for the WAM DAO. Here you go; robert 0xd71fAC9368aC952f8B4cC0C090351d723b453Dfd
const to_be_added = [
  { addr: "0xd54899dC38724b2388C051Cd345E16ea65D02F20", name: "Racin", url: "https://github.com/r0qs/beezim" },
];

/*
 Construct json like: 
   nftData = {
     description: "",
     "external_url": "",
     "image": "",
     "name": "",
     "attributes": [
       { 
         "trait_type": "BackgroundColor", 
         "value": "Some color" 
        },
     ]
   }
 */

const delay = ms => new Promise(res => setTimeout(res, ms));

export default function AvatarNftMint(props) {
  const history = useHistory();
  const [eligible, setEligible] = useState([]); // eligibleTokens
  const [data, setData] = useState([]); // actual data for each token
  const [receivers, setReceivers] = useState([]);
  const [update, setUpdate] = useState(0);
  const { writeContracts, readContracts, tx } = props;

  /*
  function getNumTokens = (async () => {
    console.log("avatar contract", readContracts.Avatar);
    
    for (let i = 0; i < tokenDrop.length; i++) {
        try{
        tokenDrop[i].balance = (await readContracts.Avatar.balanceOf(tokenDrop[i].addr)).toString();
        await delay(1000);
        console.log(i, tokenDrop[i].balance);
        } catch(e) {
            console.error("getting balance", tokenDrop[i].addr, i);
        }
    }
  });*/
  var stopRetrival = false;

  // gets existing avatars and transforms it into WAM Spring 20222 avatars (prepares all the data etc)
  const fetchAll = useCallback(async () => {
    if (readContracts.Avatar == undefined) return;

    var tokens = [];
    var tokensData = [];
    var totalXP = 0;
    var totalLevel = 0; //(times claimed)
    const allTokens = await readContracts.Avatar.totalSupply();
    console.log("Getting egligaible tokens", allTokens.toNumber());
    for (let tokenIndex = 0; tokenIndex < allTokens; tokenIndex++) {
      try {
        var token = await getAvatarInfo(tokenIndex);
        if (token === null) continue;
        tokens.push(token);
        totalXP += token.xp;
        //totalLevel+=token.data.avatar.abilities.level.toNumber();

        tokens = tokens.sort((a, b) => b.xp - a.xp);
        setEligible(tokens);
        for (var i = 0; i < tokens.length; i++) {
          tokensData.push(tokens[i].data);
        }
      } catch (e) {
        console.log("Error getting token", tokenIndex, e);
      }
    }

    tokens = tokens.sort((a, b) => b.xp - a.xp);
    setEligible(tokens);
    setData(tokensData);

    console.log("Eligible tokens", tokens.length, tokens, "totalXP", totalXP, "totalLevel", totalLevel);
    console.log("Tokens Data", tokensData.length, tokensData);
  }, [readContracts]);

  async function getAvatarInfo(tokenId) {
    var avatarInfo = await readContracts.Avatar.getAvatarInfo(tokenId);
    const xp = avatarInfo.experience.toNumber();
    if (xp === 0 && avatarInfo.name === "") {
      //console.log("not valid for drop", tokenId);
      return null;
    }

    var owner = await readContracts.Avatar.ownerOf(tokenId);

    //console.log(""+tokenId, avatarInfo);
    var token = {};
    token.name = avatarInfo.name;
    // token.avatar = avatarInfo;
    token.xp = xp;
    token.id = tokenId;
    //token.uri = avatar;
    var ability = await readContracts.AvatarAbility.getInfo(avatarInfo.skillId.toNumber());
    var reputation = await readContracts.AvatarReputation.getInfo(avatarInfo.reputationId.toNumber());
    var plur = await readContracts.AvatarPlur.getInfo(avatarInfo.plurId.toNumber());
    var relatable = await readContracts.AvatarRelatable.getInfo(avatarInfo.relatableId.toNumber());

    var imagePath = avatarInfo.swarmLocation.substring(2);

    var data = {
      description: "WeAreMillions Spring 2022 Hackathon",
      external_url: "https://resistance.fairdatasociety.org/viewNftAvatar/" + owner + "/" + tokenId,
      image: "https://gateway.fairdatasociety.org/bzz/" + imagePath + "/",
      name: avatarInfo.name,
      //metadataHash: "",
      attributes: [],
      //properties: []
      /*  { 
          "trait_type": "BackgroundColor", 
          "value": "Some color" 
         },
      ] */
    };

    data.attributes.push({ trait_type: "Experience", value: avatarInfo.experience.toNumber(), max_value: 1165 });

    data.attributes.push({ display_type: "number", trait_type: "Training", value: ability.p1.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Charisma", value: ability.p2.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Constitution", value: ability.p3.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Dexterity", value: ability.p4.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Intelligence", value: ability.p5.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Strength", value: ability.p6.toNumber() });

    data.attributes.push({ display_type: "boost_number", trait_type: "Honor", value: reputation.p1.toNumber() });
    data.attributes.push({ display_type: "boost_number", trait_type: "Visibility", value: reputation.p2.toNumber() });
    data.attributes.push({
      display_type: "boost_number",
      trait_type: "Distinctiveness",
      value: reputation.p3.toNumber(),
    });
    data.attributes.push({ display_type: "boost_number", trait_type: "Authenticity", value: reputation.p4.toNumber() });
    data.attributes.push({ display_type: "boost_number", trait_type: "Transparency", value: reputation.p5.toNumber() });
    data.attributes.push({ display_type: "boost_number", trait_type: "Consistency", value: reputation.p6.toNumber() });

    data.attributes.push({ display_type: "number", trait_type: "Peace", value: plur.p1.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Love", value: plur.p2.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Unity", value: plur.p3.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Respect", value: plur.p4.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Courage", value: plur.p5.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Justice", value: plur.p6.toNumber() });

    data.attributes.push({ display_type: "number", trait_type: "Privacy", value: relatable.p1.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Interoperability", value: relatable.p2.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Sovereignty", value: relatable.p3.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Force for good", value: relatable.p4.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Support", value: relatable.p5.toNumber() });
    data.attributes.push({ display_type: "number", trait_type: "Symmetry", value: relatable.p6.toNumber() });

    data.attributes.push({
      display_type: "boost_percentage",
      trait_type: "Relatable",
      value: ((relatable.level.toNumber() / 39) * 100).toFixed(0),
    }); //, "max_value": 39});
    data.attributes.push({
      display_type: "boost_percentage",
      trait_type: "PLUR",
      value: ((plur.level.toNumber() / 39) * 100).toFixed(0),
    }); //, "max_value": 39 });
    data.attributes.push({
      display_type: "boost_percentage",
      trait_type: "Reputation",
      value: ((reputation.level.toNumber() / 39) * 100).toFixed(0),
    }); //, "max_value": 39 });
    data.attributes.push({
      display_type: "boost_percentage",
      trait_type: "Ability",
      value: ((ability.level.toNumber() / 39) * 100).toFixed(0),
    }); //, "max_value": 39 });

    // "display_type":"boost_percentage",
    data.attributes.push({ trait_type: "Relatable Points", value: relatable.points.toNumber(), max_value: 231990 });
    data.attributes.push({ trait_type: "PLUR Points", value: plur.points.toNumber(), max_value: 778897 });
    data.attributes.push({ trait_type: "Reputation Points", value: reputation.points.toNumber(), max_value: 212540 });
    data.attributes.push({ trait_type: "Ability Points", value: ability.points.toNumber(), max_value: 291828 });

    /*
        "trait_type": "level", 
        "trait_type": "level", 
        "trait_type": "level", 
        "trait_type": "level", 
        "trait_type": "points",
        "trait_type": "points",
        "trait_type": "points",
        "trait_type": "points",    
    */

    //data.properties.push({"type": "string", "description": "WAM 2022 Spring" });

    //data.attributes.push({"trait_type": "Origin Id", "value": tokenId} );
    //data.attributes.push({"trait_type": "Original", "value": owner} );

    /*data.attributes.push({
      "display_type": "date", 
      "trait_type": "birthday", 
      "value": Date.now()
    })*/

    // upload
    token.data = data; // data goes to swarm
    token.owner = owner;

    /*
    data.avatar = {};
    data.avatar.info = avatarInfo;
    data.avatar.abilities = ability;
    data.avatar.reputation = reputation;
    data.avatar.plur = plur;
    data.avatar.relatable = relatable; */

    var hash = await uploadJsonToBee(data, "wam-avatar-" + tokenId + ".json");
    token.metadataHash = hash; //<- you this is how you mint this token

    console.log(tokenId, token);
    return token;
  }

  // console.log(receivers);
  async function getBalance(i) {
    /*try{
        if(tokenDrop[i].addr.includes("Batch")) return;

        tokenDrop[i].balance = (await readContracts.Avatar.balanceOf(tokenDrop[i].addr)).toString();
        console.log(i, tokenDrop[i].balance);

        setReceivers(tokenDrop);
    } catch(e) {
        console.error("getting balance", tokenDrop[i].addr, i);
    }*/
  }
  async function drop(r, i) {
    try {
      eligible[i].state = "Queued";
      console.log("tx" + r.owner + "=> " + "0x" + r.metadataHash);

      tx(writeContracts.WAMSpring2022.create(r.owner, "0x" + r.metadataHash), update => {
        console.log("tx", update);
        if (update?.error?.toString()) {
          eligible[i].status = update?.error?.toString();
          helpers.speak("FAIL");
          setUpdate(update+1);
          eligible[i].state = "FAIL ";
        }
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update);
          eligible[i].status = "OK";
          eligible[i].state = "";
          helpers.speak("OK");
          setUpdate(update+1);
        }
      });
    } catch (e) {
      console.error(e);
      eligible[i].status = "ERROR";
      setUpdate(update+1);
    }
    setReceivers(tokens.tokenDrop);
    return 0;
  }

  async function getData() {
    if (eligible.length != 0) return;
    const res = await fetch("eligableTokens.json");
    const data = await res.json();
    console.log("got eligable tokens", data);
    setEligible(data);
  }

  useEffect(() => {
    setReceivers(tokens.tokenDrop);
    //fetchAll();
  }, []);

  useEffect(() => {
    getData();
  }, [receivers]);
  useEffect(() => {
    //getData();
  }, [update]);
  useEffect(
    () => () => {
      console.log("unmount");
      stopRetrival = true;
    },
    [],
  );

  return (
    <div
      style={{
        maxWidth: 1050,
        margin: "auto",
        marginTop: 16,
        paddingBottom: 16,
        alignItems: "left",
        textAlign: "left",
      }}
    >
      <h1>Eligible Avatar NFT</h1>
      <Button onClick={() => this.fetchAll()}>Fetch All</Button> 

      {eligible.map((t, i) => (
        <div style={{ lineHeight: "1.5rem" }} key={"parent_" + i}>
          <span onClick={e => {
              setUpdate(update+1);
            }}>
            {i}
            {"> "}
          </span>{" "}

          {t.state}&emsp;

          <strong
            onClick={e => {
              drop(t, i);
              setUpdate(update+1);
            }}
          >
            '{t.name}'
          </strong>
          &emsp;XP:{t.xp}&emsp;#{t.id}&emsp;
          <strong>{t.status}</strong>
          {t.status !== "OK" ? (
          <small>
            {/* <br />{" "} */}
            {t.owner} {" => "} {t.metadataHash}
          </small>) : null}
          {t.minted ? <strong> MINTED </strong> : <span></span>}
          <br />
        </div>
      ))}
      {receivers.map((p, i) => (
        <div style={{ lineHeight: "1.5rem" }} key={"parent_" + i}>
          {i % 6 == 0 && <br />}
          <span
            onClick={e => {
              getBalance(i);
            }}
          >
            {i.toString()}
          </span>
          :{" "}
          <span
            onClick={e => {
              drop(p, i);
            }}
          >
            <strong>{p.addr}</strong> {p.state}{" "}
          </span>{" "}
          <span>{p.balance}</span>{" "}
          <span style={{ fontSize: "0.5rem", width: "100px", overflow: "hidden", textOverflow: "ellipsis" }}>
            {" "}
            {p.status}{" "}
          </span>
        </div>
      ))}
      <div></div>
    </div>
  );
}
