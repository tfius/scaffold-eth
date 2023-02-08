import React, { useState, useEffect, useCallback } from "react";

import { ethers } from "ethers";
import { Button, List, Card, Modal, notification, Tooltip, Typography, Spin, Checkbox } from "antd";
import { EnterOutlined, EditOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";

import { downloadDataFromBee } from "../Swarm/BeeService";
import * as consts from "./consts";
import * as EncDec from "../utils/EncDec.js";
import Blockies from "react-blockies";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { AddressSimple } from "../components";

import { uploadJsonToBee, uploadDataToBee } from "./../Swarm/BeeService";

// what is this?
// Displays categories and subscriptions
// Allows to list a subscription
// Allows to bid on a subscription
// Allows to sell a subscription - accept a bid

export function Marketplace({ readContracts, writeContracts, tx, userSigner, address, smailMail }) {
  const [listingFee, setListingFee] = useState(ethers.utils.parseEther("0.0001"));
  const [marketFee, setMarketFee] = useState(500); // 0.5% of the price
  const [categories, setCategories] = useState([]);
  const [openListSub, setOpenListSub] = useState(false);

  const getFees = useCallback(async () => {
    var listFee = await readContracts.SwarmMail.minListingFee();
    setListingFee(listFee.toString());
    var marketFee = await readContracts.SwarmMail.marketFee();
    setMarketFee(marketFee.toNumber() / 1000); // default 0.5% of the price
    console.log("marketFee", marketFee, "listingFee", listFee);
  });
  const getCategory = useCallback(async category => {
    var category = await readContracts.SwarmMail.getCategory(category);
    console.log("category", category);
    return category;
  });
  const getSub = useCallback(async subHash => {
    var sub = await readContracts.SwarmMail.getSubBy(subHash);
    console.log("sub", sub);
    return sub;
  });
  const getListedSubs = useCallback(async forAddress => {
    var listedSubs = await readContracts.SwarmMail.getListedSubscriptions(forAddress);
    console.log("getListedSubs", listedSubs);
  });
  const getSubRequests = useCallback(async forAddress => {
    var subRequests = await readContracts.SwarmMail.getSubRequests(forAddress);
    console.log("getSubRequests", subRequests);
  });
  const getSubItems = useCallback(async forAddress => {
    var subItems = await readContracts.SwarmMail.getSubItems(forAddress);
    console.log("getSubItems", subItems);
  });

  // data = json object { title, description, image, price, category, podIndex }
  const listSub = useCallback(async (fdpSellerAddress, data, price, category, podIndex) => {
    // upload data to swarm
    var dataLocation = await uploadJsonToBee(data);
    var newTx = await tx(
      writeContracts.SwarmMail.listSub(fdpSellerAddress, dataLocation, price, category, podIndex, {
        value: listingFee,
      }),
    );
    await newTx.wait();
  });
  const bidSub = useCallback(async (sub, fdpBuyer) => {
    var newTx = await tx(writeContracts.SwarmMail.bidSub(sub.subHash, fdpBuyer, { value: sub.price }));
    await newTx.wait();
  });

  // what is in unlockingData?
  // { podName, podIndex, .... }
  //
  const sellSub = useCallback(async (subRequest, unlockingData) => {
    // encrypt data for subRequest.buyer and upload data to swarm
    var encryptedKeyLocation = await EncDec.encryptAndUpload(unlockingData, subRequest.buyer);
    var newTx = await tx(writeContracts.SwarmMail.sellSub(subRequest.requestHash, encryptedKeyLocation));
    await newTx.wait();
  });

  useEffect(() => {
    getFees();
    getCategory("0x" + consts.emptyHash);
  }, [address]);
  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px" }}>
      <div>
        Market fee: {marketFee}% Listing fee: {ethers.utils.formatEther(listingFee)}
        <Button onClick={() => setOpenListSub(!openListSub)}>List Sub</Button>
      </div>
    </div>
  );
}
