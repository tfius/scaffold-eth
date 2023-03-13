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
  Menu,
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
import { categoriesTree, categoryList } from "./categories";



function getMenuItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

// what is this?
// Displays categories and subscriptions
// Allows to list a subscription
// Allows to bid on a subscription
// Allows to sell a subscription - accept a bid

export function Marketplace({ readContracts, writeContracts, tx, userSigner, address, smailMail, mainnetProvider }) {
  const [menuItems, setMenuItems] = useState([]);
  const [listingFee, setListingFee] = useState(ethers.utils.parseEther("0.0001"));
  const [marketFee, setMarketFee] = useState(0); // 0.5% of the price
  const [inEscrow, setInEscrow] = useState(0);
  const [contractBalance, setContractBalance] = useState(0);
  const [feesCollected, setFeesCollected] = useState(0);
  const [categories, setCategories] = useState(categoryList);
  const [subscriptions, setSubscriptions] = useState([]);
  const [openListSub, setOpenListSub] = useState(false);
  const placeholderImage = "/logo512.png";

  const getFees = useCallback(async () => {
    if (readContracts === undefined || readContracts.SwarmMail === undefined) return;
    var listFee = await readContracts.SwarmMail.minListingFee();
    setListingFee(listFee.toString());
    var marketFee = await readContracts.SwarmMail.marketFee();
    setMarketFee(marketFee.toNumber() / 1000); // default 0.5% of the price
    var balanceInContract = await readContracts.SwarmMail.fundsBalance();
    setContractBalance(balanceInContract.toString());
    var balanceInEscrow = await readContracts.SwarmMail.inEscrow();
    setInEscrow(balanceInEscrow.toString());
    var fees = await readContracts.SwarmMail.feesCollected();
    setFeesCollected(fees.toString());
    //console.log("marketFee", marketFee, "listingFee", listFee);
  });
  const getCategory = useCallback(async categoryHash => {
    var category = await readContracts.SwarmMail.getCategory(categoryHash);
    //console.log("category", category);
    return category;
  });
  const getSub = useCallback(async subId => {
    var sub = await readContracts.SwarmMail.getSubByIndex(subId);
    //console.log("sub", sub);
    return sub;
  });
  // A modal with form to collect data for listing a subscription
  // data = json object { title, description, image, price, category, podIndex }
  const listSubTx = useCallback(async (fdpSellerNameHash, data, price, category, podAddress) => {
    // upload data to swarm
    try {
      var dataLocation = await uploadDataToBee(JSON.stringify(data), "application/json", Date.now() + ".sub.json");
      console.log("dataLocation", dataLocation);
      var newTx = await tx(
        writeContracts.SwarmMail.listSub(fdpSellerNameHash, "0x" + dataLocation, price, category, podAddress, 10, {
          value: listingFee,
        }),
      );
      await newTx.wait();
      // tx(create, (update) => {
      //   if(išdate && update.status === confirmed || update.status === failed) {
      //   }
      // })
    } catch (e) {
      console.log(e);
      notification.error({
        message: "Error listing subscription",
        description: "You can only list one subscription for a pod.",
      });
    }
  });
  const bidSubTx = useCallback(async (subscription, fdpBuyerNameHash) => {
    var newTx = await tx(
      writeContracts.SwarmMail.bidSub(subscription.subHash, fdpBuyerNameHash, { value: subscription.priceInWei }),
    );
    await newTx.wait();
  });

  // what is in unlockingData?
  // { podName, podIndex, .... }
  //
  // const sellSub = useCallback(async (subRequest, unlockingData) => {
  //   // encrypt data for subRequest.buyer and upload data to swarm
  //   var encryptedKeyLocation = await EncDec.encryptAndUpload(unlockingData, subRequest.buyer);
  //   var newTx = await tx(writeContracts.SwarmMail.sellSub(subRequest.requestHash, encryptedKeyLocation));
  //   await newTx.wait();
  // });

  const onListSub = async values => {
    console.log("onListSub", values);
    //var fdpSellerNameHash = "0x" + consts.emptyHash;
    await listSubTx(values.fdpSellerNameHash, values, values.price, values.category, values.podAddress);
    setOpenListSub(false);
  };

  const onBidSub = async subscription => {
    console.log("onBidSub", subscription);
    // address is fdpBuyerNameHash
    var fdpBuyerNameHash = "0x" + consts.emptyHash;
    await bidSubTx(subscription, fdpBuyerNameHash); // TODO this must be FDPbuyer address not METAMASK address
  };

  const onCategoryChange = async values => {
    console.log("onCategoryChange", values);
    setSubscriptions(subscriptions => []);
    let listedCategories = [];
    for (var i = 0; i < values.length; i++) {
      var cat = await getCategory(values[i]);
      for (var subId = 0; subId < cat.subIdxs.length; subId++) {
        try {
          var sub = await getSub(cat.subIdxs[subId]); // getting by index is different than getting by hash
          // console.log("sub", sub);
          //if (sub.active === false) continue; // ignore non active subs

          var subData = await downloadDataFromBee(sub.swarmLocation);
          var subscription = JSON.parse(new TextDecoder().decode(subData));
          //console.log("subscription", subscription);

          subscription.seller = sub.seller;
          subscription.active = sub.active;
          subscription.fdpSellerNameHash = sub.fdpSellerNameHash;
          subscription.price = ethers.utils.formatEther(sub.price).toString();
          subscription.priceInWei = sub.price.toString();
          subscription.bids = sub.bids.toString();
          subscription.sells = sub.sells.toString();
          subscription.reports = sub.reports.toString();
          subscription.swarmLocation = sub.swarmLocation;
          subscription.subHash = sub.subHash;
          subscription.daysValid = sub.daysValid;
          subscription.category = categories.find(x => x.value == values[i])?.label;

          subscription.dataPodName = subscription.podName;
          subscription.dataPodAddress = subscription.podAddress;

          console.log("subscription", subscription);
          setSubscriptions(subscriptions => [...subscriptions, subscription]);
        } catch (e) {
          console.log(e);
        }
      }
      listedCategories.push(cat);
    }
    console.log("listedCategories", listedCategories);
  };
  const onMenuClick = async e => {
    console.log("onMenuClick", e);
  };

  useEffect(() => {
    //calcCategories();
    getFees();
    //getCategory("0x" + consts.emptyHash);
  }, [address]);

  useEffect(() => {
    var flattened = [];
    var mItems = [];
    function flatten(data, outputArray, root, itemsArray, parentItem) {
      var prevRoot = root;
      for (var i = 0; i < data.length; i++) {
        var itemName = root + data[i].label;
        var itemHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(itemName)).toString(); // ie a category hash
        outputArray.push({ label: itemName, value: itemHash });

        var item = getMenuItem(data[i].label, itemHash, null, []);
        //console.log("item", itemName, item.key);
        if (parentItem !== undefined) {
          parentItem.children.push(item);
        } else {
          itemsArray.push(item);
        }

        if (data[i].items !== undefined) {
          flatten(data[i].items, outputArray, prevRoot + data[i].label + "/", itemsArray, item);
        } else item.children = undefined;
      }
      root = prevRoot;
    }
    flatten(categoriesTree, flattened, "", mItems, undefined);
    // console.log("flattened", flattened);
    setMenuItems(mItems);
    setCategories(flattened);
    //
  }, []);
  const onImageError = e => {
    e.target.src = window.location.origin + placeholderImage;
  };
  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <div>
        <Button onClick={() => setOpenListSub(!openListSub)}>List Data</Button> &nbsp;
        <small>
          Market fee: {marketFee}% &nbsp;Listing fee: {ethers.utils.formatEther(listingFee)}⬨ &nbsp;Escrowed:&nbsp;
          {ethers.utils.formatEther(inEscrow)}⬨&nbsp; Funds: {ethers.utils.formatEther(contractBalance)}⬨ &nbsp;
          Collected: {ethers.utils.formatEther(feesCollected)}⬨
        </small>
      </div>
      <br />
      <Select
        placeholder="Please select category"
        //defaultValue="General"
        onChange={onCategoryChange}
        options={categories}
        style={{ width: "99%" }}
        mode="multiple"
        allowClear
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) => option?.label.toLowerCase().indexOf(input.toLowerCase()) >= 0}
      />
      <Modal
        title="List Subscription"
        visible={openListSub}
        footer={null}
        onOk={() => setOpenListSub(false)}
        onCancel={() => setOpenListSub(false)}
      >
        <ListSubModalForm listSub={onListSub} categories={categories} />
      </Modal>
      {/* <div style={{ float: "left" }}>
        <Menu style={{ width: "256px" }} mode="vertical" items={menuItems} onClick={onMenuClick} />
      </div> */}
      <div>
        <Row>
          {subscriptions.map((sub, i) => {
            return (
              <Card
                key={i}
                style={{ width: "26%", maxWidth: "400px", minWidth: "256px", maxHeight: "200px" }}
                hoverable
              >
                <img className="podItemLogoImage" src={sub.imageUrl} alt="image" onError={onImageError} />
                <div key={i}>
                  <div style={{ textAlign: "left", top: "-15px", position: "relative" }}>
                    <small>
                      <Tooltip
                        title={
                          <>
                            <h3>{sub.category}</h3>
                            Category
                            <br />
                            <div>
                              Pod: {sub.dataPodName} <br />
                              PodAddress: {sub.dataPodAddress} <br />
                            </div>
                            <div>
                              <br />
                            </div>
                          </>
                        }
                      >
                        <span>{sub.category}</span>
                      </Tooltip>

                      <Tooltip
                        title={
                          <>
                            <h3>Stats</h3>
                            Bids: <strong>{sub.bids}</strong> Sells <strong>{sub.sells}</strong> Report{" "}
                            <strong>{sub.reports}</strong>
                          </>
                        }
                      >
                        &nbsp;<span>♡</span>
                      </Tooltip>
                      <Tooltip
                        title={
                          <>
                            <h3>User info</h3>
                            Seller: <AddressSimple address={sub.seller} ensProvider={mainnetProvider} /> <br />
                            FDP Seller NameHash: {sub.fdpSellerNameHash}
                            <br />
                          </>
                        }
                      >
                        &nbsp;<span>ⓘ</span>
                      </Tooltip>
                    </small>
                  </div>
                  <Tooltip
                    overlayStyle={{ maxWidth: "60%" }}
                    title={
                      <>
                        <div style={{ minWidth: "450px" }}>
                          <h3>{sub.title}</h3>
                        </div>
                        <img
                          src={sub.imageUrl}
                          style={{ width: "100%", maxHeight: "200px" }}
                          alt={sub.title + "image"}
                          onError={onImageError}
                        />
                        <br />
                        <MarkdownPreview
                          source={sub.description}
                          style={{ backgroundColor: "transparent", color: "inherit" }}
                          darkMode={true}
                          wrapperElement={{
                            "data-color-mode": "dark",
                          }}
                        />
                      </>
                    }
                  >
                    <h3 style={{ width: "100%", overflow: "hidden", top: "-6px", position: "relative" }}>
                      {sub.title}
                    </h3>
                  </Tooltip>

                  <div
                    style={{ width: "100%", maxHeight: "200px", top: "-6px", position: "relative", overflow: "hidden" }}
                  ></div>

                  <br />
                  <div style={{ bottom: "5px", position: "absolute" }}>
                    {sub.active ? (
                      <Tooltip
                        title={
                          <>
                            Request to subscribe for {sub.price}⬨ for {sub.daysValid.toString()} days
                          </>
                        }
                      >
                        <Button onClick={() => onBidSub(sub)}>{sub.price} ⬨</Button>
                      </Tooltip>
                    ) : (
                      <>Not active</>
                    )}
                  </div>
                </div>
                <Skeleton loading={false} />
              </Card>
            );
          })}
        </Row>
      </div>
    </div>
  );
}

