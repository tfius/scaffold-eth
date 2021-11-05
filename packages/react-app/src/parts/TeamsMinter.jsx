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

export default function TeamsMinter(props) {
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
        <h1>Join or Create A Team</h1>
        <List bordered>
          <List.Item key={"memb1"}>
            <Card bordered>
              <h2>Artisans Landscape</h2>
              <hr />
              Public<br/>
              27 members <br/>
              Fair Data Society
            </Card>
            <Card>
              <h2>Research Cave</h2>
              <hr />
              Currated<br/>
              8 members <br/>
              Fair Data Society
            </Card>
            <Card>
              <h2>Innovators Den</h2>
              <hr />
              Public<br/>
              10 members <br/>
              Fair Data Society
            </Card>
            <Card>
              <h2>Game Devisers</h2>
              <hr />
              Public<br/>
              8 members <br/>
              Fair Data Society
            </Card>
          </List.Item>
          Can be accumulated but are non-transferable.
        </List>

        <br />
        <p>
          Any one can create a Team. <br />
          Others members can join teams. <br />
          Teams might require members to be accepted. <br />
          This registry is currated. <br />
          You will NOT receive any <strong>DM</strong>s. <br />
          <br />
        </p>
      </div>
    </div>
  );
}
