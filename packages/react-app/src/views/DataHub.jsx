import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useHistory } from "react-router-dom";

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

import { uploadJsonToBee, uploadDataToBee } from "../Swarm/BeeService";
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

export function DataHub({
  readContracts,
  writeContracts,
  tx,
  userSigner,
  address,
  smailMail,
  mainnetProvider,
  fairOSLogin,
}) {
  const [menuItems, setMenuItems] = useState([]);
  const [listingFee, setListingFee] = useState(ethers.utils.parseEther("0.0001"));
  const [marketFee, setMarketFee] = useState(0); // 0.5% of the price
  const [inEscrow, setInEscrow] = useState(0);
  const [contractBalance, setContractBalance] = useState(0);
  const [feesCollected, setFeesCollected] = useState(0);
  const [categories, setCategories] = useState(categoryList);
  const [subscriptions, setSubscriptions] = useState([]);
  const [openListSub, setOpenListSub] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const placeholderImage = "/logo512.png";
  const [viewDetailForSub, setViewDetailForSub] = useState(null);

  const history = useHistory();
  let { cat, sub } = useParams();
  console.log("params", cat, sub);

  const getFees = useCallback(async () => {
    if (readContracts === undefined || readContracts.DataHub === undefined) return;
    var listFee = await readContracts.DataHub.minListingFee();
    setListingFee(listFee.toString());
    var marketFee = await readContracts.DataHub.marketFee();
    setMarketFee(marketFee.toNumber() / 1000); // default 0.5% of the price
    var balanceInContract = await readContracts.DataHub.fundsBalance();
    setContractBalance(balanceInContract.toString());
    var balanceInEscrow = await readContracts.DataHub.inEscrow();
    setInEscrow(balanceInEscrow.toString());
    var fees = await readContracts.DataHub.feesCollected();
    setFeesCollected(fees.toString());
    //console.log("marketFee", marketFee, "listingFee", listFee);
  });
  const getCategory = useCallback(async categoryHash => {
    var category = await readContracts.DataHub.getCategory(categoryHash);
    //console.log("category", category);
    return category;
  });
  const getSub = useCallback(async subId => {
    var sub = await readContracts.DataHub.getSubByIndex(subId);
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
        writeContracts.DataHub.listSub(fdpSellerNameHash, "0x" + dataLocation, price, category, podAddress, 10, {
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
    try {
      var newTx = await tx(
        writeContracts.DataHub.bidSub(subscription.subHash, fdpBuyerNameHash, { value: subscription.priceInWei }),
      );
      await newTx.wait();
    } catch (e) {
      console.log(e);
      notification.error({
        message: "Error requesting access to subscription",
        description: "Maybe you already have an open request to this subscription ?" + e.message,
      });
    }
  });

  // what is in unlockingData?
  // { podName, podIndex, .... }
  //
  // const sellSub = useCallback(async (subRequest, unlockingData) => {
  //   // encrypt data for subRequest.buyer and upload data to swarm
  //   var encryptedKeyLocation = await EncDec.encryptAndUpload(unlockingData, subRequest.buyer);
  //   var newTx = await tx(writeContracts.DataHub.sellSub(subRequest.requestHash, encryptedKeyLocation));
  //   await newTx.wait();
  // });

  const onListSub = async values => {
    if (fairOSLogin === null) {
      notification.error({
        message: "Error listing subscription",
        description: "You must be logged in to FairOS to list a subscription.",
      });
      return;
    }

    console.log("onListSub", values);
    //var fdpSellerNameHash = "0x" + consts.emptyHash;
    await listSubTx(values.fdpSellerNameHash, values, values.price, values.category, values.podAddress);
    setOpenListSub(false);
  };

  const onBidSub = async subscription => {
    if (fairOSLogin === null) {
      notification.error({
        message: "Error biding on subscription",
        description: "You must be logged in to FairOS to bid on a subscription.",
      });
      return;
    }

    console.log("onBidSub", subscription, fairOSLogin);
    // var hash = await window.getNameHash(fairOSSessionId, userStat.address);
    // address is fdpBuyerNameHash
    await bidSubTx(subscription, "0x" + fairOSLogin.nameHash); // TODO this must be FDPbuyer address not METAMASK address
  };

  const createSubscriptionFrom = async (sub, categoryHash) => {
    console.log("createSubscriptionFrom ", sub);
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
    //subscription.cat = sub.category;
    subscription.category = categories.find(x => x.value == sub.category /*categoryHash*/)?.label;
    subscription.categoryHash = sub.category; //categoryHash;

    subscription.dataPodName = subscription.podName;
    subscription.dataPodAddress = subscription.podAddress;

    console.log("subscription", subscription);
    return subscription;
  };

  const onCategoryChange = async values => {
    console.log("onCategoryChange", values);
    setSubscriptions(subscriptions => []);
    if (values.length === 0) {
      var subs = await readContracts.DataHub.getSubs();
      for (var i = 0; i < subs.length; i++) {
        var sub = subs[i];
        if (sub.active === false) continue; // ignore non active subs
        var subscription = await createSubscriptionFrom(sub, "0x" + consts.emptyHash);
        setSubscriptions(subscriptions => [...subscriptions, subscription]);
      }
      return;
    }
    let listedCategories = [];
    for (var i = 0; i < values.length; i++) {
      var cat = await getCategory(values[i]);
      for (var subId = 0; subId < cat.subIdxs.length; subId++) {
        try {
          var sub = await getSub(cat.subIdxs[subId]); // getting by index is different than getting by hash
          console.log("sub", sub);
          if (sub.active === false) continue; // ignore non active subs
          var subscription = await createSubscriptionFrom(sub, values[i]);

          /*
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
          subscription.categoryHash = values[i];

          subscription.dataPodName = subscription.podName;
          subscription.dataPodAddress = subscription.podAddress;

          console.log("subscription", subscription);*/
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
    getFees();
  }, [address]);

  useEffect(() => {
    var flattened = [];
    var mItems = [];
    // flates categories and calculates sha values, adds menu items, and dumps flattened to console
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
    console.log("flattened", flattened);

    setMenuItems(mItems);
    setCategories(flattened); // -> this object was dumped to categoriesFlat.js on 16.march.2023
    //
  }, []);

  const onImageError = e => {
    e.target.src = window.location.origin + placeholderImage;
  };

  const openDetails = async subscription => {
    console.log("openDetails", subscription);
    history.push("/datahub/" + subscription.categoryHash + "/" + subscription.subHash);
    var subViewDetails = await readContracts.DataHub.getSubBy(subscription.subHash);
    console.log("subViewDetails", subViewDetails);
    setViewDetailForSub(subscription);
  };

  // create component to display subscription details
  function ViewDetailsForSubscription({ subscription }) {
    if (subscription === null) return null;
    console.log("subscriptionDetails", subscription);
    return (
      <Modal
        title={
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <h2>{subscription.title}</h2>
          </div>
        }
        visible={subscription != null}
        footer={null}
        onOk={() => {}}
        onCancel={() => {
          setViewDetailForSub(null);
        }}
      >
        <>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img
              src={subscription.imageUrl}
              style={{ width: "256px", height: "128px", borderRadius: "10px" }}
              onError={onImageError}
              alt="subscription"
            />
          </div>
          <div style={{ background: "#ffffff05", borderRadius: "5px" }}>
            <MarkdownPreview
              source={subscription.description}
              style={{ backgroundColor: "transparent", color: "inherit" }}
              darkMode={true}
              wrapperElement={{
                "data-color-mode": "dark",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Tooltip title={<>CategoryHash: {subscription.categoryHash}</>}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <h3>{subscription.category}</h3>
              </div>
            </Tooltip>

            <br />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Tooltip
              title={
                <>
                  FDP Seller NameHash: {subscription.fdpSellerNameHash} <br />
                </>
              }
            >
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>Seller:&nbsp;</div>
            </Tooltip>
            <AddressSimple address={subscription.seller} ensProvider={mainnetProvider} />
            <br />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <small>
              Bids: {subscription.bids.toString()} &nbsp; Sells: {subscription.sells.toString()} &nbsp; Reports:{" "}
              {subscription.reports.toString()} &nbsp; Days Valid: {subscription.daysValid.toString()} <br />
            </small>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "0px",
              padding: "0px",
            }}
          >
            <small>Price: {subscription.price.toString()}⬨ &nbsp;</small>
            <br />
            <br />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {subscription.active ? (
              <Tooltip
                title={
                  <>
                    Request to subscribe for {subscription.price}⬨ for {subscription.daysValid.toString()} days
                  </>
                }
              >
                <Button onClick={() => onBidSub(subscription)}>Request Access</Button>
              </Tooltip>
            ) : (
              <>Not active</>
            )}
          </div>
        </>
      </Modal>
    );
  }

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      {/* {cat} {sub} */}
      <div>
        {/* <Button onClick={() => setOpenListSub(!openListSub)}>List Data</Button> &nbsp; */}
        <small>
          Market fee: {marketFee}% &nbsp;Listing fee: {ethers.utils.formatEther(listingFee)}⬨ &nbsp;Escrowed:&nbsp;
          {ethers.utils.formatEther(inEscrow)}⬨&nbsp; Funds: {ethers.utils.formatEther(contractBalance)}⬨ &nbsp;
          Collected: {ethers.utils.formatEther(feesCollected)}⬨
        </small>
      </div>
      <br />
      {setViewDetailForSub != null && <ViewDetailsForSubscription subscription={viewDetailForSub} />}
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
                onClick={() => {
                  openDetails(sub);
                }}
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
                            Bids: <strong>{sub.bids.toString()}</strong> Sells <strong>{sub.sells.toString()}</strong>{" "}
                            Report <strong>{sub.reports.toString()}</strong>
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
                    {sub.active ? <>Active</> : <>Non active</>}
                  </div>

                  {/* <div style={{ bottom: "5px", position: "absolute" }}>
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
                  </div> */}
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
