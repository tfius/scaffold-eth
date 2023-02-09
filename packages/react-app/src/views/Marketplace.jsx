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

// what is this?
// Displays categories and subscriptions
// Allows to list a subscription
// Allows to bid on a subscription
// Allows to sell a subscription - accept a bid
const categoryList = [
  { label: "General", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("General")).toString() },
  { label: "Text", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Text")).toString() },
  { label: "Image", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Image")).toString() },
  { label: "Data", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Data")).toString() },
  { label: "Map", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Map")).toString() },
  { label: "Audio", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audio")).toString() },
  { label: "Video", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video")).toString() },
  { label: "Model", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Model")).toString() },
  { label: "Other", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Other")).toString() },

  { label: "Book", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Book")).toString() },
  { label: "Fiction book", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Fiction book")).toString() },
  { label: "Non-fiction book", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Non-fiction book")).toString() },
  { label: "Short stories", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Short stories")).toString() },

  { label: "Membership", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Membership")).toString() },
  { label: "Planners", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Planners")).toString() },
  { label: "Guides", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Guides")).toString() },
  { label: "Drawing guides", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Drawing guides")).toString() },
  { label: "Travel guides", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Travel guides")).toString() },
  {
    label: "Self-publishing guides",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Self-publishing guides")).toString(),
  },
  { label: "Printout origami", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Printout origami")).toString() },
  {
    label: "Printable coloring sheets",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Printable coloring sheets")).toString(),
  },

  { label: "Newsletter", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Newsletter")).toString() },

  {
    label: "E-learning course",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("E-learning course")).toString(),
  },
  { label: "Community", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Community")).toString() },
  { label: "Courses", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Courses")).toString() },
  {
    label: "Certified courses",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Certified courses")).toString(),
  },
  { label: "Audio course", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audio course")).toString() },
  { label: "Video course", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video course")).toString() },

  { label: "Journals", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Journal")).toString() },
  {
    label: "Printable journals",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Printable journal")).toString(),
  },

  { label: "Tracker", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Tracker")).toString() },
  { label: "Wellness tracker", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Wellness tracker")).toString() },

  { label: "Wallpapers", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Wallpapers")).toString() },
  { label: "Emojis", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Emojis")).toString() },
  { label: "Posters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Posters")).toString() },
  { label: "Fonts", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Fonts")).toString() },
  { label: "Templates", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Templates")).toString() },
  {
    label: "3D printer design files",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("3D printer design files")).toString(),
  },
  { label: "3D design files", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("3D design files")).toString() },
  { label: "3D files", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("3D files")).toString() },
  { label: "Sets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Sets")).toString() },
  { label: "Icon sets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Icon sets")).toString() },
  { label: "Animations", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Animations")).toString() },
  { label: "Video animations", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video animations")).toString() },
  { label: "3D animations", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("3D animations")).toString() },
  {
    label: "Cartoon animations",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Cartoon animations")).toString(),
  },

  { label: "Designs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Designs")).toString() },
  {
    label: "Architectural designs",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Architectural designs")).toString(),
  },
  { label: "Graphic designs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Graphic designs")).toString() },
  { label: "Premade designs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Premade designs")).toString() },

  { label: "Games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("games")).toString() },
  { label: "Video games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video games")).toString() },
  { label: "Mobile games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Mobile games")).toString() },
  { label: "Desktop games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Desktop games")).toString() },
  { label: "Console games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Console games")).toString() },
  { label: "Board games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Board games")).toString() },
  { label: "Card games", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Card games")).toString() },
  {
    label: "Printable games and riddles",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Printable games and riddles")).toString(),
  },

  { label: "Themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Themes")).toString() },
  { label: "Website themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Website themes")).toString() },
  { label: "Music themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Music themes")).toString() },
  { label: "Video themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video themes")).toString() },
  { label: "Slide themes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Slide themes")).toString() },
  {
    label: "Spreadsheet themes",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Spreadsheet themes")).toString(),
  },

  { label: "Software", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Software")).toString() },
  { label: "Desktop software", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Desktop software")).toString() },
  { label: "Mobile software", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Mobile software")).toString() },
  { label: "Web software", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Web software")).toString() },
  { label: "Apps", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Apps")).toString() },
  { label: "Web apps", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Web apps")).toString() },
  { label: "Mobile apps", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Mobile apps")).toString() },
  { label: "Desktop apps", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Desktop apps")).toString() },

  { label: "Plugins", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Plugins")).toString() },
  { label: "Browser plugins", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Browser plugins")).toString() },
  { label: "Audio plugins", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audio plugins")).toString() },
  { label: "Video plugins", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video plugins")).toString() },

  { label: "Hosting", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Hosting")).toString() },
  { label: "Code snippets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Code snippets")).toString() },
  { label: "Integrations", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Integrations")).toString() },
  { label: "Podcast", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Podcast")).toString() },
  { label: "Careers advice", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Careers advice")).toString() },
  { label: "Masterclasses", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Masterclasses")).toString() },
  { label: "Resources", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Resources")).toString() },

  { label: "Deleted chapters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Deleted chapters")).toString() },
  { label: "Spin-offs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Spin-offs")).toString() },

  { label: "Extra scenes", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Extra scenes")).toString() },

  {
    label: "Novel planning sheet",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Novel planning sheet")).toString(),
  },
  { label: "Tutorials", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Tutorials")).toString() },
  {
    label: "Painting video tutorials",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Painting video tutorials")).toString(),
  },
  {
    label: "Videography tutorials",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Videography tutorials")).toString(),
  },
  { label: "Music tutorials", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Music tutorials")).toString() },

  { label: "Designs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Designs")).toString() },
  {
    label: "Clip art pictures",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Clip art pictures")).toString(),
  },
  { label: "Clip art symbols", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Clip art symbols")).toString() },

  { label: "Cooking", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Cooking")).toString() },
  { label: "Recipe books", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Recipe books")).toString() },
  { label: "Nutrition", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Nutrition")).toString() },
  { label: "Nutrition plans", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Nutrition plans")).toString() },
  { label: "Meal-prep plans", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Meal-prep plans")).toString() },

  { label: "Health", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Health")).toString() },
  { label: "Healthy living", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Healthy living")).toString() },
  {
    label: "Home recipes for healthy skin",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Home recipes for healthy skin")).toString(),
  },
  {
    label: "Hair and makeup tutorials",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Hair and makeup tutorials")).toString(),
  },

  { label: "Audiobook", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audiobook")).toString() },
  { label: "Kids’ audiobook", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Kids’ audiobook")).toString() },
  {
    label: "Activities",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Activities")).toString(),
  },
  { label: "Trips", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Trips")).toString() },
  {
    label: "Field trips and activities",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Field trips and activities")).toString(),
  },
  {
    label: "Virtual field trips and activities",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Virtual field trips and activities")).toString(),
  },

  { label: "Songs", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Songs")).toString() },
  { label: "Album", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Album")).toString() },
  {
    label: "Downloadable songs",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Downloadable songs")).toString(),
  },
  { label: "Playlist", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Playlist")).toString() },
  { label: "Sound effects", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Sound effects")).toString() },
  { label: "Voiceovers", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Voiceovers")).toString() },
  {
    label: "Instrumental tracks",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Instrumental tracks")).toString(),
  },
  { label: "Beats", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Beats")).toString() },
  { label: "Workout plans", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Workout plans")).toString() },
  {
    label: "Workout video",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Workout video")).toString(),
  },

  { label: "Presets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Presets")).toString() },
  {
    label: "Presets and filters",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Presets and filters")).toString(),
  },
  { label: "LUTs and presets", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LUTs and presets")).toString() },
  { label: "Filters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Filters")).toString() },
  { label: "Audio Filters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Audio Filters")).toString() },
  { label: "Video Filters", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video Filters")).toString() },
  { label: "Stock photos", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Stock photo")).toString() },
  { label: "Stock video", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Stock video")).toString() },
  { label: "Short films", value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Short films")).toString() },
  {
    label: "Video animation intros",
    value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Video animation intros")),
  },
];

export function Marketplace({ readContracts, writeContracts, tx, userSigner, address, smailMail, mainnetProvider }) {
  const [listingFee, setListingFee] = useState(ethers.utils.parseEther("0.0001"));
  const [marketFee, setMarketFee] = useState(500); // 0.5% of the price
  const [categories, setCategories] = useState(categoryList);
  const [subscriptions, setSubscriptions] = useState([]);
  const [openListSub, setOpenListSub] = useState(false);
  const getFees = useCallback(async () => {
    if (readContracts === undefined) return;
    var listFee = await readContracts.SwarmMail.minListingFee();
    setListingFee(listFee.toString());
    var marketFee = await readContracts.SwarmMail.marketFee();
    setMarketFee(marketFee.toNumber() / 1000); // default 0.5% of the price
    var balanceInContract = await readContracts.SwarmMail.fundsBalance();
    var balanceInEscrow = await readContracts.SwarmMail.inEscrow();
    var feesCollected = await readContracts.SwarmMail.feesCollected();
    console.log("marketFee", marketFee, "listingFee", listFee);
  });
  const getCategory = useCallback(async categoryHash => {
    var category = await readContracts.SwarmMail.getCategory(categoryHash);
    console.log("category", category);
    return category;
  });
  const getSub = useCallback(async subId => {
    var sub = await readContracts.SwarmMail.getSub(subId);
    console.log("sub", sub);
    return sub;
  });
  const getSubBy = useCallback(async subHash => {
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

  // A modal with form to collect data for listing a subscription
  // data = json object { title, description, image, price, category, podIndex }
  const listSub = useCallback(async (fdpSellerAddress, data, price, category, podIndex) => {
    // upload data to swarm
    try {
      var dataLocation = await uploadDataToBee(JSON.stringify(data), "application/json", Date.now() + ".sub.json");
      console.log("dataLocation", dataLocation);
      var newTx = await tx(
        writeContracts.SwarmMail.listSub(fdpSellerAddress, "0x" + dataLocation, price, category, podIndex, {
          value: listingFee,
        }),
      );
      await newTx.wait();
    } catch (e) {
      console.log(e);
      notification.error = {
        message: "Error listing subscription",
        description: "You can only list one subscription for a pod.",
      };
    }
  });
  const bidSub = useCallback(async (subscription, fdpBuyer) => {
    var newTx = await tx(
      writeContracts.SwarmMail.bidSub(subscription.subHash, fdpBuyer, { value: subscription.priceInWei }),
    );
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

  const onListSub = async values => {
    console.log("onListSub", values);
    await listSub(values.fdpSeller, values, values.price, values.category, values.podIndex);
    setOpenListSub(false);
  };

  const onBidSub = async subscription => {
    console.log("subscription", subscription);
    await bidSub(subscription, address); // TODO this must be FDPbuyer address not METAMASK address
  };

  const onCategoryChange = async values => {
    console.log("onCategoryChange", values);
    //setSubscriptions(subscriptions => []);
    let listedCategories = [];
    for (var i = 0; i < values.length; i++) {
      var cat = await getCategory(values[i]);
      for (var subId = 0; subId < cat.subIdxs.length; subId++) {
        try {
          var sub = await getSub(cat.subIdxs[subId]);
          console.log("sub", sub);
          var subData = await downloadDataFromBee(sub.swarmLocation);
          var subscription = JSON.parse(new TextDecoder().decode(subData));
          subscription.seller = sub.seller;
          subscription.fdpSeller = sub.fdpSeller;
          subscription.price = ethers.utils.formatEther(sub.price).toString();
          subscription.priceInWei = sub.price.toString();
          subscription.bids = sub.bids.toString();
          subscription.sells = sub.sells.toString();
          subscription.reports = sub.reports.toString();
          subscription.swarmLocation = sub.swarmLocation;
          subscription.subHash = sub.subHash;
          subscription.category = categories.find(x => x.value == values[i])?.label;
          subscription.podContractIndex = sub.podIndex.toString();

          console.log("subData", subscription);
          setSubscriptions(subscriptions => [...subscriptions, subscription]);
        } catch (e) {
          console.log(e);
        }
      }
      listedCategories.push(cat);
    }
    console.log("listedCategories", listedCategories);
  };

  useEffect(() => {
    //calcCategories();
    getFees();
    //getCategory("0x" + consts.emptyHash);
  }, [address]);
  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px" }}>
      <div>
        Market fee: {marketFee}% Listing fee: {ethers.utils.formatEther(listingFee)}
      </div>
      <div>
        <Button onClick={() => setOpenListSub(!openListSub)}>List Sub</Button>
      </div>
      <Select
        placeholder="Please select category"
        defaultValue="General"
        onChange={onCategoryChange}
        options={categories}
        style={{ width: "99%" }}
        mode="multiple"
        allowClear
      />
      <Modal
        title="List Subscription"
        visible={openListSub}
        footer={null}
        onOk={() => setOpenListSub(false)}
        onCancel={() => setOpenListSub(false)}
      >
        <ListSub listSub={onListSub} categories={categories} />
      </Modal>
      <Row>
        {subscriptions.map((sub, i) => {
          return (
            <Card key={i} style={{ maxWidth: "33%", minWidth: "100px" }}>
              <div key={i}>
                <div style={{ textAlign: "left", top: "-15px", position: "relative" }}>
                  <small>
                    <Tooltip
                      title={
                        <>
                          Category: <strong>{sub.category}</strong> Seller: <br />
                          <AddressSimple address={sub.fdpSeller} ensProvider={mainnetProvider} />
                          <br />
                          FDP Seller: <AddressSimple address={sub.seller} ensProvider={mainnetProvider} />
                          <div>
                            Pod index: {sub.podIndex} / {sub.podContractIndex}
                          </div>
                        </>
                      }
                    >
                      <span>{sub.category}</span>
                    </Tooltip>

                    <Tooltip
                      title={
                        <>
                          Bids: <strong>{sub.bids}</strong> Sells <strong>{sub.sells}</strong> Report{" "}
                          <strong>{sub.reports}</strong>
                        </>
                      }
                    >
                      &nbsp;<span>♡</span>
                    </Tooltip>
                    <Tooltip title={"User info"}>
                      &nbsp;<span>ⓘ</span>
                    </Tooltip>
                  </small>
                </div>
                <Tooltip
                  title={
                    <>
                      {sub.title} <br />
                      <img src={sub.imageUrl} style={{ width: "100%" }} alt="image" />
                    </>
                  }
                >
                  <h3 style={{ width: "100%", overflow: "hidden", top: "-6px", position: "relative" }}>{sub.title}</h3>
                </Tooltip>

                <div
                  style={{ width: "100%", maxHeight: "200px", top: "-6px", position: "relative", overflow: "hidden" }}
                >
                  {sub.description}
                </div>

                <br />
                <Tooltip title={<>Bid on subscription for {sub.price}⬨ for 30 days</>}>
                  <Button onClick={() => onBidSub(sub)}>{sub.price} ⬨</Button>
                </Tooltip>
              </div>
              <Skeleton loading={false} />
            </Card>
          );
        })}
      </Row>
    </div>
  );
}

import * as layouts from "./layouts.js";
export function ListSub({ listSub, categories }) {
  // const formRef = React.createRef();
  const onSend = values => {
    listSub(values);
    console.log("onSend", values);
  };
  const onCategoryChange = value => {
    console.log("onCategoryChange", value);
  };
  return (
    <Form {...layouts.layout} onFinish={onSend}>
      <Form.Item name="title" label="Title">
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea maxLength={1024} rows={3} autosize={{ minRows: "3", maxRows: "5" }} />
      </Form.Item>
      <Form.Item name="imageUrl" label="Image">
        <Input />
      </Form.Item>
      <Form.Item name="price" label="Price">
        <Input />
      </Form.Item>
      <Form.Item name="category" label="Category">
        <Select defaultValue={categories[0].value} onChange={onCategoryChange} options={categories} />
      </Form.Item>
      <Form.Item name="fdpSeller" label="FDP Account">
        <Input />
      </Form.Item>
      <Form.Item name="podIndex" label="Pod Index">
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
