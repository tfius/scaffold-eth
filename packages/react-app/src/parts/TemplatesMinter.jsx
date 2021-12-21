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

export default function TemplatesMinter(props) {
  const [loading, setLoading] = useState(true);
  const [contractName, setContractName] = useState([]);
  const [contractSymbol, setContractSymbol] = useState([]);
  const [yourTokenBalance, setYourTokenBalance] = useState([]);
  const [contract, setContract] = useState([]);
  const [templateTokens, setTemplateTokens] = useState([]);
  const [yourTokens, setYourTokens] = useState([]);
  const [isNonTransferable, setIsNonTransferable] = useState([]);
  const [finiteCount, setFiniteCount] = useState([]);
  //const contractIndex = 0;

  const {
    dmCollections,
    selectedCollection,
    localProvider,
    writeContracts,
    address,
    contractConfig,
    gasPrice,
    tx,
    title,
  } = props;

  const updateNFTBalance = useCallback(async () => {
    setLoading(true);
    if (dmCollections === undefined) return;
    const contracts = helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const dmCollectionContract = new ethers.Contract(
      dmCollections[selectedCollection],
      contracts.DMCollection.abi,
      localProvider,
    );

    if (dmCollectionContract != null) {
      const addr = address.toLowerCase();
      setContract(dmCollectionContract);
      var name = await helpers.makeCall("name", dmCollectionContract);
      setContractName(name);
      var symbol = await helpers.makeCall("symbol", dmCollectionContract);
      setContractSymbol(symbol);
      var nonTrans = await helpers.makeCall("nonTransferable", dmCollectionContract);
      setIsNonTransferable(nonTrans);
      var finite = await helpers.makeCall("finiteCount", dmCollectionContract);
      setFiniteCount(finite.toNumber());
      // GET TEMPLATES
      var indices = await helpers.makeCall("getTemplateIndices", dmCollectionContract);
      var tokens = [];
      for (var i = 0; i < indices.length; i++) {
        var tokenInfo = await helpers.makeCall("tokenData", dmCollectionContract, [indices[i]]);
        var data = JSON.parse(tokenInfo);
        data.id = indices[i];
        data.n = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");

        var links = await helpers.makeCall("getLinks", dmCollectionContract, [indices[i]]);
        console.log(data.n + " children ", links);
        data.links = links;

        console.log(data.o, address, data.o === addr);
        if (data.o != addr) tokens.push(data);
      }

      setTemplateTokens(tokens);

      var newBalance = await helpers.makeCall("balanceOf", dmCollectionContract, [address]);
      if (newBalance != undefined) setYourTokenBalance(newBalance.toNumber());
      console.log("balance", newBalance);
    }

    setLoading(false);
  });

  useEffect(() => {
    setYourTokens([]);
    setTemplateTokens([]);
    setYourTokenBalance(0);
    updateNFTBalance();
  }, [selectedCollection]);

  const updateYourNFTs = useCallback(async () => {
    if (contract != null) {
      if (yourTokenBalance >= 0) {
        var nfts = [];
        for (let tokenIndex = 0; tokenIndex < yourTokenBalance; tokenIndex++) {
          try {
            const tokenId = await helpers.makeCall("tokenOfOwnerByIndex", contract, [address, tokenIndex]);
            var tokenInfo = await helpers.makeCall("tokenData", contract, [tokenId.toNumber()]);
            var tokenUri = await helpers.makeCall("tokenURI", contract, [tokenId.toNumber()]);
            /*
                const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
                console.log("ipfsHash", ipfsHash);
                const jsonManifestBuffer = await getFromIPFS(ipfsHash);
              */
            try {
              var data = JSON.parse(tokenInfo);
              data.id = tokenId.toString();
              data.tokenUri = tokenUri;
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
    //console.log("balance changed, get tokens");
    updateYourNFTs();
  }, [yourTokenBalance]);

  const mintFromTemplate = useCallback(async nftTemplateIndex => {
    var metadata = {};
    var cost = await helpers.makeCall("tokenAmount", contract, [nftTemplateIndex]);
    console.log("cost", cost);

    metadata.value = cost; //BigNumber.from('5000000000000000000000');
    metadata.gasPrice = gasPrice;
    tx(writeContracts.DataMarket.templatesMintFrom(address, selectedCollection, nftTemplateIndex, metadata));
  });

  const toks = yourTokens.map((t, i) => {
    return <DMTViewer key={"tok" + i} token={t} contract={contract} address={address} />; //<Card>{<h2>{t.name}</h2>}</Card>;
  });

  if (loading === true) return <h1>Please wait...</h1>;

  return (
    <div style={{ maxWidth: 1000, margin: "auto", marginTop: 5, paddingBottom: 25, lineHeight: 1.5 }}>
      {/* Balance: <strong>{yourDmBalance} DM</strong> <br /> */}
      <h1>{title}</h1>
      {/* {finiteCount < yourTokenBalance ? "DISP" : "DONT DISP"} */}
      {finiteCount == 0 || yourTokenBalance != finiteCount ? (
        <List
          // bordered
          style={{ verticalAlign: "top" }}
          dataSource={templateTokens}
          renderItem={item => {
            const id = item.id.toNumber();
            return (
              <List.Item
                key={"mem_" + id}
                style={{ maxWidth: "25%", minWidth: "200px", display: "inline-block", padding: "2px" }}
              >
                <Card key={id + "_"} title={<h3>{item.n}</h3>}>
                  {/* <h2>{item.n}</h2> */}
                  {item.a.toString() !== "0" ? (
                    <>
                      Participant commiting more than {ethers.utils.formatEther(item.a)} will receive a{" "}
                      <strong>{item.n}</strong> {contractName} class NFT{" "}
                    </>
                  ) : (
                    <>Join {contractSymbol}</>
                  )}
                  <br />

                  <img src={item.image} />
                  <div>{item.description}</div>
                  <Button
                    onClick={() => {
                      mintFromTemplate(item.id);
                    }}
                  >
                    Mint
                  </Button>
                  <br />
                  <br />
                  {item.a.toString() !== "0" ? <span>Cost {ethers.utils.formatEther(item.a)}</span> : null}
                  <br />
                  <div>
                    <br />
                    <small>{item.links.length} members</small>
                  </div>
                </Card>
              </List.Item>
            );
          }}
        />
      ) : (
        ""
      )}
      <br />
      {yourTokenBalance > 0 ? (
        <h3>
          {contractName}: {yourTokenBalance} {contractSymbol} <br />
        </h3>
      ) : // <p>
      //   Become a {contractSymbol}. <br />
      //   0.05% of your {contractName} will go to treasury and rest you will receive <strong>DM</strong>s. <br />
      //   In meantime your funds can be used as flash loans by other members. <br />
      //   You can liquidate your <strong>DM</strong>s anytime but will loose value on {contractName}.
      // </p>
      null}
      {yourTokenBalance > 0 ? <>{toks} </> : null}
      Can {finiteCount == 0 ? "" : <strong>NOT</strong>} be accumulated and are{" "}
      {isNonTransferable ? <strong>NON-</strong> : ""}transferable. <br />
    </div>
  );
}
