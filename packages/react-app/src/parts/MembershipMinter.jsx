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

const { utils, BigNumber } = require("ethers");

import SwarmLocationInput from "./SwarmLocationInput";
import { debuggerStatement } from "@babel/types";
import * as helpers from "./helpers";
import DMTViewer from "./DMTViewer";

/*
function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
  uint8 i = 0;
  while(i < 32 && _bytes32[i] != 0) {
      i++;
  }
  bytes memory bytesArray = new bytes(i);
  for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
      bytesArray[i] = _bytes32[i];
  }
  return string(bytesArray);
}*/

export default function MembershipMinter(props) {
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
        Become a Member. <br />
        0.05% of your Membership will go to treasury and rest you will receive <strong>DM</strong>s. <br />
        In meantime your funds can be used as flash loans by other members. <br />
        You can liquidate your <strong>DM</strong>s anytime and keep Membership.
        Only members can join groups. <br />
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
