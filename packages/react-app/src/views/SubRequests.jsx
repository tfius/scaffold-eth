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
/*
 subRequest = { buyer: "0x257548B692371ed993Bd8EB0A49f4dA0d07515F0"
 fdpBuyer: "0x257548B692371ed993Bd8EB0A49f4dA0d07515F0"
 requestHash: "0x5ce7178fe1154649559f220a851c5bd619ad8760bad0179f26e27ab40e191b16"
 subHash: "0x6d68ebbd2a7a135d72d0f351ec2fbfa67ce11088aee386dfd0edfd3a130a9624"
*/

export function SubRequests({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  address,
  smailMail,
  mainnetProvider,
  sessionId,
}) {
  //const [subRequests, setSubRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reqSubSubscriptions, setReqSubSubscriptions] = useState([]);
  const getSubRequests = useCallback(async forAddress => {
    if (readContracts === undefined || readContracts.DataHub === undefined) return;
    setIsLoading(true);
    var requests = await readContracts.DataHub.getSubRequests(forAddress);
    console.log("getSubRequests", requests);
    //setSubRequests(requests);
    await getSubsForSubRequests(requests);
    setIsLoading(false);
  });
  const getSub = useCallback(async subHash => {
    return await readContracts.DataHub.getSubBy(subHash);
  });
  const getSubsForSubRequests = useCallback(async subRequests => {
    for (let i = 0; i < subRequests.length; i++) {
      let sub = await getSub(subRequests[i].subHash);
      const subData = await downloadJsonFromBee(sub.swarmLocation);
      var newReqSub = {};
      Object.assign(newReqSub, subRequests[i]);
      newReqSub.sub = sub;
      newReqSub.data = subData;

      console.log("sub", newReqSub);
      setReqSubSubscriptions(reqSubSubscriptions => [...reqSubSubscriptions, newReqSub]);
    }
  });
  useEffect(() => {
    getSubRequests(address);
  }, [address, readContracts]);

  /*
  const getPubKeyFor = async forAddress => {
    const data = await readContracts.SwarmMail.getPublicKeys(forAddress); // useContractReader(readContracts, "SwarmMail", "isAddressRegistered", [address]);
    if (data.registered == false) {
      notification.error({ message: "Receiver not registered", description: "You can only sell to registered users" });
      return;
    }
    const rkey = data.key.substr(2, data.key.length - 1);
    var pk = Buffer.from(rkey, "hex").toString("base64");
    var pkRegister = { pk: pk, registered: data.registered };
    console.log("pkRegister", pkRegister);
    return pkRegister;
  };*/

  const onSellSubRequest = async subRequest => {
    console.log("onSellSubRequest", subRequest);
    // var fdp = { podAddress: "", podIndex: 0 }; // TODO
    // get receiver pubKey encrypt key upload encrypted then sell sub
    // let receiverPubKey = await getPubKeyFor(subRequest.buyer);
    /*
    type ShareInfo struct {
      PodName     string `json:"podName"`
      Address     string `json:"podAddress"`
      Password    string `json:"password"`
      UserAddress string `json:"userAddress"`
     }*/
    // let dataWithKey = { ref: consts.emptyHash, sender: address }; //, podAddress: fdp.podAddress, podIndex: sub.podIndex };

    // var encryptedKeyLocationOld = await EncDec.encryptAndUpload(dataWithKey, receiverPubKey.pk);
    // debugger;

    if (sessionId === null) {
      notification.error({ message: "Session not started", description: "You need to start a FairOS session first" });
      return;
    }

    // var subscriberNameHash = await window.getNameHash(sessionId, subRequest.buyer);
    var encryptedKeyLocation = await window.encryptSubscription(
      sessionId,
      subRequest.data.podName,
      subRequest.fdpBuyerNameHash,
      //"0x" + subscriberNameHash.namehash,
    );
    // debugger;
    // window.encryptSubscription

    try {
      var tx = await writeContracts.DataHub.sellSub(subRequest.requestHash, "0x" + encryptedKeyLocation.reference);
      await tx.wait();
      // remove subRequest from
      setReqSubSubscriptions(reqSubSubscriptions.filter(reqSub => reqSub.requestHash !== subRequest.requestHash));
    } catch (e) {
      notification.error({ message: "Transaction Failed", description: "Rejected " + e.message });
    }
  };

  //const subscribers

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h1>Subscription requests</h1>
      <div className="routeSubtitle">All requests to access your listings</div>

      <div style={{ paddingLeft: "6px", paddingTop: "10px", paddingBottom: "10px" }}>
        {isLoading && <Spin />}
        {reqSubSubscriptions.length === 0 && <h4>You have no requests</h4>}

        <Row>
          {reqSubSubscriptions.map((reqSub, i) => {
            return (
              <Card key={i} style={{ maxWidth: "30%", minWidth: "100px" }}>
                <div style={{ textAlign: "left", top: "-15px", position: "relative" }}>
                  <Tooltip
                    title={
                      <>
                        {reqSub.data.description}
                        <div>List price:{ethers.utils.formatEther(reqSub.data.price)}⬨</div>
                      </>
                    }
                  >
                    <strong>{reqSub.data.title}</strong>
                  </Tooltip>
                </div>
                <Tooltip
                  title={
                    <>
                      Allow <AddressSimple address={reqSub.buyer} ensProvider={mainnetProvider} />
                      <br />
                      to access pod
                      <br />
                      <strong>{reqSub.data.podName}</strong>
                      <br />
                      for 30 days
                    </>
                  }
                >
                  {/* ⬨ */}
                  <Button onClick={() => onSellSubRequest(reqSub)}>Allow</Button>
                </Tooltip>
              </Card>
            );
          })}
        </Row>
      </div>
    </div>
  );
}
