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
  Switch,
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
  const [isLoading, setIsLoading] = useState(false);
  const [activeBids, setActiveBids] = useState([]);
  const [viewServed, setViewServed] = useState(false);

  const getActiveBids = useCallback(async forAddress => {
    if (readContracts === undefined || readContracts.DataHub === undefined) return;
    setIsLoading(true);
    var activeBids = await readContracts.DataHub.getActiveBids(forAddress);
    console.log("activeBids", activeBids);
    await getSubsRequestsFromActiveBids(activeBids);
    setIsLoading(false);
  });
  const getSubsRequestsFromActiveBids = useCallback(async activeBids => {
    for (let i = 0; i < activeBids.length; i++) {
      try {
        // console.log("getSubsRequestsFromActiveBids", activeBids[i]);
        // getActiveBidsByHash
        let subReq = await readContracts.DataHub.getSubRequestByHash(activeBids[i].seller, activeBids[i].requestHash);
        let sub = await readContracts.DataHub.getSubBy(subReq.subHash);
        const subData = await downloadJsonFromBee(sub.swarmLocation);
        let activeBid = { activeBid: activeBids[i], subRequest: subReq, sub: sub, subData: subData };

        console.log("activeBid", activeBid);
        setActiveBids(activeBids => [...activeBids, activeBid]);
      } catch (e) {
        console.log("error", e);
      }
    }
  });
  useEffect(() => {
    getActiveBids(address);
  }, [address, readContracts]);

  const onRemoveActiveBid = async activeBid => {
    //console.log("onDeleteActiveBid", activeBid);

    try {
      var tx = await writeContracts.DataHub.removeUserActiveBid(activeBid.requestHash);
      await tx.wait();
    } catch (e) {
      notification.error({
        message: "Error",
        description: e.message,
      });
    }
  };

  const toggleViewServed = isChecked => {
    setViewServed(isChecked);
    if (isChecked) {
      // maybe something ?
      //
    }
  };

  const viewActiveBids = activeBids.filter(r => r.activeBid.served === viewServed);

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h1>Your bids</h1>
      <div className="routeSubtitle">All your active access requests</div>

      <div style={{ paddingLeft: "6px", paddingTop: "10px", paddingBottom: "10px" }}>
        {isLoading && <Spin />}
        <div className="paginationInfo" style={{ marginTop: "-35px" }}>
          Waiting <Switch checked={viewServed} onChange={toggleViewServed} /> Active
        </div>
        {activeBids.length === 0 && (
          <Card>
            <h2>You have no active requests.</h2>
          </Card>
        )}
        <Row>
          {viewActiveBids.map((ab, i) => {
            return (
              <Card key={i} style={{ maxWidth: "30%", minWidth: "100px" }}>
                <div style={{ textAlign: "left", top: "-15px", position: "relative" }}>
                  <Tooltip
                    title={
                      <>
                        {ab.subData.description} <hr />
                        Access to pod <strong> {ab.subData.podName}</strong> <br />
                        For <strong>{ethers.utils.formatEther(ab.sub.price)}</strong>⬨
                        {/* <div>List price:{ethers.utils.formatEther(ab.sub.price)}⬨</div> */}
                      </>
                    }
                  >
                    <h3>{ab.subData.title}</h3>
                  </Tooltip>
                </div>
                {ab.activeBid.served === false ? (
                  <Tooltip
                    title={
                      <>
                        You are requesting to access <strong> {ab.subData.title}</strong> <br />
                        Pod <strong> {ab.subData.podName}</strong>
                        <br />
                        For <strong>{ethers.utils.formatEther(ab.sub.price)}</strong>⬨
                        <br />
                        from <AddressSimple address={ab.sub.seller} ensProvider={mainnetProvider} /> <br />
                        <br />
                        You can remove this bid if you want to and get back your escrowed funds.
                      </>
                    }
                  >
                    <Button onClick={() => onRemoveActiveBid(ab.activeBid)}>Remove</Button>
                  </Tooltip>
                ) : (
                  <Tooltip title="This request has been served. You can resubscribe after expiration">
                    <h4>Active</h4>
                  </Tooltip>
                )}
              </Card>
            );
          })}
        </Row>
      </div>
    </div>
  );
}
