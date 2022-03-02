import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useHistory } from "react-router-dom";
import { Button, Card, Input, Tooltip } from "antd";
import { notification } from "antd";
import { ethers } from "ethers";
import * as helpers from "./../helpers";
import { uploadJsonToBee } from "./../SwarmUpload/BeeService";
import FileUpload from "../SwarmUpload/FileUpload";
import { useStore } from "../../state";

export default function TokenEditView(props) {
  const {
    state: { post, file },
    dispatch,
  } = useStore();

  const history = useHistory();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [dataUrl, setDataUrl] = useState(null);

  const [contract, setContract] = useState(null);
  const [tokenData, setTokenData] = useState({ name: "", links: [], parents: [], uri: "", posts: [] });
  const [avatarToken, setAvatarToken] = useState({ name: "Unknown", links: [], parents: [], uri: "", posts: [] });
  const [postText, setPostText] = useState("");
  const [fileMetadata, setFileMetadata] = useState(null);
  const [canVote, setCanVote] = useState();

  const [ownerAvatarName, setOwnerAvatarName] = useState("");

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
      }, 20000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  useEffect(() => {
    getDMNFTToken();
  }, [seconds]);

  useEffect(() => {}, [tokenData]);

  useEffect(() => {
    getDMNFTToken();
  }, [post]);

  useEffect(() => {
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => {
    getDMNFTToken();
  }, [contract, id]);

  useEffect(() => {
    getDMCollectionContract(3);
  }, []);

  async function getTokenOwnerAvatar(data) {
    if (data.o.toString() == readContracts.ExchangeDM.address.toLowerCase()) {
      setOwnerAvatarName("Market's");
      return;
    }
    //console.log("Avatar", readContracts.Avatar)
    const tokenOwnerAvatar = await readContracts.Avatar.balanceOf(data.o);
    // console.log("tokenOwnerId", tokenOwnerAvatar, data.o);
    //console.log("tokenInfo",tokenInfo)
    // debugger;
    if (tokenOwnerAvatar.toNumber() > 0) {
      const avatarTokenId = await readContracts.Avatar.tokenOfOwnerByIndex(data.o, 0);
      const avatarToken = await readContracts.Avatar.getAvatarInfo(avatarTokenId);
      console.log("tokenOwnerAvatar", avatarToken);
      setOwnerAvatarName(avatarToken.name + "'s");
      //setAvatarToken(avatarToken);
    } else {
      setOwnerAvatarName("Unknown's");
    }
  }

  function getDMCollectionContract(contractIndex) {
    if (dmCollections === undefined) return null;
    const contracts = helpers.getDeployedContracts(); //helpers.findPropertyInObject("contracts", contractConfig.deployedContracts);
    if(contracts==undefined) return null;
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
      if (avatarToken.name == "") {
        setOwnerAvatarName(address + "'s");
      } else setOwnerAvatarName(avatarToken.name + "'s");
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
          if (dataLocation === "0x0000000000000000000000000000000000000000000000000000000000000000") {
            continue;
          }
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

      setDataUrl(helpers.downloadGateway + data.d.substring(2) + "/");

      var url = helpers.downloadGateway + data.m.substring(2) + "/";
      var json = await (await fetch(url)).json();

      setFileMetadata(json);
      // setPostText(json);

      console.log("post: ", json);

      setTokenData(data);

      try {
        await getTokenOwnerAvatar(data);
      } catch (e) {
        console.log("getTokenOwnerAvatar error", e);
      }
    } catch (e) {
      console.log(e);
    }
  }, [contract]);

  const addToTokenNotification = () => {
    notification.success({
      message: "Data",
      description: "Adding data to token",
      placement: "topLeft",
    });
  };

  async function addPostToToken() {
    addToTokenNotification();
    dispatch({ type: "APPEND_DATA_TOKEN", payload: { postText, address, avatarToken, tokenData, contract, id } });
    setPostText("");
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
                helpers.speak(ownerAvatarName.name + "'s" + tokenData.name);
              }}
            >
              {ownerAvatarName} {tokenData.name}
            </h1>

            <div style={{ position: "absolute", right: "5px", top: "1px" }}>
              <Tooltip title="Click to vote.">
                <small onClick={() => voteForToken(tokenData)}>▲{tokenData.numVotes}</small>
              </Tooltip>
            </div>
          </>
        }
      >
        {dataUrl && (
          <>
            <img
              src={dataUrl}
              style={{ width: "10rem", height: "10rem", top: 0 }}
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/1772/1772485.png";
              }}
            ></img>
            {fileMetadata && (
              <>
                <br />
                <br />
                <span>
                  Name: {fileMetadata.title} | Description: {fileMetadata.text}
                </span>
                <br />
              </>
            )}
          </>
        )}

        {file === null && (
          <>
            <Input
              style={{ width: "80%" }}
              min={0}
              size="large"
              value={postText}
              placeholder={"Add your thoughts to the token, " + avatarToken.name + " ... "}
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
              Append
            </Button>
          </>
        )}
        <br />
        <div style={{ borderRadius: "10px", margin: "auto" }} className="ant-card-body">
          <FileUpload options={{ address, append: true, tokenData, contract, id, avatarToken }} />
        </div>
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
            {d.postText}
            <br />

            {d.fileHash && (
              <a href={helpers.downloadGateway + d.fileHash?.substring(2) + "/"} target="_blank">
                View File
              </a>
            )}
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

      {/* <small>
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
      </small> */}

      <br />
      {/* <small>
        <strong>Resistance</strong>
      </small> */}

      {/* {tokens.map((token, index) => {
        return <TokenVoteView key={index} index={index + 1} token={token} onVote={voteForToken} canVote={canVote} />;
      })} */}
    </div>
  );
}
