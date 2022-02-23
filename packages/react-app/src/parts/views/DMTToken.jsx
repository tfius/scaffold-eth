import React, { useCallback, useEffect, useState } from "react";
import { Card, Spin } from "antd";
import { ethers } from "ethers";
import * as helpers from "./../helpers";

export default function DMTToken(props) {
  const [loading, setLoading] = useState(true);
  const [ contract, setContract] = useState(true);
  const { contractAddress, tokenId, deployedContracts, userSigner } = props;

  const fromContractContract = useCallback(async () => {
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", deployedContracts);
    const contract = new ethers.Contract(contractAddress, contracts.DMCollection.abi, userSigner);

    if (contract != null) {
      try {
        var tokenInfo = await helpers.makeCall("tokenData", contract, [tokenId.toNumber()]);
        var tokenUri = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
        console.log("DMTToken", tokenInfo, tokenUri);
      } catch (e) {
        console.log(e);
      }
    }
  });

  useEffect(() => {
    getTokenData();
  }, []);
  useEffect(() => {}, [loading]);

  const getTokenData = useCallback(async e => {
    //console.log("fbx load", e);
    setLoading(true);
    //setLoading(false);
    fromContractContract();
    setLoading(false);
  });

  return (
    <Card>
      {loading ? <Spin/> : <>{tokenId.toString()}</>}
    </Card>
  );
}
