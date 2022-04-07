import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useHistory } from "react-router-dom";
import { Button, Card, Input, Tooltip } from "antd";
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


  useEffect(() => {}, []);

  return (
    <div style={{ maxWidth: 800, margin: "auto", marginTop: 5, paddingBottom: 25, lineHeight: 1.5 }}>
      <Card
        title={
          <>
            view Avatar from {address} for tokenId: {tokenId}
          </>
        }
      >

      </Card>
    </div>
  );
}
