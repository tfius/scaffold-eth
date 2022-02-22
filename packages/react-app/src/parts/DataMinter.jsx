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
import { Select, Button, Card, Spin, Col, Input, List, Menu, Row } from "antd";
//const { ethers } = require("ethers");
import { ethers } from "ethers";

import * as helpers from "./helpers";
import DMTViewer from "./DMTViewer";

import SwarmLocationInput from "./SwarmLocationInput";
import FileUpload from "./SwarmUpload/FileUpload";

const metadataTypes = [
  { name: "Unknown", metadata: "0x0000000000000000000000000000000000000000000000000000000000000000" }, //0
  { name: "Audio", metadata: "0x0000000000000000000000000000000000000000000000000000000000000001" }, // 1
  { name: "Image", metadata: "0x0000000000000000000000000000000000000000000000000000000000000002" }, // 2
  { name: "Video", metadata: "0x0000000000000000000000000000000000000000000000000000000000000003" }, // 3
  { name: "3D Model", metadata: "0x0000000000000000000000000000000000000000000000000000000000000004" }, // 4
  { name: "Animation", metadata: "0x0000000000000000000000000000000000000000000000000000000000000004" }, // 5
  { name: "Source Code", metadata: "0x0000000000000000000000000000000000000000000000000000000000000005" }, // 6
  { name: "Docs", metadata: "0x0000000000000000000000000000000000000000000000000000000000000006" }, // 7
  { name: "Sheets", metadata: "0x0000000000000000000000000000000000000000000000000000000000000007" }, // 8
  { name: "Slides", metadata: "0x0000000000000000000000000000000000000000000000000000000000000008" }, // 9
  { name: "Forms", metadata: "0x0000000000000000000000000000000000000000000000000000000000000009" }, // 10
  { name: "PDF", metadata: "0x0000000000000000000000000000000000000000000000000000000000000010" }, // 11
  { name: "Calendar", metadata: "0x0000000000000000000000000000000000000000000000000000000000000011" }, // 12
  { name: "CSV", metadata: "0x0000000000000000000000000000000000000000000000000000000000000012" }, // 13
  { name: "VCard", metadata: "0x0000000000000000000000000000000000000000000000000000000000000013" }, // 14
  { name: "JSON", metadata: "0x0000000000000000000000000000000000000000000000000000000000000014" }, // 15
  { name: "Text", metadata: "0x0000000000000000000000000000000000000000000000000000000000000015" }, // 16
];

