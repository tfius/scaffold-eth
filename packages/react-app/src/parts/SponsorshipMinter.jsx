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

export default function SponsorshipMinter(props) {
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
        {/* Balance: <strong>{yourDmBalance} DM</strong> <br /> */}
        <h1>Society Sponsorship</h1>
        <List bordered>
          <List.Item key={"memb2"}>
            <Card>
              <h2>Bronze</h2>
              Participant committing 1 ETH will receive a Bronze sponsorship class NFT <br />
              <hr />
              <span>NFT and DMs</span>
              <ul>
                <br />
                <br />
              </ul>
            </Card>
            <Card>
              <h2>Silver</h2>
              Participant committing 5 ETH will receive a Silver sponsorship class NFT <br />
              <hr />
              <span> NFT and DMs</span>
              <ul>
                <br />
                <br />
              </ul>
            </Card>
            <Card>
              <h2>Gold</h2>
              Participant committing 10 ETH will receive a Gold sponsorship class NFT
              <br />
              <hr />
              <span>NFT and DMs</span>
              <ul>
                <br />
                <br />
              </ul>
            </Card>
          </List.Item>
          Can be accumulated and are non-transferable.
        </List>

        <br/>
        <p>
          Become sponsor and donate. <br/>
          0.05% of your sponsorship will go to treasury and rest you will receive <strong>DM</strong>s. <br/>
          In meantime your funds can be used as flash loans by other members. <br/>
          You can liquidate your <strong>DM</strong>s back to investment anytime. <br/>
        </p>

      </div>
    </div>
  );
}
