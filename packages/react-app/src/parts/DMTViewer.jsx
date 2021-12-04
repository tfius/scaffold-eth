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
import { Environment, OrbitControls, useProgress, Html, useFBX } from "@react-three/drei";

import { SendOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { Select, Button, Card, Col, Input, List, Menu, Row } from "antd";
import { ethers } from "ethers";
import ReactThreeFbxViewer from "react-three-fbx-viewer";
const { utils, BigNumber } = require("ethers");
import * as helpers from "./helpers";
import AudioPlayer from "./AudioPlayer";

const gatewayUrl = "https://gw-testnet.fairdatasociety.org/";
// get data from https://gw-testnet.fairdatasociety.org/bzz/109dfe7be464b749bd2d29db0f1ba2b3229973c1b9b3b5fffed289766c4a88ae/
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

export default function DMTViewer(props) {
  const [loading, setLoading] = useState(true);
  const [loadModel, setLoadModel] = useState();

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

  const dataUrl = gatewayUrl + "bzz/" + token.d.substring(2) + "/";
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
      console.log(token.name + " links", links);

      if (links.length > 0) {
        var parentLinks = await helpers.makeCall("getLinks", contract, [links[0].tokenId]);
        console.log(token.name + " parents ", parentLinks);
      }

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
            token.dataView = <img src={dataUrl} style={{ width: "180px" }}></img>;
          }
          break;
        case "0x0000000000000000000000000000000000000000000000000000000000000003":
          {
            token.dataView = <video controls src={dataUrl} />;
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
      }
    }

    //console.log(token);
    setLoading(false);
  });

  useEffect(() => {
    retrieveNFTData();
  }, [contract]);

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

  return (
    <Card style={{ maxWidth: 280, margin: "auto", marginTop: 5, paddingBottom: 0, lineHeight: 1.2 }}>
      <h2>{token.name}</h2>
      {token.dataView}
    </Card>
  );
}
