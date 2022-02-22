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

import Blockies from "react-blockies";
import { SendOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import { Select, Button, Card, Col, Input, List, Menu, Row, Tabs } from "antd";
const { TabPane } = Tabs;
import { ethers } from "ethers";
import ReactThreeFbxViewer from "react-three-fbx-viewer";
const { utils, BigNumber } = require("ethers");
import * as helpers from "./helpers";
import AudioPlayer from "./AudioPlayer";


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
    tab: "contents",
  },
  {
    key: "info",
    tab: "info",
  },
  {
    key: "links",
    tab: "links",
  },
  {
    key: "parents",
    tab: "parents",
  },
];

export default function DMTViewer(props) {
  const [loading, setLoading] = useState(true);
  const [loadModel, setLoadModel] = useState();

  const [details, setDetails] = useState();
  const [links, setLinks] = useState();
  const [parentLinks, setParentLinks] = useState();

  const [activeTabKey, setActiveTabKey] = useState("contents");

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
            token.dataView = <img src={dataUrl} style={{width: "19rem", height:"19rem", objectFit: "scale-down", top:0 }}></img>;
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

  const getLinks = useCallback(async () => {
    //setLoading(true);
    if (contract != null) {
      //var name = await helpers.makeCall("name", contract);
      //var links = await helpers.makeCall("getLinks", contract, [token.id]);
      console.log(token.name + " links", links);
      //setLinks(links)
    }
  });
  const getParentLinks = useCallback(async () => {
    //setLoading(true);
    if (contract != null) {
      //var name = await helpers.makeCall("name", contract);
      //var links = await helpers.makeCall("getLinks", contract, [token.id]);
      console.log(token.name + " parentLinks", parentLinks);
      //setLinks(links)
    }
  });

  useEffect(() => {
    retrieveNFTData();
  }, [contract]);

 /* 
  useEffect(() => {
    getLinks();
  }, [links]);
  useEffect(() => {
    getParentLinks();
  }, [links]); 
  */

  // useEffect(() => {
  //    fbx = useFBX(dataUrl);
  //    console.log ()
  //    token.dataView = <primitive object={fbx} />
  // }, [loadModel]);

  const Model = props => {
    //const fbx = useFBX(dataUrl);
    const fbx = useLoader(FBXLoader, dataUrl);
    return null;
    // return <primitive object={fbx} dispose={null} scale={0.4} {...props} />;
  };

  if (loading === true) return <h1>Please wait...</h1>;

  //const hasMeta = token.m === "0x0000000000000000000000000000000000000000000000000000000000000000"; // process metadata

  // const onLoad = e => {
  //   console.log(e);
  // };

  // const onError = e => {
  //   console.log(e);
  // };

  var dataView = null;
  /*
  var audioSource = <AudioPlayer url={dataUrl} />
  var imageSource = <img src={dataUrl} style={{ width: "180px" }}></img>
  var videoSource = <video controls src={dataUrl} /> 
  */
  const onTabChange = key => {
    setActiveTabKey(key);
  };
  const contentListNoTitle = {
    contents: <p>{token.dataView}</p>,
    info: (
      <p>
        <div>
          <a
            href={token.tokenUri.replace("swarm://", helpers.downloadGateway) + "/"}
            target="_blank"
            rel="noopener noreferrer"
          >
            View token #{token.id}
          </a>
        </div>
        <div style={{ fontSize: "0.5rem" }}>
          <br />
          Owner: {token.o}
          <br />
          Creator: {token.o}
          <br />
          {token.d}
          <br />
          {token.m}
          <br />
        </div>
      </p>
    ),
    links: <p>links content</p>,
    parents: <p>parents content</p>,
  };

  return (
    <div >
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