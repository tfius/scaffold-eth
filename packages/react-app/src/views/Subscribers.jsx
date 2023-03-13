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
//import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { PieChart, Pie, Sector, Cell, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";

import { downloadDataFromBee, downloadJsonFromBee } from "../Swarm/BeeService";
import * as consts from "./consts";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { AddressSimple } from "../components";

import { uploadJsonToBee, uploadDataToBee } from "./../Swarm/BeeService";
import { categoryList } from "./categories";

const data01 = [
  { name: "Group A", value: 400 },
  { name: "Group B", value: 300 },
  { name: "Group C", value: 300 },
  { name: "Group D", value: 200 },
];
const data02 = [
  { name: "A1", value: 100 },
  { name: "A2", value: 300 },
  { name: "B1", value: 100 },
  { name: "B2", value: 80 },
  { name: "B3", value: 40 },
  { name: "B4", value: 30 },
  { name: "B5", value: 50 },
  { name: "C1", value: 100 },
  { name: "C2", value: 200 },
  { name: "D1", value: 150 },
  { name: "D2", value: 50 },
];

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
  const getSubscribers = async (subHash, subscribers) => {
    setSubscribers([]);
    setViewSubscribers(true);
    for (let i = 0; i < subscribers.length; i++) {
      var subscriberBalance = await readContracts.SwarmMail.getSubInfoBalance(subHash, subscribers[i]);
      var subscriber = {
        name: subscribers[i],
        balance: ethers.utils.formatEther(subscriberBalance),
        value: subscriberBalance.div(10000000000).toNumber(),
      };
      setSubscribers(subscribers => [...subscribers, subscriber]);
    }
  };
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

  const disableEnableSub = async (sub, subHash, newState) => {
    var tx = await writeContracts.SwarmMail.enableSub(subHash, newState);
    await tx.wait();
  };

  useEffect(() => {
    if (readContracts === undefined || address === undefined) return;
    getListedSubs(address);
  }, [address, readContracts]);

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h1>Subscribers</h1>
      <div className="routeSubtitle">
        Manage {subscriptions.length} listings and subscribers. Total earnings:{" "}
        {ethers.utils.formatEther(totalEarnings)}⬨
      </div>

      <div style={{ paddingLeft: "6px", paddingTop: "10px", paddingBottom: "10px" }}>
        <Row>
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
                    <Tooltip title={sub.active ? "Disable listing" : "Enable listing"}>
                      <a onClick={() => disableEnableSub(sub, sub.subHash, !sub.active)}>
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
        <>
          <div height="100px">
            {/* https://recharts.org/en-US/examples/TwoSimplePieChart */}
            <PieChart width={400} height={110}>
              <Pie
                dataKey="value"
                startAngle={180}
                endAngle={0}
                data={subscribers}
                cx="50%"
                cy="100%"
                outerRadius={70}
                fill="#8884d8"
                label
              />
              <ReTooltip />
            </PieChart>
            {/* <ResponsiveContainer width="100%" height="100%"> */}
            {/* <PieChart width={400} height={400}>
                  <Pie data={data01} dataKey="value" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" />
                  <Pie
                    data={data02}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    fill="#82ca9d"
                    label
                  />
                </PieChart> */}
            {/* </ResponsiveContainer> */}
          </div>
          {subscribers.map((subscriber, i) => {
            return (
              <div key={"subscriber" + i}>
                <AddressSimple address={subscriber.name} ensProvider={mainnetProvider} /> {subscriber.balance}⬨
              </div>
            );
          })}
        </>
      </Modal>
    </div>
  );
}
