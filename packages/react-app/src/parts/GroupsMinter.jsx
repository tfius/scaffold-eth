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

export default function GroupsMinter(props) {
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

   useEffect(() => {
    updateNFTBalance();
  }, [selectedCollection]);

 
  return (
      <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}>
        <p>
          Requires a Team to join or create a Group. <br />
          Only members can join groups. <br />
          Teams might require members to be accepted. <br />
          This registry is currated. <br />
          You will NOT receive any <strong>DM</strong>s. <br />
        </p>
        {/* <List bordered>
          <List.Item key={"memb1"}>
            <Card bordered>
              <h2>Metier</h2>
              <hr />
              Public
              <br />
              27 members <br />
              Fair Data Society
            </Card>
            <Card>
              <h2>Evolve</h2>
              <hr />
              Currated
              <br />
              8 members <br />
              Fair Data Society
            </Card>
            <Card>
              <h2>Trendsetter</h2>
              <hr />
              Public
              <br />
              10 members <br />
              Fair Data Society
            </Card>
            <Card>
              <h2>Fearless</h2>
              <hr />
              Public
              <br />
              8 members <br />
              Fair Data Society
            </Card>
          </List.Item>
          Can be accumulated but are non-transferable.
        </List> */}
      </div>
  );
}
