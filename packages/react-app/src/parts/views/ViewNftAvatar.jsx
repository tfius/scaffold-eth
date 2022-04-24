import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useHistory } from "react-router-dom";
import { Button, Card, Input, Tooltip, Row } from "antd";
import { notification } from "antd";
import { ethers } from "ethers";
import * as helpers from "../helpers";
import { uploadJsonToBee } from "../SwarmUpload/BeeService";
import FileUpload from "../SwarmUpload/FileUpload";
import { useStore } from "../../state";

export default function ViewNftAvatar(props) {
  const {
    state: { post, file },
    dispatch,
  } = useStore();

  const history = useHistory();
  const [seconds, setSeconds] = useState(0);
  const [avatar, setAvatar] = useState(null);
  const [avatarInfo, setAvatarInfo] = useState(null);
  let { ownerAddress, tokenId } = useParams();

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

  async function getAvatar() {
    if (readContracts === undefined) return;
    if (readContracts.WAMSpring2022 === undefined) return;

    try {
    const info = await readContracts.WAMSpring2022.getAvatarInfo(tokenId);
    const url = await readContracts.WAMSpring2022.tokenURI(tokenId);

    const res = await fetch(url);
    const data = await res.json();
    console.log(data, info, url);
    setAvatar(data);
    setAvatarInfo(info);
    } catch(e)
    {
      console.error(e);
    }
  }

  useEffect(() => {
    // getAvatar();
  }, []);
  useEffect(() => {
    getAvatar();
  }, [readContracts, ownerAddress, tokenId]);

  if (avatar == null) return <>Please wait</>;

  return (
    <div style={{ maxWidth: 800, margin: "auto", marginTop: 5, paddingBottom: 25, lineHeight: 1.5 }}>
      <Card title={<Card.Meta title={<h2  onClick={()=>helpers.speak("WeAreMillions Spring Hackathon 2022")}>{avatar.description}</h2>} />}>
        <Card title={<h1 onClick={()=>helpers.speak(avatar.name)}>{avatar.name}</h1>} type="inner">
          <div style={{ background: "white", height: "30vmax", maxWidth: "100%", maxHeight: "250px" }}>
            <img src={avatar.image} style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "scale-down" }} />
          </div>

          {avatar.attributes.map((attribute, i) => (
            <Card.Grid key={"parent_" + i} style={{ maxHeight: "90px", minHeight: "70px" }}>
              <div style={{ lineHeight: "1.5rem" }} onClick={()=>helpers.speak(attribute.trait_type + "...." + attribute.value + " points")}>
                {attribute.trait_type}
                <br />
                {attribute.value}
              </div>

              <>{i % 5 == 4 && <br />}</>
            </Card.Grid>
          ))}

          <br />
        </Card>
      </Card>

      <Card title={<Card.Meta title={<h3></h3>} />}>
        <Card.Meta
          title={
            <>
              View WAM Avatar from {address} for tokenId: {tokenId}
            </>
          }
        />
      </Card>
    </div>
  );
}
