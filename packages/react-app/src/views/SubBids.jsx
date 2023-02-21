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

export function SubBids({ readContracts, writeContracts, tx, userSigner, address, smailMail, mainnetProvider }) {
  const [activeBids, setActiveBids] = useState([]);

  const getActiveBids = useCallback(async forAddress => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return;
    var activeBids = await readContracts.SwarmMail.getActiveBids(forAddress);
    console.log("activeBids", activeBids);
    getSubsRequestsFromActiveBids(activeBids);
  });
  const getSubsRequestsFromActiveBids = useCallback(async activeBids => {
    for (let i = 0; i < activeBids.length; i++) {
      let subReq = await readContracts.SwarmMail.getSubRequestByHash(activeBids[i].seller, activeBids[i].requestHash);
      let sub = await readContracts.SwarmMail.getSubBy(subReq.subHash);
      const subData = await downloadJsonFromBee(sub.swarmLocation);
      let activeBid = { activeBid: activeBids[i], subRequest: subReq, sub: sub, subData: subData };

      console.log("activeBid", activeBid);
      setActiveBids(activeBids => [...activeBids, activeBid]);
    }
  });
  /*
  const getSubRequests = useCallback(async forAddress => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return;
    var requests = await readContracts.SwarmMail.getSubRequests(forAddress);
    console.log("getSubRequests", requests);
    setSubRequests(requests);
    getSubsForSubRequests(requests);
  });
  const getSub = useCallback(async subHash => {
    return await readContracts.SwarmMail.getSubBy(subHash);
  });
  const getSubsForSubRequests = useCallback(async subRequests => {
    for (let i = 0; i < subRequests.length; i++) {
      let sub = await getSub(subRequests[i].subHash);
      console.log("sub", sub);
      setSubscriptions(subscriptions => [...subscriptions, sub]);
    }
  });*/
  useEffect(() => {
    getActiveBids(address);
  }, [address, readContracts]);

  const onRemoveActiveBid = async activeBid => {
    console.log("onDeleteActiveBid", activeBid);

    var tx = await writeContracts.SwarmMail.removeActiveBid(activeBid.seller, activeBid.requestHash);
    await tx.wait();
  };

  //const subscribers

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h3>Your bids</h3>
      <>Here are all active bids you made </>

      <Row>
        {activeBids.map((ab, i) => {
          return (
            <Card key={i} style={{ maxWidth: "30%", minWidth: "100px" }}>
              <div style={{ textAlign: "left", top: "-15px", position: "relative" }}>
                <Tooltip
                  title={
                    <>
                      {ab.subData.description}
                      <div>List price:{ethers.utils.formatEther(ab.sub.price)}⬨</div>
                    </>
                  }
                >
                  <strong>{ab.subData.title}</strong>
                </Tooltip>
              </div>
              <Tooltip
                title={
                  <>
                    Asking {ab.sub.seller} to access {ab.sub.title} for {ethers.utils.formatEther(ab.sub.price)}⬨
                    <br />
                    You can remove this bid if you want to and get back your escrowed funds.
                  </>
                }
              >
                <Button onClick={() => onRemoveActiveBid(ab.activeBid)}>Remove</Button>
              </Tooltip>
            </Card>
          );
        })}
      </Row>
    </div>
  );
}
