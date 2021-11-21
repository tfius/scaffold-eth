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

export default function DMTViewer(props) {
  const [loading, setLoading] = useState(true);

  const {
    contract,
    token,
    selectedCollection,
    writeContracts,
    readContracts,
    address,
    contractConfig,
    gasPrice,
    tx,
    title,
  } = props;

  const retrieveNFTData = useCallback(async () => {
    setLoading(true);
    if (contract != null) {
      var name = await helpers.makeCall("name", contract);
      var links = await helpers.makeCall("getLinks", contract, [token.id]);
      console.log(token.name + " links", links);

      if(links.length>0)
      {
        var parentLinks = await helpers.makeCall("getLinks", contract, [links[0].tokenId]);
        console.log(token.name + " parents ", parentLinks);
      }

      //var newBalance = await helpers.makeCall("balanceOf", contract, [address]);
      //if (newBalance != undefined) setYourTokenBalance(newBalance.toNumber());
    }

    //console.log(token);
    setLoading(false);
  });

  useEffect(() => {
    retrieveNFTData();
  }, [contract]);

  /*
    const mintFromTemplate = useCallback(async nftTemplateIndex => {
      var metadata = {};
      var cost = await helpers.makeCall("tokenAmount", contract, [nftTemplateIndex]);
      console.log("cost", cost);
  
      metadata.value = cost; //BigNumber.from('5000000000000000000000');
      metadata.gasPrice = gasPrice;
      tx(writeContracts.DataMarket.templatesMintFrom(address, selectedCollection, nftTemplateIndex, metadata));
    });*/

  if (loading === true) return <h1>Please wait...</h1>;

  return (
    <Card>
      <h2>{token.name}</h2>
    </Card>
  );
}
