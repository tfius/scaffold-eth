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

export function Subscriptions({ readContracts, writeContracts, tx, userSigner, address, smailMail, mainnetProvider }) {
  const [activeSubItems, setActiveSubItems] = useState([]);
  const getSubItems = useCallback(async forAddress => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return;
    var subItems = await readContracts.SwarmMail.getSubItems(forAddress);
    //console.log("getSubItems", subItems);
    getSubsItemDetails(subItems);
  });
  const getSubsItemDetails = useCallback(async subItems => {
    for (let i = 0; i < subItems.length; i++) {
      let sub = await readContracts.SwarmMail.getSubBy(subItems[i].subHash);
      var subData = await downloadJsonFromBee(sub.swarmLocation);
      var decData = {};
      //
      try {
        var subKeyData = await downloadDataFromBee(subItems[i].unlockKeyLocation);
        var d = JSON.parse(new TextDecoder().decode(subKeyData));
        var decRes = EncDec.nacl_decrypt(d, smailMail.smail.substr(2, smailMail.smail.length));
        var decData = JSON.parse(decRes);
      } catch (e) {
        console.log("error", e);
      }

      var item = {};
      Object.assign(item, subItems[i]);
      item.sub = sub;
      item.data = subData;
      item.keyData = decData;

      console.log("item", item);
      setActiveSubItems(activeSubItems => [...activeSubItems, item]);
    }
  });

  useEffect(() => {
    getSubItems(address);
  }, [address, readContracts]);

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
  };
  //   const onSellSubRequest = async subRequest => {
  //     console.log("onSellSubRequest", subRequest);
  //     var fdp = { podAddress: "", podIndex: 0 }; // TODO
  //     // get receiver pubKey encrypt key upload encrypted then sell sub
  //     let receiverPubKey = await getPubKeyFor(subRequest.buyer);
  //     let dataWithKey = { ref: consts.emptyHash, sender: address }; //, podAddress: fdp.podAddress, podIndex: sub.podIndex };
  //     var encryptedKeyLocation = await EncDec.encryptAndUpload(dataWithKey, receiverPubKey.pk);
  //     var tx = await writeContracts.SwarmMail.sellSub(subRequest.requestHash, "0x" + encryptedKeyLocation);
  //     await tx.wait();
  //   };
  //   const subscribers

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h3>Subscription</h3>
      <>Manage and see your subscriptions</>

      <Row>
        {activeSubItems.map((ab, i) => {
          return (
            <Card key={i} style={{ maxWidth: "30%", minWidth: "100px" }}>
              <div style={{ textAlign: "left", top: "-15px", position: "relative" }}>
                <Tooltip
                  title={
                    <>
                      {ab.data.description}
                      <div>List price:{ethers.utils.formatEther(ab.data.price)}⬨</div>

                      <div>{JSON.stringify(ab.keyData)}⬨</div>
                    </>
                  }
                >
                  <strong>{ab.data.title}</strong>
                </Tooltip>
              </div>
              <Tooltip
                title={
                  <>
                    Allow {ab.buyer} to access {ab.podIndex} for 30 days
                  </>
                }
              >
                {/* ⬨ */}
                {/* <Button onClick={() => onSellSubRequest(reqSub)}>Allow</Button> */}
              </Tooltip>
            </Card>
          );
        })}
      </Row>
    </div>
  );
}
