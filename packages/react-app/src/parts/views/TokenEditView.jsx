import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useHistory } from "react-router-dom";
import { Button, Card, Input, Tooltip } from "antd";
import { notification } from "antd";
import { ethers } from "ethers";
import * as helpers from "./../helpers";
import { uploadJsonToBee } from "./../SwarmUpload/BeeService";

// function TokenVoteView(props) {
//   const { index, token, onVote, canVote } = props;
//   return (
//     <Card size="large" hoverable>
//       <div style={{ display: "block", alignItems: "right" }}>
//         <div style={{ float: "left", textAlign: "center" }}>
//           <small>{index}.</small> &nbsp;&nbsp;&nbsp; <strong>{token.name}</strong> &nbsp;&nbsp;&nbsp; votes: {token.votes}
//         </div>

//         <div style={{ float: "right" }}>
//           {canVote ? (
//             <span style={{ /*textDecoration: "underline",*/ cursor: "pointer" }} onClick={e => onVote(token)}>
//               <FText>vote</FText>
//             </span>
//           ) : null}
//         </div>
//       </div>
//     </Card>
//   );
// }

export default function TokenEditView(props) {
  const history = useHistory();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [contract, setContract] = useState(null);
  const [tokenData, setTokenData] = useState({ name: "", links: [], parents: [], uri: "", posts: [] });
  const [avatarToken, setAvatarToken] = useState({ name: "Unknown", links: [], parents: [], uri: "", posts: [] });
  const [postText, setPostText] = useState("");
  const [canVote, setCanVote] = useState();

  //const [posts, setPosts] = useState([]);
  const [links, setLinks] = useState([]);
  const [parentLinks, setParentLinks] = useState([]);

  let { contractAddress, id } = useParams();

  const {
    yourDmBalance,
    dmCollections,
    localProvider,
    contractConfig,
    writeContracts,
    readContracts,
    userSigner,
    mainnetProvider,
    userProviderAndSigner,
    address,
    tx,
    url,
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
    getDMNFTToken();
  }, [seconds]);
  useEffect(() => {}, [tokenData]);
  //useEffect(() => {}, [posts]);

  useEffect(() => {
    getDMNFTToken();
  }, [contract, id]);

  useEffect(() => {
    getDMCollectionContract(3);
  }, []);

  function getDMCollectionContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    const teamsContract = new ethers.Contract(contractAddress, contracts.DMCollection.abi, userSigner);
    setContract(teamsContract);
  }
  const getDMNFTTokenInfo = useCallback(async () => {}, []);

  const getDMNFTToken = useCallback(async () => {
    if (contract == null || contract == undefined) return;

    const avatarBalance = await readContracts.Avatar.balanceOf(address);
    if (avatarBalance.toNumber() > 0) {
      const avatarTokenId = await readContracts.Avatar.tokenOfOwnerByIndex(address, 0);
      const avatarToken = await readContracts.Avatar.getAvatarInfo(avatarTokenId);
      //console.log("avatarToken", avatarToken);
      setAvatarToken(avatarToken);
    }

    const links = await helpers.makeCall("getLinks", contract, [id]);
    setLinks(links);

    var parentLinks = [];
    if (links != undefined && links.length > 0) {
      parentLinks = await helpers.makeCall("getLinks", contract, [links[0].tokenId]);
    }

    var toParentUrls = [];
    for (var i = 0; i < parentLinks.length; i++) {
      //console.log(parentLinks[i].tokenId.toNumber())
      toParentUrls.push({ id: parentLinks[i].tokenId.toNumber(), approved: parentLinks[i].approved });
    }

    setParentLinks(parentLinks);
    var tokenInfo = await helpers.makeCall("tokenData", contract, [id]);
    var tokenUri = await helpers.makeCall("tokenURI", contract, [id]);
    var dataLocationCount = await helpers.makeCall("dataLocationCount", contract, [id]);

    var numVotes = await readContracts.Voting.totalVotesFor(contract.address, id);

    //console.log("dataLocationCount", dataLocationCount);
    var locations = [];
    var posts = [];
    if (dataLocationCount != undefined) {
      var start = dataLocationCount.toNumber();
      var count = 10;
      for (var i = start - 1; i >= 0; i--) {
        count--;
        if (count == -1) break;
        try {
          console.log("dataLocationCount", start, i);
          var dataLocation = await helpers.makeCall("dataLocations", contract, [id, i]);
          locations.push(dataLocation);
          var url = helpers.downloadGateway + dataLocation.substring(2) + "/";
          var json = await (await fetch(url)).json();
          posts.push(json);
          //posts = json;
          console.log("posts", posts);
          //console.log("data", i, url, json);
        } catch (e) {
          console.log("error", e);
        }
      }
    }

    //var tokenAddressables = await helpers.makeCall("tokenAddressables", contract, [id]);
    try {
      var data = JSON.parse(tokenInfo);
      data.id = id.toString();
      data.tokenUri = tokenUri;
      data.name = ethers.utils.toUtf8String(data.n).replace(/[^\x01-\x7F]/g, "");
      data.uri = tokenUri;
      data.links = links;
      data.parents = parentLinks;
      data.locations = locations;
      data.posts = posts;
      data.numVotes = numVotes.toNumber();
      console.log("tokenData", data);
      setTokenData(data);
    } catch (e) {
      console.log(e);
    }
  }, [contract]);

  async function addPostToToken(token) {
    notification.success({
      message: "Data",
      description: "Adding data to token",
      placement: "topLeft",
    });
    // post to data to swarm get swarm hash

    var post = {
      title: "",
      text: postText,
      address: address,
      time: Date.now(),
      avatarId: avatarToken.id,
      avatarName: avatarToken.name,
      /*name: tokenData.name,*/
      id: tokenData.id,
      uri: tokenData.uri,
      contract: contract.address,
      type: "post",
    };
    tokenData.posts.push(post);
    console.log("post text", post);
    const swarmHash = await uploadJsonToBee(post, "post.json");
    console.log("swarmHash", swarmHash);
    const result = await helpers.makeCall("addDataLocation", contract, [id, "0x" + swarmHash]); // make tx
    //console.log("result", result);
  }

  async function voteForToken(token) {
    setCanVote(false); //console.log("voteForToken", token);
    tx(writeContracts.Voting.voteFor(contract.address, token.id));

    notification.success({
      message: "Voted",
      description: "Your vote has been sent",
      placement: "topLeft",
    });
  }

  //console.log("posts", tokenData.posts);
  //tokenData.posts.map((d, i) => {console.log(d.text)});
  return (
    <div style={{ maxWidth: 800, margin: "auto", marginTop: 5, paddingBottom: 25, lineHeight: 1.5 }}>
      <Card
        title={
          <>
            <h1
              onClick={() => {
                helpers.speak(avatarToken.name + "'s" + tokenData.name);
              }}
            >
              {avatarToken.name}'s {tokenData.name}
            </h1>

            <div style={{ position: "absolute", right: "5px", top: "1px" }}>
              <Tooltip title="Click to vote.">
                <small onClick={() => voteForToken(tokenData)}>▲{tokenData.numVotes}</small>
              </Tooltip>
            </div>
          </>
        }
      >
        <Input
          style={{ width: "80%" }}
          min={0}
          size="large"
          value={postText}
          placeholder={"What are you creating, " + avatarToken.name + " ?"}
          onChange={e => {
            try {
              setPostText(e.target.value);
            } catch (e) {
              console.log(e);
            }
          }}
        />
        <Button
          onClick={e => {
            addPostToToken();
          }}
        >
          Post
        </Button>
        <br />
      </Card>

      {tokenData.posts.map((d, i) => (
        <div className="">
          <div style={{ textAlign: "left" }}>
            <small>{d.avatarName}</small>
          </div>
          <div style={{ textAlign: "center" }}>{d.title}</div>
          <div
            className="ant-card-body"
            style={{ textAlign: "left", paddingLeft: "20px", paddingTop: "0px", paddingBottom: "0px" }}
          >
            {d.text}
          </div>
        </div>
      ))}

      {/* {tokenData.posts.map((post, i) => {
          <p key={"post_" + i}>
            <span>{post.id}</span>
            <span>{post.avatarName}</span>
            <span>{post.text}</span> hhh
          </p>;
        })} */}

      <small>
        Team Members: {tokenData.links.length} Parents: {tokenData.parents.length} 
        {tokenData.links.map((p, i) => (
          <div
            key={"parent_" + i}
            onClick={e => {
              history.push(url + p.tokenId.toString());
            }}
          >
            avatar {p.tokenId.toString()}
          </div>
        ))}

        {tokenData.parents.map((p, i) => (
          <div
            key={"parent_" + i}
            onClick={e => {
              history.push(url + p.tokenId.toString());
            }}
          >
            avatar {p.tokenId.toString()}
          </div>
        ))}        
      </small>
      
      <strong>TODO query names</strong>

      {/* {tokens.map((token, index) => {
        return <TokenVoteView key={index} index={index + 1} token={token} onVote={voteForToken} canVote={canVote} />;
      })} */}
    </div>
  );
}
