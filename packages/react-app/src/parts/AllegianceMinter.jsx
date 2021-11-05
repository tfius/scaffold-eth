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
import { Select, Button, Card, Col, Input, List, Menu, Row } from "antd";
//const { ethers } = require("ethers");
import { ethers } from "ethers";

import SwarmLocationInput from "./SwarmLocationInput";

const makeCall = async (callName, contract, args, metadata = {}) => {
  if (contract[callName]) {
    let result;
    if (args) {
      result = await contract[callName](...args, metadata);
    } else {
      result = await contract[callName]();
    }
    return result;
  }
  return undefined;
  console.log("no call of that name!");
};
// deep find
function findPropertyInObject(propertyName, object) {
  if (object === undefined) return null;
  if (object.hasOwnProperty(propertyName)) return object[propertyName];

  for (var i = 0; i < Object.keys(object).length; i++) {
    if (typeof object[Object.keys(object)[i]] == "object") {
      var o = findPropertyInObject(propertyName, object[Object.keys(object)[i]]);
      if (o != null) return o;
    }
  }
  return null;
}

export default function AllegianceMinter(props) {
  const [visibleTransfer, setVisibleTransfer] = useState([]);
  const [metadataAddresses, setMetadataAddresses] = useState([]);
  const [locationAddresses, setLocationAddresses] = useState([]);
  const [yourNftBalance, setYourNftBalance] = useState([]);
  //const [collectionBalance, setCollectionBalance] = useState([]);
  //const [value, setValue] = useState(props.value);

  const {
    yourDmBalance,
    yourDmNftBalance,
    dmCollections,
    selectedCollection,
    localProvider,
    writeContracts,
    readContracts,
    mainnetProvider,
    address,
    setSelectedCollection,
    collectionInformation,
    contractConfig,
    userSigner,
    userProviderAndSigner,
    tx,
  } = props;

  const updateNFTBalance = useCallback(async () => {
    if (dmCollections === undefined) return;
  });

  /*
      var collectionName = selectedCollection == 0 ? "NFTCollection" : "NFTCollection" + selectedCollection;
      console.log("collectionName", collectionName);
      var nftBalance = useContractReader(readContracts, collectionName, "balanceOf", [address]);
      var yourNftBalance = nftBalance && nftBalance.toNumber && nftBalance.toNumber(); */
  //var yourNftBalance = 0;

  useEffect(() => {
    updateNFTBalance();
  }, [selectedCollection]);

  //dmCollections[selectedCollection].nftBalance = useContractReader(readContracts, collectionName, "balanceOf", [address]);

  return (
    <div>
      <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}>
        <h1>Choose Allegiance</h1>
        <List bordered>
          <List.Item key={"memb1"}>
            <Card>
              <h2>Developer</h2>
              Receive a Developer NFT <br />
              <hr />
              Coding skills
              {/* <ul><li>coding skills</li></ul> */}
            </Card>
            <Card>
              <h2>Artist</h2>
              Receive a Artist NFT <br />
              <hr />
              Artistic skills
              {/* <ul>
                    <li>music</li>
                    <li>images</li>
                    <li>animation</li>
                    <li>3D models</li>
                    <li>video</li>
                    <li>postproduction</li>
                </ul> */}
            </Card>
            <Card>
              <h2>Producer</h2>
              Receive a Producer NFT <br />
              <hr />
              Production skills
            </Card>
            <Card>
              <h2>Manager</h2>
              Receive a Manager NFT <br />
              <hr />
              Management skills
            </Card>
          </List.Item>
          Can be accumulated but are non-transferable.
        </List>

        <br />
        <p>
          Anyone can mint Allegiance. <br />
          You will NOT receive any <strong>DM</strong>s. <br />
          Required to use billboard, crafting, marketplace, quests and exchange.
          <br />
        </p>
      </div>
    </div>
  );
}
