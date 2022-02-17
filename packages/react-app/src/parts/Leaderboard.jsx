import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Select, Button, Card, Col, Input, List, Menu, Row, Progress } from "antd";
import FText from "../components/FText";
import { useContractReader } from "eth-hooks";
import { notification } from "antd";

function TokenVoteView(props) {
  const { index, token, onVote, canVote } = props;
  return (
    <Card size="large" hoverable>
      <div style={{ display: "block", alignItems: "right" }}>
        <div style={{ float: "left", textAlign: "center" }}>
          <small>{index}.</small> &nbsp;&nbsp;&nbsp; <strong>{token.name}</strong> &nbsp;&nbsp;&nbsp; votes: {token.votes} 
        </div>

        <div style={{ float: "right" }}>
          {canVote ? (
            <span style={{ /*textDecoration: "underline",*/ cursor: "pointer" }} onClick={e => onVote(token)}>
              <FText>vote</FText>
            </span>
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
      }, 15000);
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
    // await canUserVote();
    var readTokens = [];
    for (let tokenIndex = 0; tokenIndex < allTokens; tokenIndex++) {
      try {
        const token = await readContracts.Avatar.getAvatarInfo(tokenIndex);
        // console.log("token", token);
        var numVotes = await readContracts.Voting.totalVotesFor(avatarAddress, tokenIndex);
        readTokens.push({ id: tokenIndex, name: token.name, xp: token.experience, votes: numVotes.toNumber() });
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
      {tokens.map((token, index) => {
        return <TokenVoteView key={index} index={index+1} token={token} onVote={voteForToken} canVote={canVote} />;
      })}
      {/* {collectionId} */}
    </div>
  );
}
