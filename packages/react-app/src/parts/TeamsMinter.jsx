import { SendOutlined } from "@ant-design/icons";
import React, { Children, useCallback, useEffect, useState } from "react";
import { Select, Button, Card, Col, Input, List, Menu, Row } from "antd";
import { ethers, BigNumber } from "ethers";
import * as helpers from "./helpers";
import FText from "../components/FText";
import TemplateMintCreatable from "./TemplateMintCreatable";

export default function TeamsMinter(props) {
  const [contract, setContract] = useState();
  const [balance, setBalance] = useState(0);
  const { dmCollections, selectedCollection, localProvider, writeContracts, address, contractConfig, tx } = props;

  const updateContract = useCallback(async () => {
    if (dmCollections === undefined) return;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
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
  const updateBalance = useCallback(async () => {
    if (contract != null) {
      var newBalance = await helpers.makeCall("balanceOf", contract, [address]);
      if (newBalance != undefined) setBalance(newBalance.toNumber());
    }
  });

  useEffect(() => {
    //updateInfo();
  }, [contract]);

  useEffect(() => {
    updateContract();
  }, [selectedCollection]);

  //dmCollections[selectedCollection].nftBalance = useContractReader(readContracts, collectionName, "balanceOf", [address]);

  if (writeContracts == undefined) return null;
  if (writeContracts.DataMarket == undefined) return null;

  return (
    <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}>
      <div>
        <TemplateMintCreatable
          tx={tx}
          title={"Create Team"}
          address={address}
          selectedCollection={selectedCollection}
          onCreate={writeContracts.DataMarket.templatesMintCreatable}
        />

        <p style={{ textAlign: "left" }}>
          <FText>Requires Allegiance to join a Team.</FText>
          <FText>Others members can join teams.</FText>
          <FText>Anyone can create a Team.</FText>
          <FText>Teams might require members to be accepted.</FText>
          <FText>This registry is currated.</FText>
          <FText>
            You will NOT receive any <strong>&nbsp;DMT</strong>s.
          </FText>

          <br />
        </p>
      </div>
    </div>
  );
}
