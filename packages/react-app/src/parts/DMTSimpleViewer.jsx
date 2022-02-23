import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import { Select, Button, Card, Col, Input, List, Menu, Row, Tabs, Tooltip, notification } from "antd";
const { TabPane } = Tabs;
import { ethers } from "ethers";
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

export default function DMTSimpleViewer(props) {
  const [loading, setLoading] = useState(true);
  const [loadModel, setLoadModel] = useState();

  const [details, setDetails] = useState();
  const [numVotes, setNumVotes] = useState();
  const [links, setLinks] = useState();
  const [parentLinks, setParentLinks] = useState();

  const [activeTabKey, setActiveTabKey] = useState("contents");

  const {
    contract,
    token,
    onClickRedirect,
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

  const retrieveNFTData = useCallback(async () => {
    setLoading(true);
    if (contract != null && readContracts != undefined) {
      var numVotes = await readContracts.Voting.totalVotesFor(contract.address, token.id);
      setNumVotes(numVotes.toNumber());
    }

    //console.log(token);
    setLoading(false);
  });

  const getLinks = useCallback(async () => {
    if (contract != null) {
      console.log(token.name + " links", links);
    }
  });
  const getParentLinks = useCallback(async () => {
    if (contract != null) {
      console.log(token.name + " parentLinks", parentLinks);
    }
  });

  useEffect(() => {
    retrieveNFTData();
  }, [contract]);

  if (loading === true) return <h5>Please wait...</h5>;
  // var dataView = null;
  // const onTabChange = key => {
  //   setActiveTabKey(key);
  // };
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

  async function voteForToken(token) {
    //setCanVote(false); //console.log("voteForToken", token);
    if (writeContracts != undefined && tx != undefined) {
      var res = await tx(writeContracts.Voting.voteFor(contract.address, token.id));
    }
  }

  return (
    <>
      <Card.Grid
        title={token.name}
        size="small"
        style={{
          minWidth: "2rem",
          maxWidth: "20rem",
          minHeight: "3rem",
          maxHeight: "3rem",
          margin: "auto",
          marginTop: 0,
          padding: "1px",
          lineHeight: 1,
        }}
        hoverable
        onMouseEnter={e => {
          setDetails(true);
        }}
        onMouseLeave={e => {
          setDetails(false);
        }}
      >
        <h2
          style={{ textAlign: "center", padding: 10 }}
          onClick={e => {
            if (onClickRedirect != undefined) {
              helpers.speak(token.name);
              onClickRedirect(token);
            } else console.log("DMT Simple view ", token);
          }}
        >
          {token.name}
        </h2>
        {details ? (
          <div style={{ position: "absolute", right: "5px", top: "1px" }}>
            <Tooltip title="Click to vote.">
              <small onClick={() => voteForToken(token)}>▲{numVotes}</small>
              {/* <small>▲{numVotes}</small> */}
            </Tooltip>
          </div>
        ) : null}
        {/* {contentListNoTitle[activeTabKey]}
        {details == true ? (
          <Tabs
            style={{
              display: "block",
              left: "0",
              //right: "0",
              bottom: "0",
              top: "0",
              position: "absolute",
              background: "#0000005f",
              padding: "5px",
            }}
            defaultActiveKey={activeTabKey}
            onChange={key => {
              onTabChange(key);
            }}
          >
            {tabListNoTitle.map((c, i) => (
              <TabPane tab={c.tab} key={c.key} style={{ fontSize: "8px" }}>
              </TabPane>
            ))}
          </Tabs>
        ) : null} */}
      </Card.Grid>
    </>
  );
}
