import React, { useState, useEffect, useCallback } from "react";

import { ethers } from "ethers";
import {
  Button,
  List,
  Card,
  Modal,
  notification,
  Tooltip,
  Typography,
  Spin,
  Checkbox,
  Form,
  Input,
  Select,
  Skeleton,
  Row,
  Col,
} from "antd";
import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";

import { downloadDataFromBee, downloadJsonFromBee } from "../Swarm/BeeService";
import * as consts from "./consts";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { AddressSimple } from "../components";

import { uploadJsonToBee, uploadDataToBee } from "./../Swarm/BeeService";
import { categoryList } from "./categories";

// displays the list of subscribers for a given address
export function Subscribers({ readContracts, writeContracts, tx, userSigner, address, smailMail, mainnetProvider }) {
  const [subscribers, setSubscribers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subRequests, setSubRequests] = useState([]);

  const getListedSubs = useCallback(async forAddress => {
    var listedSubs = await readContracts.SwarmMail.getListedSubs(forAddress);
    console.log("listedSubs", listedSubs);
    getSubsForSubRequests(listedSubs);
  });
  const getSub = useCallback(async subHash => {
    return await readContracts.SwarmMail.getSubBy(subHash);
  });
  const getSubsForSubRequests = useCallback(async subHashes => {
    for (let i = 0; i < subHashes.length; i++) {
      let subSubscribers = await readContracts.SwarmMail.getSubSubscribers(subHashes[i]);
      console.log("subSubscribers", subSubscribers);
      const sub = await getSub(subHashes[i]);
      var newSub = {};
      Object.assign(newSub, sub);
      newSub.subscribers = subSubscribers;

      console.log("sub", newSub);
      setSubscriptions(subscriptions => [...subscriptions, newSub]);
    }
  });
  useEffect(() => {
    if (readContracts === undefined) return;
    getListedSubs(address);
  }, [address, readContracts]);

  //   const onSellSubRequest = async subRequest => {
  //     console.log("onSellSubRequest", subRequest);
  //     // get receiver pubKey encrypt key upload encrypted then sell sub
  //     let receiverPubKey = await getPubKeyFor(subRequest.buyer);
  //     let dataWithKey = { ref: consts.emptyHash, sender: address };
  //     var encryptedKeyLocation = await EncDec.encryptAndUpload(dataWithKey, receiverPubKey.pk);
  //     var tx = await writeContracts.SwarmMail.sellSub(subRequest.requestHash, "0x" + encryptedKeyLocation);
  //     await tx.wait();
  //   };

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px" }}>
      <h3>Subscribers</h3>
      <>Manage your listed subs and subscribers</>

      <Row>
        {subRequests.map((subRequest, i) => {
          return (
            <Card key={i} style={{ maxWidth: "33%", minWidth: "100px" }}>
              <div style={{ textAlign: "left", top: "-15px", position: "relative" }}>
                <small></small>
              </div>
              {/* <Tooltip
                title={
                  <>
                    Allow {subRequest.buyer} to access {subRequest.podIndex} for 30 days
                  </>
                }
              >
                <Button onClick={() => onSellSubRequest(subRequest)}>⬨</Button>
              </Tooltip> */}
            </Card>
          );
        })}
      </Row>
    </div>
  );
}