import * as layouts from "./layouts.js";
export function ListSubModalForm({ listSub, categories }) {
  // const formRef = React.createRef();
  const onSendListBub = values => {
    listSub(values);
    console.log("onSend", values);
  };
  const onListSubCategoryChange = value => {
    console.log("onCategoryChange", value);
  };
  const required = [{ required: true }];

  return (
    <Form {...layouts.layout} onFinish={onSendListBub}>
      <Form.Item name="title" label="Title" rules={required}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Description" rules={required}>
        <Input.TextArea maxLength={1024} rows={3} autosize={{ minRows: "3", maxRows: "5" }} />
      </Form.Item>
      <Form.Item name="imageUrl" label="Image">
        <Input />
      </Form.Item>
      <Form.Item name="price" label="Price" rules={required}>
        <Input />
      </Form.Item>
      <Form.Item name="category" label="Category" rules={required}>
        <Select onChange={onListSubCategoryChange} options={categories} />
      </Form.Item>
      <Form.Item name="fdpSellerNameHash" label="FDP NameHash" rules={required}>
        <Input />
      </Form.Item>
      <Form.Item name="podName" label="Pod name" rules={required}>
        <Input />
      </Form.Item>
      <Form.Item name="podAddress" label="Pod Address" rules={required}>
        <Input />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        style={{ width: "80%", borderRadius: "5px", alignItems: "center", left: "10%" }}
      >
        LIST POD
      </Button>
    </Form>
  );
}

// podList -> podName
// podStat -> podAddress
// getUserHash(username) -> get user NameHash
// getUseranem(nameHash) -> imposible
