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

export default function DataMinter(props) {
  const [visibleTransfer, setVisibleTransfer] = useState([]);
  const [metadataAddresses, setMetadataAddresses] = useState([]);
  const [locationAddresses, setLocationAddresses] = useState([]);

  const [yourNftBalance, setYourNftBalance] = useState([]);
  const [collectionName, setCollectionName] = useState([]);
  const [collectionSymbol, setCollectionSymbol] = useState([]);
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

    ///debugger;
    const contracts = findPropertyInObject("contracts", contractConfig.deployedContracts);
    const dmCollectionContract = new ethers.Contract(
      dmCollections[selectedCollection],
      contracts.DMCollection.abi,
      localProvider,
    );

    if (dmCollectionContract != null) {
      var newBalance = await makeCall("balanceOf", dmCollectionContract, [address]);
      if (newBalance != undefined) setYourNftBalance(newBalance.toNumber());
      //yourNftBalance = await dmCollectionContract["balanceOf"](address);
      console.log(newBalance);

      var name = await makeCall("name", dmCollectionContract);
      var symbol = await makeCall("symbol", dmCollectionContract);

      setCollectionName(name);
      setCollectionSymbol(symbol);
    }
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
    <div>
      <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.2 }}>
        Balance: <strong> {ethers.utils.formatEther(yourDmBalance)} DM</strong> - Avatars:{" "}
        <strong>{yourDmNftBalance}</strong>
        <Card>
          <h2>{collectionInformation.name}</h2>
          {collectionInformation.description} <br />
          <span style={{ fontSize: 10, marginRight: 8 }}>
            {collectionInformation.data} <br />
          </span>
          <span style={{ fontSize: 10, marginRight: 8 }}>{collectionInformation.creator}</span>
          <br />
        </Card>
        <strong>{yourNftBalance}</strong> Tokens in {collectionName} ({collectionSymbol}):
      </div>

      <div style={{ maxWidth: 820, margin: "auto", marginTop: 16, paddingBottom: 16 }}>
        <Card>
          <List
            bordered
            dataSource={dmCollections}
            renderItem={(item, index) => {
              return (
                <div style={{ fontSize: 5, marginRight: 8 }}>
                  {index}:{item}
                </div>
              );
              console.log("Collections (TODO) metadata collect", item);
            }}
          ></List>
          <Select
            showSearch
            value={selectedCollection}
            onChange={value => {
              console.log(`selected ${value}`);
              setSelectedCollection(value);
            }}
          >
            {dmCollections
              ? dmCollections.map((collection, index) => (
                  <Select.Option key={collection} value={index}>
                    {index}: {collection}
                  </Select.Option>
                ))
              : null}
          </Select>
          <SwarmLocationInput
            ensProvider={mainnetProvider}
            placeholder="metadata location"
            value={metadataAddresses[0]}
            onChange={newValue => {
              const update = {};
              update[0] = newValue;
              setMetadataAddresses({ ...metadataAddresses, ...update });
            }}
          />
          <SwarmLocationInput
            ensProvider={mainnetProvider}
            placeholder="data location"
            value={locationAddresses[0]}
            onChange={newValue => {
              const update = {};
              update[0] = newValue;
              setLocationAddresses({ ...locationAddresses, ...update });
            }}
          />
          <Button
            type={"primary"}
            onClick={() => {
              //debugger;
              tx(
                writeContracts.DataMarket.createDataToken(
                  selectedCollection,
                  address,
                  0,
                  metadataAddresses[0],
                  locationAddresses[0], //
                ),
              );
            }}
          >
            Create
          </Button>
        </Card>
      </div>
    </div>
  );
}
