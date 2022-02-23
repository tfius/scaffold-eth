import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";

import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { Environment, OrbitControls, useProgress, Html, useFBX, Float } from "@react-three/drei";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import { Select, Button, Card, Col, Input, List, Menu, Row, Tabs } from "antd";
const { TabPane } = Tabs;
import { ethers } from "ethers";
import ReactThreeFbxViewer from "react-three-fbx-viewer";
const { utils, BigNumber } = require("ethers");
import * as helpers from "./helpers";
import AudioPlayer from "./AudioPlayer";
import EtherInput from "./../components/EtherInput";

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
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return null; // <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

const tabListNoTitle = [
  {
    key: "contents",
    tab: "Contents",
  },
  {
    key: "info",
    tab: "Info",
  },
  {
    key: "links",
    tab: "Sell",
  },
  {
    key: "parents",
    tab: "Data",
  },
];

export default function DMTViewer(props) {
  const [loading, setLoading] = useState(true);
  const [loadModel, setLoadModel] = useState();

  const [details, setDetails] = useState();
  const [approval, setApproval] = useState("Approve");
  const [tokenAskPrice, setTokenAskPrice] = useState();
  const [links, setLinks] = useState();
  const [parentLinks, setParentLinks] = useState();

  const [activeTabKey, setActiveTabKey] = useState("contents");

  const { contract, token, isApproved, price, onSellToken, onApproveToken } = props;

  const dataUrl = helpers.downloadGateway + token.d.substring(2) + "/";
  let cameraPosition = {
    x: 150,
    y: 300,
    z: 350,
  };
  const onLoad = useCallback(async e => {
    console.log("fbx load", e);
  });
  const onError = useCallback(async e => {
    console.log("fbx error", e);
  });

  function Loader() {
    const { progress } = useProgress();
    return <Html center>{progress} % loaded</Html>;
  }

  const retrieveNFTData = useCallback(async () => {
    setLoading(true);
    if (contract != null) {
      var name = await helpers.makeCall("name", contract);
      var links = await helpers.makeCall("getLinks", contract, [token.id]);
      //console.log(token.name + " links", links);
      setLinks(links);

      if (links.length > 0) {
        var parentLinks = await helpers.makeCall("getLinks", contract, [links[0].tokenId]);
        //console.log(token.name + " parents ", parentLinks);
        setParentLinks(parentLinks);
      } else setParentLinks([]);

      //var newBalance = await helpers.makeCall("balanceOf", contract, [address]);
      //if (newBalance != undefined) setYourTokenBalance(newBalance.toNumber());

      switch (token.m) {
        case "0x0000000000000000000000000000000000000000000000000000000000000001":
          {
            token.dataView = <AudioPlayer url={dataUrl} />;
          }
          break;
        case "0x0000000000000000000000000000000000000000000000000000000000000002":
          {
            token.dataView = (
              <img src={dataUrl} style={{ width: "19rem", height: "19rem", objectFit: "scale-down", top: 0 }}></img>
            );
          }
          break;
        case "0x0000000000000000000000000000000000000000000000000000000000000003":
          {
            token.dataView = <video controls src={dataUrl} style={{ width: "100%" }} />;
          }
          break;
        case "0x0000000000000000000000000000000000000000000000000000000000000004":
          {
            token.dataView = (
              <Canvas>
                <Suspense fallback={<Loader />}>
                  <ErrorBoundary>
                    <Model />
                  </ErrorBoundary>
                  <OrbitControls />
                  <Environment preset="forest" background />
                </Suspense>
              </Canvas>
            );
          }
          break;

        default: {
          token.dataView = <img src={dataUrl} style={{ width: "100%" }}></img>;
          break;
        }
      }
    }

    //console.log(token);
    setLoading(false);
  });

  useEffect(() => {
    retrieveNFTData();
  }, [contract]);

  const Model = props => {
    const fbx = useLoader(FBXLoader, dataUrl);
    return null;
  };

  if (loading === true) return <h1>Please wait...</h1>;

  var dataView = null;
  const onTabChange = key => {
    setActiveTabKey(key);
  };
  const contentListNoTitle = {
    contents: <p>{token.dataView}</p>,
    info: (
      <div style={{ lineHeight: "1.5rem", textAlign: "center", padding: "10px" }}>
        <h2>Token</h2>
        <div>
          <a
            href={token.tokenUri.replace("swarm://", helpers.downloadGateway) + "/"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download #{token.id}
          </a>
        </div>
        <div>
          Owner: <span style={{ fontSize: "0.4rem" }}>{token.o}</span>
          <br />
          Creator: <span style={{ fontSize: "0.4rem" }}>{token.c}</span>
          <br />
          Data <span style={{ fontSize: "0.4rem" }}>{token.d}</span>
          <br />
          Meta <span style={{ fontSize: "0.4rem" }}>{token.m}</span>
          <br />
        </div>
      </div>
    ),
    links: (
      <div style={{ lineHeight: "1.5rem", textAlign: "center", padding: "10px" }}>
        <h2>Sell token</h2>
        <span>Put offer on Exchange</span> <br />
        <span>
          Duration: <strong>Indefinite</strong>
        </span>{" "}
        <br />
        <span>
          Royalties: <strong>0%</strong>
        </span>{" "}
        <br />
        <strong>NOTE: </strong>Cancel order on marketplace
        <br />
        {isApproved ? (
          <>
            <EtherInput
              value={tokenAskPrice}
              price={price}
              onChange={value => {
                setTokenAskPrice(value);
              }}
            />
            <Button type={"primary"} onClick={e => onSellToken(token, tokenAskPrice)}>
              Sell
            </Button>
          </>
        ) : (
          <>
            <Button
              type={"primary"}
              onClick={e => {
                onApproveToken(contract, token);
                setApproval("wait");
              }}
            >
              {approval}
            </Button>
          </>
        )}
        <br />
      </div>
    ),
    parents: (
      <div style={{ lineHeight: "1.5rem", textAlign: "center", padding: "10px" }}>
        <h2>Data</h2>
      </div>
    ),
  };

  return (
    <div>
      <Card.Grid
        size="small"
        style={{
          minWidth: "2rem",
          maxWidth: "20rem",
          minHeight: "20rem",
          maxHeight: "20rem",
          margin: "auto",
          marginTop: 0,
          padding: "1px",
          lineHeight: 1,
        }}
        // style={{ minHeight:"25rem", maxHeight:"25rem",weight:"100%",  margin: "auto" }}
        onClick={() => console.log(token)}
        hoverable
        onMouseEnter={e => {
          setDetails(true);
        }}
        onMouseLeave={e => {
          setDetails(false);
        }}
      >
        <h2>{token.name}</h2>
        {/* <span
        style={{ display: "flex", right: "0", top: "0", position: "absolute" }}
        onClick={() => {
          setDetails(!details);
        }}
      >
        ⓘ
      </span>  */}
        {contentListNoTitle[activeTabKey]}
        {details == true ? (
          <Tabs
            style={{
              display: "block",
              left: "0",
              right: "0",
              bottom: "0",
              position: "absolute",
              background: "#0000005f",
              padding: "20px",
            }}
            defaultActiveKey={activeTabKey}
            onChange={key => {
              onTabChange(key);
            }}
          >
            {tabListNoTitle.map((c, i) => (
              <TabPane tab={c.tab} key={c.key} style={{ fontSize: "8px" }}>
                {/* {contentListNoTitle[activeTabKey]} */}
                {/* Content of tab {i} */}
              </TabPane>
            ))}
          </Tabs>
        ) : null}
      </Card.Grid>
    </div>
  );
}
