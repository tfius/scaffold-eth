import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Select, Button, Card, Col, Input, List, Menu, Row, Progress, Tooltip, Spin } from "antd";
import FText from "../components/FText";
import { useContractReader } from "eth-hooks";
import { notification } from "antd";

function TokenVoteView(props) {
  const { index, token, onVote, canVote } = props;
  return (
    <Card size="large" hoverable>
      <div style={{ display: "block", alignItems: "right" }}>
        <div style={{ float: "left", textAlign: "center" }}>
          <small>{index}.</small> &nbsp;<strong>{token.name}</strong>&nbsp;&nbsp;&nbsp;<strong>{token.xp}</strong>
          <small> XP</small>
        </div>

        <div style={{ float: "right" }}>
          <small>Votes: </small>
          {token.votes}
          {canVote ? (
            <Tooltip title="Click to vote.">
              <span style={{ /*textDecoration: "underline",*/ cursor: "pointer" }} onClick={e => onVote(token)}>
                ▲
              </span>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default function Leaderboard(props) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [tokens, setTokens] = useState([]);
  const [canVote, setCanVote] = useState();
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [maxPages, setMaxPages] = useState();

  let { collectionId } = useParams();

  const {
    yourDmBalance,
    dmCollections,
    localProvider,
    writeContracts,
    readContracts,
    mainnetProvider,
    userProviderAndSigner,
    address,
    contractConfig,
    tx,
  } = props;

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 65000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  useEffect(() => {
    //console.log("Leadeboard Seconds");
    canUserVote();
    getTokens();
  }, [seconds]);

  useEffect(() => {
    getTokens();
  }, [collectionId]);

  useEffect(() => {
    //getTokens();
  }, [tokens]);

  const nextPage = () => {
    if (page < maxPages - 1) {
      setPage(page + 1);
      //getOrders();
    }
  };
  const prevPage = () => {
    if (page > 0) {
      setPage(page - 1);
      //getOrders();
    }
  };

  useEffect(() => {
    setTokens([]);
    getTokens();
  }, [page]);

  const canUserVote = useCallback(async () => {
    if (readContracts === undefined || readContracts.Voting === undefined) return;
    const canUserVote = await readContracts.Voting.canVote(address);
    setCanVote(canUserVote);
    //console.log("canUserVote", canUserVote);
  }, []);

  const getTokens = useCallback(async () => {
    if (readContracts === undefined || readContracts.Avatar === undefined || readContracts.Voting === undefined) return;
    const allTokens = await readContracts.Avatar.totalSupply();
    const votes = await readContracts.Voting.votesLeft(address);
    const avatarAddress = readContracts.Avatar.address;
    setMaxPages(Math.ceil(allTokens.toNumber() / pageSize));
    // await canUserVote();
    var readTokens = [];
    //for (let tokenIndex = 0; tokenIndex < allTokens && tokenIndex<15; tokenIndex++) {
    for (let tokenIndex = page * pageSize; tokenIndex < (page + 1) * pageSize && tokenIndex < allTokens; tokenIndex++) {
      try {
        const token = await readContracts.Avatar.getAvatarInfo(tokenIndex);
        console.log("token", token);
        var numVotes = await readContracts.Voting.totalVotesFor(avatarAddress, tokenIndex);
        readTokens.push({
          id: tokenIndex,
          name: token.name,
          xp: token.experience.toNumber(),
          votes: numVotes.toNumber(),
        });
      } catch (e) {
        console.log(e);
      }
    }
    readTokens.sort((a, b) => b.votes - a.votes);
    setTokens(readTokens);
    return tokens;
  }, [readContracts, address, canVote]);

  async function voteForToken(token) {
    //console.log("voteForToken", token);
    setCanVote(false);
    //var tx = await writeContracts.Voting.voteFor(readContracts.Avatar.address, token.id);
    tx(writeContracts.Voting.voteFor(readContracts.Avatar.address, token.id));

    notification.success({
      message: "Voted",
      description: "Your vote has been sent",
      placement: "topRight",
    });
  }

  const votingEvents = useContractReader(readContracts, "Voting", "canVote", [address]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", marginTop: 5, paddingBottom: 25, lineHeight: 1.5 }}>
      <h1>Leaderboard</h1>
      <div>
        <span style={{ cursor: "pointer" }} onClick={() => prevPage()}>
          ←
        </span>
        {page + 1}/{maxPages}
        <span style={{ cursor: "pointer" }} onClick={() => nextPage()}>
          →
        </span>
      </div>
      <br/>

      {tokens.length == 0 && <Spin />}

      {tokens.map((token, index) => {
        return <TokenVoteView key={index} index={index + 1} token={token} onVote={voteForToken} canVote={canVote} />;
      })}
      {/* {collectionId} */}

    </div>
  );
}
