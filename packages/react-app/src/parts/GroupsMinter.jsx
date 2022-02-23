import React, { useCallback, useEffect, useState } from "react";
import { ethers, BigNumber } from "ethers";
import * as helpers from "./helpers";
import FText from "../components/FText";
import TemplateMintCreatable from "./TemplateMintCreatable";

export default function GroupsMinter(props) {
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

  useEffect(() => {}, [contract]);

  useEffect(() => {
    updateContract();
  }, [selectedCollection]);

  if (writeContracts == undefined) return null;
  if (writeContracts.DataMarket == undefined) return null;

  return (
    <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.5 }}>
      <TemplateMintCreatable
        tx={tx}
        title={"Create Group"}
        address={address}
        selectedCollection={selectedCollection}
        onCreate={writeContracts.DataMarket.templatesMintCreatable}
      />

      {/* <Input
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
          tx(writeContracts.DataMarket.templatesMintCreatable(address, selectedCollection, tokenName, tokenPrice));
        }}
      >
        Create Group
      </Button>

      <Input
        style={{ width: "80%" }}
        min={0}
        size="large"
        value={tokenPrice}
        onChange={e => {
          try {
            setTokenPrice(BigNumber.from(e.target.value));
          } catch (e) {
            console.log(e);
          }
        }}
      />  */}

      <p>
        <FText>Requires a Team to join a Group.</FText>
        <FText>Only members can join groups.</FText>
        <FText>Anyone can create a Group.</FText>
        <FText>Groups might require members to be accepted.</FText>
        <FText>This registry is currated. </FText>
        <FText>
          You will NOT receive any <strong>&nbsp;DM</strong>s.{" "}
        </FText>
      </p>
    </div>
  );
}
