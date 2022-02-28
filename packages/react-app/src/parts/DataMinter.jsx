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
import { Select, Button, Card, Spin, Col, Input, List, Menu, Row, notification } from "antd";
//const { ethers } = require("ethers");
import { ethers } from "ethers";

import * as helpers from "./helpers";
import DMTViewer from "./DMTViewer";

import SwarmLocationInput from "./SwarmLocationInput";
import FileUpload from "./SwarmUpload/FileUpload";

import { useStore } from "../state";

export default function DataMinter(props) {
  const {
    state: { hash },
  } = useStore();

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [visibleTransfer, setVisibleTransfer] = useState([]);
  const [metadataAddress, setMetadataAddress] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  const [collectionName, setCollectionName] = useState([]);
  const [collectionSymbol, setCollectionSymbol] = useState([]);

  const [yourTokenBalance, setYourTokenBalance] = useState([]);
  const [yourTokens, setYourTokens] = useState([]);
  const [mimeHash, setMimeHash] = useState();
  const [canCreate, setCanCreate] = useState(true); // todo refactor name

  const [setSelectedType] = useState("");

  const [contract, setContract] = useState([]);
  const [isApproved, setIsApproved] = useState(false);

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

  useEffect(() => {
    if (hash) {
      setLocationAddress(hash);
    }
  }, [hash]);

  const updateContract = useCallback(async () => {
    setMetadataAddress("0x0000000000000000000000000000000000000000000000000000000000000000");

    if (dmCollections === undefined) return;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const dmCollectionContract = new ethers.Contract(
      dmCollections[selectedCollection],
      contracts.DMCollection.abi,
      userSigner,
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
        if (newBalance != undefined) {
          if (newBalance.toNumber() < yourTokenBalance || newBalance.toNumber() == 0) {
            setYourTokens([]);
          }
          setYourTokenBalance(newBalance.toNumber());
          console.log("new balance", newBalance.toString());
        }
      } catch (e) {
        console.log(e);
      }
    }
  }, [contract, address]);
  const updateTokens = useCallback(async () => {
    console.log("updateTokens");
    setIsLoading(true);
    if (contract != null) {
      if (yourTokenBalance >= 0) {
        var nfts = [];
        for (let tokenIndex = yourTokens.length; tokenIndex < yourTokenBalance; tokenIndex++) {
          try {
            const tokenId = await helpers.makeCall("tokenOfOwnerByIndex", contract, [address, tokenIndex]);
            var tokenInfo = await helpers.makeCall("tokenData", contract, [tokenId.toNumber()]);
            var tokenUri = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
            // var isApproved = await helpers.makeCall("isApprovedForAll", contract, [
            //   address,
            //   readContracts.ExchangeDM.address,
            // ]);
            try {
              var data = JSON.parse(tokenInfo);
              data.id = tokenId.toString();
              data.tokenUri = tokenUri;
              data.name = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");
              // data.isApproved = isApproved;

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
    setIsLoading(false);
  });

  const getApproval = useCallback(async () => {
    if (contract != null && readContracts.ExchangeDM != undefined) {
      var approved = await helpers.makeCall("isApprovedForAll", contract, [address, readContracts.ExchangeDM.address]);
      setIsApproved(approved);
    }
  }, [contract, isApproved]);

  useEffect(() => {
    updateContract();
    setIsApproved(false);
    setYourTokens([]);
    setYourTokenBalance(0);
  }, [selectedCollection]);

  useEffect(() => {
    updateNFTBalance();
    getApproval();
    console.log("updateNFTBalance");
  }, [contract]);

  useEffect(() => {
    updateTokens();
    console.log("yourTokenBalance", yourTokenBalance);
  }, [yourTokenBalance]);

  // useEffect(() => {}, [locationAddress]);
  // useEffect(() => {}, [mimeHash, mimeType, filename, canCreate, error, metadataAddress]);
  useEffect(() => {
    updateNFTBalance();
    getApproval();
    console.log("seconds");
  }, [seconds]);

  const gridStyle = {
    width: "25%",
    textAlign: "center",
  };

  var toks = yourTokens.map((t, i) => {
    return (
      <>
        <DMTViewer
          key={"tok" + i}
          token={t}
          contract={contract}
          address={address}
          readContracts={readContracts}
          onSellToken={sellToken}
          onApproveToken={approveToken}
          onListToken={listToken}
          isApproved={isApproved}
        />
      </>
    );
  });

  var tokList = <div>{toks}</div>;

  const balance = yourDmBalance == undefined ? "0" : yourDmBalance;

  async function sellToken(token, askPrice) {
    let value;
    try {
      try {
        value = ethers.utils.parseEther("" + askPrice);
      } catch (e) {
        value = ethers.utils.parseEther("" + parseFloat(askPrice).toFixed(8)); // failed to parseEther, try something else
      }
      console.log("sellToken", token, askPrice, value.toString());
    } catch (e) {
      console.error(e);
      notification.error({ description: e });
      return;
    }

    if (writeContracts != undefined && tx != undefined) {
      var res = await tx(
        writeContracts.ExchangeDM.sell(
          address,
          "0x53656c6c61626c65000000000000000000000000000000000000000000000000",
          contract.address,
          token.id,
          value,
          [address],
          [1000], // so 1% fees for seller
          true,
        ),
      );

      notification.success({
        message: "Offer",
        description: "Your token is being sent to the marketplace",
        placement: "topLeft",
      });
    }
  }
  async function listToken(token, value) {
    if (writeContracts != undefined && tx != undefined) {
      var res = await tx(
        writeContracts.ExchangeDM.sell(
          address,
          "0x4c69737465640000000000000000000000000000000000000000000000000000",
          contract.address,
          token.id,
          value,
          [address],
          [1000], // so 1% fees for seller
          false,
        ),
      );

      notification.success({
        message: "List",
        description: "Not sellable token will be listed",
        placement: "topLeft",
      });
    }
  }

  async function approveToken(contract, token) {
    console.log("approveToken", token);
    if (writeContracts != undefined /*&& tx != undefined*/) {
      var tx = await helpers.makeCall("setApprovalForAll", contract, [writeContracts.ExchangeDM.address, true]);
      console.log("approveToken tx", tx);

      notification.success({
        message: "Approve",
        description: "You are giving the Exchange permission to transfer your token",
        placement: "topLeft",
      });
    }
  }

  /*
  async function voteForToken(token) {
    //setCanVote(false); //console.log("voteForToken", token);
    if (writeContracts != undefined && tx != undefined) {
      var res = await tx(writeContracts.Voting.voteFor(contract.address, token.id));
    }
  }*/

  return (
    <div>
      <h1>Create Your Token</h1>
      Balance: <strong> {ethers.utils.formatEther(balance)} DMTs</strong> <br />
      <strong>{yourTokenBalance}</strong> Tokens in {collectionName} ({collectionSymbol})
      {/* : <strong>{yourDmNftBalance}</strong> */}
      <div style={{ maxWidth: 820, margin: "auto", marginTop: 16, paddingBottom: 16 }}>
        <>
          <div style={{ borderRadius: "10px" }} className="ant-card-body">
            <div style={{ borderRadius: "10px", margin: "auto" }} className="ant-card-body">
              {tx != undefined && (
              <FileUpload
                options={{ tx, writeContracts, selectedCollection, address, metadataAddress, locationAddress }}
              />)}
            </div>
          </div>
        </>
      </div>
      {isLoading ? (
        <>
          <Spin />
        </>
      ) : null}
      <div className="card-grid-container card-grid-container-fill">
        {yourTokenBalance > 0 ? <>{tokList} </> : null}
      </div>
      {/* <div style={{ width: "80%", margin: "auto" }}>{yourTokenBalance > 0 ? <>{tokList} </> : null}</div> */}
      <div style={{ width: "80%", margin: "auto" }}>
        <Card>
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
