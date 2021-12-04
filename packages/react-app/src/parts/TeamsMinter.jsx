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
import { ethers } from "ethers";
import * as helpers from "./helpers";
import SwarmLocationInput from "./SwarmLocationInput";

export default function TeamsMinter(props) {
  const [tokenName, setTokenName] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [collectionSymbol, setCollectionSymbol] = useState("");
  const [contract, setContract] = useState();
  const [balance, setBalance] = useState(0);

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

  const updateContract = useCallback(async () => {
    if (dmCollections === undefined) return;
    const contracts = helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const dmCollectionContract = new ethers.Contract(
      dmCollections[selectedCollection],
      contracts.DMCollection.abi,
      localProvider,
    );

    if (dmCollectionContract != null) {
      setContract(dmCollectionContract);
      var newBalance = await helpers.makeCall("balanceOf", dmCollectionContract, [address]);
      if (newBalance != undefined) setBalance(newBalance.toNumber());
    }
  });
  const updateInfo = useCallback(async () => {
    if (contract != null) {
      var name = await helpers.makeCall("name", contract);
      var symbol = await helpers.makeCall("symbol", contract);
      setCollectionName(name);
      setCollectionSymbol(symbol);
    }
  });
  const updateBalance = useCallback(async () => {
    if (contract != null) {
      var newBalance = await helpers.makeCall("balanceOf", contract, [address]);
      if (newBalance != undefined) setBalance(newBalance.toNumber());
    }
  });

  useEffect(() => {
    updateInfo();
  }, [contract]);

  useEffect(() => {
    // updateBalance();
  }, [balance]);

  useEffect(() => {
    updateContract();
  }, [selectedCollection]);

  //dmCollections[selectedCollection].nftBalance = useContractReader(readContracts, collectionName, "balanceOf", [address]);

  return (
    <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}>
      <div>
        <Input
          style={{ width: "80%" }}
          min={0}
          size="large"
          value={tokenName}
          placeholder="Enter Team Name"
          onChange={e => {
            try {
              setTokenName(e.target.value);
            } catch (e) {
              console.log(e);
            }
          }}
        />

        <Button
          type={"primary"}
          onClick={() => {
            /* tx(writeContracts.DataMarket.approve(readContracts.GoldinarFarm.address, stakeAmount));*/ 
          }}
        >
          Create
        </Button>

        <p>
          Requires Allegiance to join or create a Team. <br />
          Others members can join teams. <br />
          Teams might require members to be accepted. <br />
          This registry is currated. <br />
          You will NOT receive any <strong>DM</strong>s. <br />
          <br />
        </p>
      </div>
      {/* <List bordered>
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
        </List> */}
    </div>
  );
}
