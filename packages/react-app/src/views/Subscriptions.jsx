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

export function Subscriptions({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  address,
  smailMail,
  mainnetProvider,
  setReplyTo,
}) {
  const [activeSubItems, setActiveSubItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const getSubItems = useCallback(async forAddress => {
    if (readContracts === undefined || readContracts.DataHub === undefined) return;
    var subItems = await readContracts.DataHub.getAllSubItems(forAddress);
    //console.log("getSubItems", subItems);
    getSubsItemDetails(subItems);
  });
  const getSubsItemDetails = useCallback(async subItems => {
    setIsLoading(true);
    for (let i = 0; i < subItems.length; i++) {
      let sub = await readContracts.DataHub.getSubBy(subItems[i].subHash);
      console.log("sub", sub);
      console.log("subItem", subItems[i]);
      var subData = await downloadJsonFromBee(sub.swarmLocation);
      var decData = {};

      if (subItems[i].unlockKeyLocation === consts.emptyBatchId) {
        decData.state = "Expired";
      } else {
        // Is it FairOS enc or NaCl enc?
        // decoding can fail if its fairos sharing
        try {
          var subKeyData = await downloadDataFromBee(subItems[i].unlockKeyLocation);
          var d = JSON.parse(new TextDecoder().decode(subKeyData));
          var decRes = EncDec.nacl_decrypt(d, smailMail.smail.substr(2, smailMail.smail.length));
          decData = JSON.parse(decRes);
        } catch (e) {
          console.error("error getSubsItemDetails ", e);
        }
      }

      var item = {};
      Object.assign(item, subItems[i]);
      item.sub = sub;
      item.data = subData;
      item.keyData = decData;

      console.log("getSubsItemDetails", item);
      setActiveSubItems(activeSubItems => [item, ...activeSubItems]);
    }
    setIsLoading(false);
  });

  useEffect(() => {
    getSubItems(address);
  }, [address, readContracts]);

  //console.log(smailMail);
  /*if (smailMail.smail === null)
    return (
      <>
        <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
          <h3>No key for decryption</h3>
          <Spin />
        </div>
      </>
    );
  */

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h1>Subscriptions</h1>
      <div className="routeSubtitle">View your subscriptions</div>
      {isLoading && <Spin />}
      {activeSubItems.length === 0 && (
        <Card>
          <h2>You have no subscriptions </h2>
        </Card>
      )}
      <div style={{ paddingLeft: "6px", paddingTop: "10px", paddingBottom: "10px" }}>
        <Row>
          {activeSubItems.map((ab, i) => {
            return (
              <Card key={i} style={{ maxWidth: "30%", minWidth: "100px" }}>
                <div style={{ textAlign: "left", top: "-15px", position: "relative" }}>
                  <Tooltip
                    title={
                      <>
                        {ab.data.description}
                        <br />
                        <br />
                        <Tooltip title={<AddressSimple address={ab.sub.seller} ensProvider={mainnetProvider} />}>
                          <a onClick={() => setReplyTo(ab.sub.seller)}>Contact seller</a>
                        </Tooltip>
                        <div>Bought for: {ethers.utils.formatEther(ab.data.price)}⬨</div>

                        <div>Expires: {new Date(parseInt(ab.validTill.toString()) * 1000).toString()}</div>

                        <br />
                        <div>{JSON.stringify(ab.keyData)}</div>
                      </>
                    }
                  >
                    <strong>{ab.data.title}</strong>
                  </Tooltip>
                </div>
                <div style={{ bottom: "5px", position: "absolute" }}>
                  <small>{ab.keyData.state}</small>
                </div>
              </Card>
            );
          })}
        </Row>
      </div>
    </div>
  );
}
