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

import * as helpers from "./helpers";
import DMTViewer from "./DMTViewer";

import SwarmLocationInput from "./SwarmLocationInput";
import FileUpload from "./SwarmUpload/FileUpload";

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
  const [metadataAddress, setMetadataAddress] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  const [collectionName, setCollectionName] = useState([]);
  const [collectionSymbol, setCollectionSymbol] = useState([]);

  const [yourTokenBalance, setYourTokenBalance] = useState([]);
  const [yourTokens, setYourTokens] = useState([]);
  const [mimeType, setMimeType] = useState();
  const [filename, setFilename] = useState();
  const [canCreate, setCanCreate] = useState(false);
  const [error, setError] = useState("");

  const [contract, setContract] = useState([]);

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
    tx,
  } = props;

  const updateContract = useCallback(async () => {
    setMetadataAddress("0x0000000000000000000000000000000000000000000000000000000000000000");

    if (dmCollections === undefined) return;
    const contracts = findPropertyInObject("contracts", contractConfig.deployedContracts);
    const dmCollectionContract = new ethers.Contract(
      dmCollections[selectedCollection],
      contracts.DMCollection.abi,
      localProvider,
    );

    if (dmCollectionContract != null) {
      var name = await makeCall("name", dmCollectionContract);
      var symbol = await makeCall("symbol", dmCollectionContract);
      setCollectionName(name);
      setCollectionSymbol(symbol);
      setContract(dmCollectionContract);
    }
  });

  const updateNFTBalance = useCallback(async () => {
    if (contract != null) {
      var newBalance = await makeCall("balanceOf", contract, [address]);
      if (newBalance != undefined) setYourTokenBalance(newBalance.toNumber());
    }
  });
  const updateTokens = useCallback(async () => {
    if (contract != null) {
      if (yourTokenBalance >= 0) {
        var nfts = [];
        for (let tokenIndex = 0; tokenIndex < yourTokenBalance; tokenIndex++) {
          try {
            const tokenId = await helpers.makeCall("tokenOfOwnerByIndex", contract, [address, tokenIndex]);
            var tokenInfo = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
            try {
              var data = JSON.parse(tokenInfo);
              data.id = tokenId.toString();
              data.name = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");
              nfts.push(data);
            } catch (e) {
              console.log(e);
            }
          } catch (e) {
            console.log(e);
          }
        }
        setYourTokens(nfts);
      }
    }
  });

  useEffect(() => {
    updateContract();
  }, [selectedCollection]);

  useEffect(() => {
    updateNFTBalance();
  }, [contract]);

  useEffect(() => {
    updateTokens();
  }, [yourTokenBalance]);

  useEffect(() => {}, [locationAddress]);

  useEffect(() => {}, [mimeType, filename, canCreate, error]);

  const toks = yourTokens.map((t, i) => {
    return <DMTViewer key={"tok" + i} token={t} contract={contract} address={address} />; //<Card>{<h2>{t.name}</h2>}</Card>;
  });

  const balance = yourDmBalance == undefined ? "0" : yourDmBalance;

  return (
    <div>
      Balance: <strong> {ethers.utils.formatEther(balance)} DM</strong> <br />
      <strong>{yourTokenBalance}</strong> Tokens in {collectionName} ({collectionSymbol})
      {/* : <strong>{yourDmNftBalance}</strong> */}
      <div style={{ maxWidth: 820, margin: "auto", marginTop: 16, paddingBottom: 16 }}>
        <Card>
          {/* <List
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
          ></List> */}
          <div style={{ borderRadius: "10px" }} className="ant-card-body">
            {filename} {mimeType}
            <FileUpload
              onDataUpload={setLocationAddress}
              onMimeType={setMimeType}
              onFilename={setFilename}
              onCanCreate={setCanCreate}
              onError={setError}
            />
            <span style={{ color: "red" }}> {error} </span>
            <Button
              type={"primary"}
              hidden={canCreate.toString()}
              onClick={() => {
                //debugger;
                tx(
                  writeContracts.DataMarket.createDataToken(
                    selectedCollection,
                    address,
                    0,
                    metadataAddress,
                    locationAddress, //
                  ),
                );
              }}
            >
              Create
            </Button>
          </div>
        </Card>
      </div>
      <div style={{ width: "80%", margin: "auto" }}>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <Card>
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
            value={metadataAddress}
            onChange={newValue => {
              setMetadataAddress(newValue);
            }}
          />
          <SwarmLocationInput
            ensProvider={mainnetProvider}
            placeholder="data location"
            value={locationAddress}
            onChange={newValue => {
              setLocationAddress(newValue);
            }}
          />
        </Card>
      </div>
      <div style={{ width: "80%", margin: "auto" }}>{yourTokenBalance > 0 ? <>{toks} </> : null}</div>
      {/* <div style={{ maxWidth: 820, margin: "auto", marginTop: 5, paddingBottom: 5, lineHeight: 1.2 }}>
        <Card>
          <h2>{collectionInformation.name}</h2>
          {collectionInformation.description} <br />
          <span style={{ fontSize: 10, marginRight: 8 }}>
            {collectionInformation.data} <br />
          </span>
          <span style={{ fontSize: 10, marginRight: 8 }}>{collectionInformation.creator}</span>
          <br />
        </Card>
      </div> */}
    </div>
  );
}
