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
        <div>
          <FText>Become sponsor and donate. </FText>
          <FText>5% of your sponsorship will go to treasury and rest you will receive <strong>&nbsp;DMT</strong>s.</FText>
          <FText>In meantime your funds can be used as flash loans by other members. </FText>
          <FText>You can liquidate your <strong>&nbsp;DMT</strong>s</FText>
          <br />
        </div>
      </div>
  );
}
