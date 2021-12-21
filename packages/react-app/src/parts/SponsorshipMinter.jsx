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
import FText  from "../components/FText";

import SwarmLocationInput from "./SwarmLocationInput";

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
    var collectionName = selectedCollection == 0 ? "DMCollection" : "DMCollection" + selectedCollection;
    console.log("collectionName", collectionName);
    var nftBalance = useContractReader(readContracts, collectionName, "balanceOf", [address]);
    var yourNftBalance = nftBalance && nftBalance.toNumber && nftBalance.toNumber(); */
  //var yourNftBalance = 0;

  useEffect(() => {
    updateNFTBalance();
  }, [selectedCollection]);

  //dmCollections[selectedCollection].nftBalance = useContractReader(readContracts, collectionName, "balanceOf", [address]);

  return (
      <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}>
        {/* Balance: <strong>{yourDmBalance} DM</strong> <br /> */}
        <p>
          <FText>Become sponsor and donate. </FText>
          <FText>5% of your sponsorship will go to treasury and rest you will receive <strong>&nbsp;DM</strong>s.</FText>
          <FText>In meantime your funds can be used as flash loans by other members. </FText>
          <FText>You can liquidate your <strong>&nbsp;DM</strong>s</FText>
          <br />
        </p>
        {/* <List bordered>
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
        </List> */}
      </div>
  );
}
