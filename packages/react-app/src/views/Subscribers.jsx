import React, { useState, useEffect, useCallback } from "react";

import { BigNumber, ethers } from "ethers";
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
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [subTitle, setSubTitle] = useState("");
  const [viewSubscribers, setViewSubscribers] = useState(false);

  const getListedSubs = useCallback(async forAddress => {
    var listedSubs = await readContracts.SwarmMail.getListedSubs(forAddress);
    console.log("listedSubs", listedSubs);
    getSubsForSubRequests(listedSubs);
  });
  const getSub = useCallback(async subHash => {
    return await readContracts.SwarmMail.getSubBy(subHash);
  });
  const getSubscribers = useCallback(async (subHash, subscribers) => {
    var subscribersBalance = [];
    setSubscribers([]);
    setViewSubscribers(true);
    for (let i = 0; i < subscribers.length; i++) {
      var subscriberBalance = await readContracts.SwarmMail.getSubInfoBalance(subHash, subscribers[i]);
      var subscriber = { address: subscribers[i], balance: subscriberBalance };
      setSubscribers(subscribers => [...subscribers, subscriber]);
    }
  });
  const getSubsForSubRequests = useCallback(async subHashes => {
    let earned = BigNumber.from("0");
    for (let i = 0; i < subHashes.length; i++) {
      let subSubscribers = await readContracts.SwarmMail.getSubSubscribers(subHashes[i]);
      console.log("subSubscribers", subSubscribers);
      const sub = await getSub(subHashes[i]);
      const subData = await downloadJsonFromBee(sub.swarmLocation);
      var newSub = {};
      Object.assign(newSub, sub);
      newSub.subscribers = subSubscribers;
      newSub.data = subData;

      console.log("sub", newSub);
      earned = earned.add(sub.earned);
      console.log("earned", earned.toString());
      setSubscriptions(subscriptions => [...subscriptions, newSub]);
    }
    setTotalEarnings(earned);
  });
  const disableEnableSub = useCallback(async (subHash, newState) => {
    var tx = await writeContracts.SwarmMail.enableSub(subHash, newState);
    await tx.wait();
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
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "10px" }}>
      <h3>Subscribers</h3>
      <>Manage your listed subs and subscribers</> <br />
      <>{subscriptions.length} listing. </>
      <>Total earnings: {ethers.utils.formatEther(totalEarnings)}⬨</>
      <Row>
        <Modal
          style={{ width: "80%", resize: "auto", borderRadious: "20px" }}
          title={
            <>
              <h3>{subTitle}</h3>Subscribers
            </>
          }
          footer={null}
          visible={viewSubscribers}
          //   maskClosable={false}
          onOk={() => {
            //setModal(null);
          }}
          onCancel={() => {
            setViewSubscribers(false);
          }}
        >
          {subscribers.map((subscriber, i) => {
            return (
              <div key={"subscriber" + i}>
                <AddressSimple address={subscriber.address} ensProvider={mainnetProvider} />{" "}
                {ethers.utils.formatEther(subscriber.balance)}⬨
              </div>
            );
          })}
        </Modal>
        {subscriptions.map((sub, i) => {
          return (
            <Card key={i} style={{ maxWidth: "30%", minWidth: "100px" }}>
              <div>
                <Tooltip title={sub.data.description}>
                  <strong>{sub.data.title}</strong>
                </Tooltip>
                <br />
                <small>
                  <Tooltip title={"View subscribers and earnings per subscriber for this listing"}>
                    <a
                      onClick={() => {
                        getSubscribers(sub.subHash, sub.subscribers);
                        setSubTitle(sub.data.title);
                      }}
                    >
                      Subscribers: {sub.subscribers.length.toString()}
                    </a>
                  </Tooltip>
                  <div>List price:{ethers.utils.formatEther(sub.data.price)}⬨</div>
                  <Tooltip title={sub.data.description}>
                    <div>Earned:{ethers.utils.formatEther(sub.earned)}⬨</div>
                  </Tooltip>
                  <Tooltip
                    title={
                      <div>
                        Reported: {sub.reports} <br />
                        PodIndex: {sub.podIndex} <br />
                      </div>
                    }
                  >
                    <div>
                      Sold: {sub.sells} Bids: {sub.bids}
                    </div>
                  </Tooltip>
                  <br />
                  <Tooltip title={sub.active ? "Disable listing" : "Enable listing"}>
                    <a onClick={() => disableEnableSub(sub.subHash, !sub.active)}>
                      {sub.active ? "Active" : "Disabled"}
                    </a>
                  </Tooltip>
                </small>
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