export default function DataMinter(props) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [visibleTransfer, setVisibleTransfer] = useState([]);
  const [metadataAddress, setMetadataAddress] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  const [collectionName, setCollectionName] = useState([]);
  const [collectionSymbol, setCollectionSymbol] = useState([]);

  const [yourTokenBalance, setYourTokenBalance] = useState([]);
  const [yourTokens, setYourTokens] = useState([]);
  const [mimeType, setMimeType] = useState();
  const [mimeHash, setMimeHash] = useState();
  const [filename, setFilename] = useState();
  const [filesize, setFilesize] = useState(0);
  const [canCreate, setCanCreate] = useState(true); // todo refactor name
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState("");

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

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 10000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  const updateContract = useCallback(async () => {
    setMetadataAddress("0x0000000000000000000000000000000000000000000000000000000000000000");

    if (dmCollections === undefined) return;
    const contracts = helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const dmCollectionContract = new ethers.Contract(
      dmCollections[selectedCollection],
      contracts.DMCollection.abi,
      localProvider,
    );

    if (dmCollectionContract != null) {
      try {
        var name = await helpers.makeCall("name", dmCollectionContract);
        var symbol = await helpers.makeCall("symbol", dmCollectionContract);
        setCollectionName(name);
        setCollectionSymbol(symbol);
        setContract(dmCollectionContract);
      } catch (e) {
        console.log(e);
      }
    }
  });

  const updateNFTBalance = useCallback(async () => {
    if (contract != null) {
      try {
        var newBalance = await helpers.makeCall("balanceOf", contract, [address]);
        if (newBalance != undefined) setYourTokenBalance(newBalance.toNumber());
      } catch (e) {
        console.log(e);
      }
    }
  });
  const updateTokens = useCallback(async () => {
    if (contract != null) {
      if (yourTokenBalance >= 0) {
        var nfts = [];
        for (let tokenIndex = yourTokens.length; tokenIndex < yourTokenBalance; tokenIndex++) {
          try {
            const tokenId = await helpers.makeCall("tokenOfOwnerByIndex", contract, [address, tokenIndex]);
            var tokenInfo = await helpers.makeCall("tokenData", contract, [tokenId.toNumber()]);
            var tokenUri = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
            try {
              var data = JSON.parse(tokenInfo);
              data.id = tokenId.toString();
              data.tokenUri = tokenUri;
              data.name = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");

              nfts.push(data);
              console.log(data);
            } catch (e) {
              console.log(e);
            }
          } catch (e) {
            console.log(e);
          }
        }
        console.log(yourTokens, nfts);

        if (yourTokens.length == 0) setYourTokens(nfts);
        else setYourTokens([...yourTokens, ...nfts]);
      }
    }
  });

  useEffect(() => {
    updateContract();
    setYourTokens([]);
  }, [selectedCollection]);

  useEffect(() => {
    updateNFTBalance();
  }, [contract]);

  useEffect(() => {
    updateTokens();
  }, [yourTokenBalance]);

  useEffect(() => {}, [locationAddress]);

  useEffect(() => {}, [mimeHash, mimeType, filename, canCreate, error, metadataAddress]);

  useEffect(() => {
    updateNFTBalance();
  }, [seconds]);

  const gridStyle = {
    width: "25%",
    textAlign: "center",
  };

  var toks = yourTokens.map((t, i) => {
    return <DMTViewer key={"tok" + i} token={t} contract={contract} address={address} />;
  });

  var tokList = <div>{toks}</div>;

  const balance = yourDmBalance == undefined ? "0" : yourDmBalance;

  const onSetMimeType = useCallback(mime => {
    var mimebytes = ethers.utils.toUtf8Bytes(mime);
    var mimehash = ethers.utils.keccak256(mimebytes);
    console.log("mimehash", mime, mimebytes, mimehash);

    setMimeHash(mimehash);
    setMimeType(mime);

    var valType = 0; //var mime = new TextDecoder().decode(mimes);

    if (typeof mime === "string" || mime instanceof String) {
      if (mime.includes("audio") == true) valType = 1;
      else if (mime.includes("image") == true) valType = 2;
      else if (mime.includes("video") == true) valType = 3;
      else if (mime.includes("3dmodel") == true) valType = 4;
      // TODO: FIX need to get file extension to get proper type
      else if (mime.includes("animation") == true) valType = 5;
      // TODO: FIX need to get file extension to get proper type
      else if (mime.includes("sourcecode") == true) valType = 6;
      // TODO: FIX need to get file extension to get proper type
      else if (mime.includes("spreadsheet") == true) valType = 8;
      else if (mime.includes("document") == true) valType = 7;
      else if (mime.includes("presentation") == true) valType = 9;
      else if (mime.includes("form") == true) valType = 10;
      else if (mime.includes("pdf") == true) valType = 11;
      else if (mime.includes("text/calendar") == true) valType = 12;
      else if (mime.includes("text/csv") == true) valType = 13;
      else if (mime.includes("text/x-vcard") == true) valType = 14;
      else if (mime.includes("application/json") == true) valType = 15;
      else if (mime.includes("text/plain") == true) valType = 16;

      setMetadataAddress(metadataTypes[valType].metadata);
      setSelectedType(metadataTypes[valType].name);
    }
  });

  return (
    <div>
      <h1>Create Your Token</h1>
      Balance: <strong> {ethers.utils.formatEther(balance)} DM</strong> <br />
      <strong>{yourTokenBalance}</strong> Tokens in {collectionName} ({collectionSymbol})
      {/* : <strong>{yourDmNftBalance}</strong> */}
      <div style={{ maxWidth: 820, margin: "auto", marginTop: 16, paddingBottom: 16 }}>
        <>
          <div style={{ borderRadius: "10px" }} className="ant-card-body">
            <div style={{ borderRadius: "10px", margin: "auto" }} className="ant-card-body">
              <FileUpload
                onDataUpload={setLocationAddress}
                onMimeType={onSetMimeType}
                onFilename={setFilename}
                onFilesize={setFilesize}
                onCanCreate={setCanCreate}
                onError={setError}
              />
            </div>
            {filesize != 0 ? (
              <>
                {" "}
                <br />
                {/* <small><span style={{color:"gray"}}>FILE</span></small> 
                    <span style={{color:"gray"}}>TYPE</span> 
                    <span style={{color:"gray"}}>SIZE</span>
                */}
                <strong>{filename}</strong> <br />
                <small>
                  {mimeType == "uploading" ? (
                    <>
                      <Spin /> {mimeType}
                    </>
                  ) : (
                    mimeType
                  )}
                </small>
                <br />
                <small>{filesize} Kb</small> <br />
              </>
            ) : null}

            <br />
            <span style={{ color: "red" }}> {error} </span>

            <Select
              style={{ width: "200px" }}
              hidden={canCreate}
              showSearch
              value={selectedType}
              onChange={value => {
                console.log(`selected ${value} ${metadataTypes[value].metadata}`);
                //setSelectedCollection(value);
                setMetadataAddress(metadataTypes[value].metadata);
                setSelectedType(metadataTypes[value].name);
              }}
            >
              {metadataTypes
                ? metadataTypes.map((collection, index) => (
                    <Select.Option key={collection.metadata + "" + index} value={index}>
                      {index}: {collection.name}
                    </Select.Option>
                  ))
                : null}
            </Select>

            <Button
              type={"primary"}
              hidden={canCreate}
              onClick={() => {
                //debugger;
                setCanCreate(true);
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
        </>
      </div>
      <div className="card-grid-container card-grid-container-fill">
        {yourTokenBalance > 0 ? <>{tokList} </> : null}
      </div>
      {/* <div style={{ width: "80%", margin: "auto" }}>{yourTokenBalance > 0 ? <>{tokList} </> : null}</div> */}
      <div style={{ width: "80%", margin: "auto" }}>
        <Card>
          {/* <SwarmLocationInput
            ensProvider={mainnetProvider}
            placeholder="metadata location"
            value={metadataAddress}
            onChange={newValue => {
              setMetadataAddress(newValue);
            }}
          /> */}
          <Select
            showSearch
            value={selectedCollection}
            onChange={value => {
              console.log(`selected ${value} ${dmCollections[value]}`);
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
          <br />
          mimeType hash: {mimeHash}
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
          <Button
            type={"primary"}
            onClick={() => {
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
        </Card>
      </div>
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

/*
gkmdfgjrFFF34!x2#
 */