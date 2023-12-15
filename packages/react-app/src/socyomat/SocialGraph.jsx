// main component for SocialGraph contract visualization
import React, { useState, useCallback, useEffect, useRef } from "react";
import { ethers, BigNumber } from "ethers";
import { useDropzone } from "react-dropzone";
import { uploadDataToBee, downloadDataFromBee } from "../Swarm/BeeService";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";
import * as pako from "pako";

import {
  AppstoreOutlined,
  BarChartOutlined,
  CloudOutlined,
  ShopOutlined,
  StarTwoTone,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

const questions = [
  "What's happening?",
  "What's going on?",
  "What's the news?",
  "What's the latest?",
  "What's the latest news?",
  "What's the latest on this?",
  "Explain what is occurring?",
  "Explain what is happening?",
  "Explain what is going on?",
  "Explain what is the news?",
  "What's unfolding right now?",
  "Tell me what is happening?",
  "What is the situation at this moment?",
  "Why is all this happening?",
  "What is the current situation?",
  "How did things get to this point?",
  "Is there a reason for change?",
  "Clarify the current events?",
  "What is the current state of affairs?",
  "What is the play?",
];

//import tf from "@tensorflow/tfjs";
//import * as tf from "@tensorflow/tfjs";
//import "@tensorflow/tfjs-backend-cpu";
import CreatePost from "./CreatePost";
//require("@tensorflow/tfjs");
//const toxicity = require("@tensorflow-models/toxicity");

import { Spin, Collapse, Card, Layout, Menu, Tooltip, Input } from "antd";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import { load } from "@tensorflow-models/toxicity";
import { RollingText } from "./RollingText";
import { DisplayMessages } from "./DisplayMessages";
import { DisplayUser } from "./DisplayUser";

import { add } from "@tensorflow/tfjs-core/dist/engine";
import { CoinList } from "./coinlist";
import { Graph } from "./Graph";
const { Header, Content, Footer, Sider } = Layout;
//import Sider from "antd/lib/layout/Sider";
//import { Footer } from "antd/lib/layout/layout";
const { Panel } = Collapse;

function convertToHex(str) {
  const num = parseInt(str, 10); // Convert string to an integer
  if (isNaN(num)) {
    return null; // or throw an error, or return a default value
  }
  return num.toString(16); // Convert the number to a hexadecimal string
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function createBigNumberArray(start, length) {
  const array = [];
  let current = BigNumber.from(start);
  for (let i = 0; i < length; i++) {
    array.push(current);
    current = current.add(1);
  }
  return array;
}
/*
function MyDropzone({ ref, onAdd }) {
  const onDrop = useCallback(acceptedFiles => {
    console.log(ref, onAdd, acceptedFiles);
    acceptedFiles.forEach(file => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result;
        console.log(binaryStr);
        onAdd(file, binaryStr);
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Drag 'n' drop some files here, or click to select files</p>
    </div>
  );
}*/

export function SocialGraph({
  readContracts,
  writeContracts,
  address,
  tx,
  ensProvider,
  setReplyTo,
  setThreadTo,
  setComposePost,
}) {
  let history = useHistory();
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef(null);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [userStats, setUserStats] = useState(null); // [userId, followersCount, followingCount, postsCount
  const [todayIndex, setTodayIndex] = useState(0);
  const [postIds, setPostIds] = useState([]);
  const [interactionIds, setInteractionIds] = useState([]); // [postId, userId, interactionType]
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesStack, setMessagesStack] = useState([]);
  const [messagesStackPos, setMessagesStackPos] = useState(0);
  const [users, setUsers] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [interactions, setInteractions] = useState([]); // [postId, userId, interactionType
  const [startItem, setStartItem] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [retrivalFunction, setRetrivalFunction] = useState(null);
  const [messageToComment, setMessageToComment] = useState(null);
  const [coinList, setCoinList] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [searchResults, setSearchResults] = useState([]);
  // let { userId } = useParams();
  // let { postId } = useParams();
  // let { tag } = useParams();
  // let { mention } = useParams();
  // let { location } = useLocation();

  // const fetchNextPostsIds = useCallback(async () => {
  //   console.log("fetchNextPostsIds", todayIndex.toString(), startItem, itemsCount);

  //   console.log("fetchNextPostsIds", startItem, itemsCount, todaysPostsCount);
  // }, [todayIndex, startItem]);

  const handleObserver = useCallback(
    entries => {
      const target = entries[0];
      if (target.isIntersecting) {
        console.log(
          "retrivalFunction",
          loading,
          retrivalFunction != 0,
          totalItems.toString(),
          startItem.toString(),
          totalItems.toString(),
        );
        sleep(1000);
        if (loading === false && retrivalFunction !== null) {
          /*
          if (startItem + itemsCount < totalItems) {
            setStartItem(startItem + itemsCount);
            console.log("setStartItem", startItem + itemsCount);
          } else {
            console.log("above totalItems", startItem + itemsCount, totalItems);
          }
          */
          /*if (startItem + itemsCount >= totalItems) {
            //var newStart = totalItems - itemsCount;
            // setItemsCount(totalItems - newStart);
            setStartItem(totalItems - itemsCount); // get those in between
            // get from previous day
            if (false) {
              setStartItem(0);
              setTodayIndex(todayIndex - 1); //yesterday
            }
          }*/
        }
      }
    },
    [retrivalFunction, loading, startItem, itemsCount, totalItems, todayIndex],
  );
  // Setting up the Intersection Observer
  useEffect(() => {
    const option = {
      root: null, // relative to document viewport
      rootMargin: "20px", // margin around root. Values are similar to css property. Unitless values not allowed
      threshold: 1.0, // visible amount of item shown in relation to root
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    // Clean up the observer on component unmount
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver, startItem, itemsCount]);

  const fetchUserStats = useCallback(
    async forAddress => {
      if (address === undefined) return;
      if (readContracts.SocialGraph === undefined) return;
      if (!forAddress) forAddress = address;
      setLoading(true);
      try {
        const userStats = await readContracts.SocialGraph.getUserStats(forAddress);
        setUserStats(userStats);
      } catch (e) {
        console.log("error", e);
        console.log("userStats", forAddress, userStats);
      }
      setLoading(false);

      return userStats;
    },
    [readContracts],
  );
  const fetchTodayIndex = useCallback(async () => {
    setLoading(true);
    if (readContracts.SocialGraph === undefined) return;
    try {
      const dayIdx = await readContracts.SocialGraph.getTodayIndex();
      const todaysPostsCount = await readContracts.SocialGraph.getDayStats(dayIdx);
      setTotalItems(todaysPostsCount);
      setStartItem(todaysPostsCount - pageSize >= 0 ? todaysPostsCount - pageSize : 0);
      setItemsCount(pageSize);
      setTodayIndex(dayIdx);
      console.log("dayIndex", dayIdx.toNumber(), "todaysPostsCount", todaysPostsCount);
    } catch (e) {
      console.log("error", e);
    }
    setLoading(false);
  }, [readContracts]);
  const fetchPostIdsPerDay = useCallback(async () => {
    console.log("fetchPostIdsPerDay", todayIndex.toString(), startItem, itemsCount);
    setLoading(true);
    const todaysPostsCount = await readContracts.SocialGraph.getDayStats(todayIndex);
    try {
      if (startItem + itemsCount > todaysPostsCount) {
        //setStartItem(todaysPostsCount - itemsCount);
        console.log("above todaysPostsCount", startItem + itemsCount, todaysPostsCount);
      }
      const postsIdxs = await readContracts.SocialGraph.getPostsPerDay(todayIndex, startItem, itemsCount);
      setPostIds(postsIdxs); // will triger fetchPosts
      console.log("postsIdxs", postsIdxs);
    } catch (e) {
      console.log("error", e);
    }
    setLoading(false);
  }, [todayIndex]);
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    console.log("got postIds", postIds);
    try {
      //var p = postIds.sort((a, b) => (a > b ? -1 : 1));
      const postsInfo = await readContracts.SocialGraph.getPostsWith(postIds);
      //const postsInfo = await readContracts.SocialGraph.getPostsWith(p);
      var postsEx = [];
      // add postIds to postsInfo
      for (var i = 0; i < postsInfo.length; i++) {
        const p = postsInfo[i];
        const postStats = await readContracts.SocialGraph.getPostStats(postIds[i]);
        postsEx.push({
          ...postsInfo[i],
          postId: postIds[i],
          likes_count: postStats.likes_count,
          comments_count: postStats.comments_count,
          shares_count: postStats.shares_count,
          interactions_count: postStats.interactions_count,
          //total_engagements: postStats.total_engagement,
        });
      }
      // sort posts by time
      //postsEx = postsEx.sort((a, b) => (a.time > b.time ? -1 : 1));
      //postsEx = postsEx.sort((a, b) => (a.postId < b.postId ? -1 : 1));
      setPosts(postsEx); // will trigger fetchMessages
      console.log("posts", postsEx);
    } catch (e) {
      console.log("error", e);
    }
    setLoading(false);
  }, [postIds]);
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    var msgs = [];
    var parents = [];
    //debugger;
    for (var i = 0; i < posts.length; i++) {
      try {
        const p = posts[i];
        // check to see if postId is already in messages
        if (messages.filter(m => m.swarmLocation === p.swarmLocation).length > 0) continue;
        //if(getPostStats)

        const data = await downloadDataFromBee(p.swarmLocation);
        // const s = new TextDecoder().decode(data);
        const decompressedString = pako.inflate(data, { to: "string" });
        //
        //var m = JSON.parse(new TextDecoder().decode(decompressedString));
        var m = JSON.parse(decompressedString);
        var mp = { ...m, ...p, expanded: false, level: 0, comments: [] };
        // console.log("message", mp);
        // add only if post.swarmLocation does not exist in messages before
        //if (messages.filter(m => m.swarmLocation === mp.swarmLocation).length === 0)
        if (mp.parentPost !== null) {
          // find if parent id is not already in parents
          var exists = parents.filter(p => p._hex === mp.parentPost.hex);
          if (exists.length === 0) {
            var bnPostId = BigNumber.from(mp.parentPost);
            parents.push(bnPostId); // those should be loaded also
          }
        }
        msgs.push(mp);
      } catch (e) {
        console.log("error", e);
      }
    }
    // append msg to messages
    if (parents.length > 0) {
      //msgs = [...msgs].sort((a, b) => (a.time < b.time ? -1 : 1));
      //var sorted = [...msgs, ...messages].sort((a, b) => (a.time > b.time ? -1 : 1));
      //setMessages(sorted);
      setMessages([...msgs, ...messages]);
      console.log("messages", msgs);
      //setPostIds([...parents, ...postIds]);
      setPostIds([...parents]);
      console.log("parents", parents);
    } else {
      // all parents have been loaded, reorder messages so that comments with parents are after parents
      var msgs2 = [];
      var all_messages = [...msgs, ...messages].sort((a, b) => (a.time > b.time ? -1 : 1));
      // first add all messages that have no parentPost
      for (var i = 0; i < all_messages.length; i++) {
        var msg = all_messages[i];
        if (msg.parentPost === null) {
          msgs2.push(msg);
        }
      }
      // then add all messages that have parentPost
      for (var i = 0; i < all_messages.length; i++) {
        var msg = all_messages[i];
        if (msg.parentPost !== null) {
          msg.level = 10;
          var idx = msgs2.findIndex(m => m.postId._hex === msg.parentPost.hex);
          if (idx === -1) {
            msgs2.push(msg);
            console.log("push comment", msg.postId);
          } else {
            var insertIdx = idx + 1;
            msg.level += msgs2[idx].level + 10;
            // Find the correct position to insert the child message
            while (insertIdx < msgs2.length && msgs2[insertIdx].parentPost === msg.parentPost) {
              insertIdx++;
            }
            msgs2.splice(insertIdx, 0, msg);
            console.log("inserted comment", msgs2[idx].postId);
          }
        }
      }
      // msgs2 = [...msgs2].sort((a, b) => (a.time > b.time ? -1 : 1));
      //msgs2 = msgs2.sort((a, b) => (a.postId < b.postId ? -1 : 1));
      //setMessages(sorted);
      // sort msgs by time but only those that have no parentPost
      //msgs2 = msgs2.filter(m => m.parentPost === null).sort((a, b) => (a.time < b.time ? -1 : 1));
      setMessages([...msgs2]);
      console.log("hiera messages", msgs2);
    }
    setLoading(false);
    //console.log("messages", msgs2);
  });
  const fetchLatestPostIds = useCallback(async () => {
    setLoading(true);
    var lenght = pageSize;
    const allPosts = await readContracts.SocialGraph.totalSupply();

    const start = allPosts - pageSize >= 0 ? allPosts - pageSize : 0;
    lenght = start + pageSize < allPosts ? pageSize : allPosts - start; // length can be more than pageSize + start
    var idxs = createBigNumberArray(start, lenght); //this just gets latest post ids
    //idxs = idxs.sort((a, b) => (a < b ? -1 : 1));
    console.log("fetchLatest todaysPostsCount", allPosts.toString(), start, lenght, idxs);
    try {
      // const posts_latest = await readContracts.SocialGraph.getPostsWith(idxs);
      setPostIds(idxs);
    } catch (e) {
      console.log("error", e);
    }
    setLoading(false);
  });
  const fetchLatestInteractionIds = useCallback(async () => {
    setLoading(true);
    var lenght = pageSize * 25;
    const allPosts = await readContracts.SocialGraph.interactionsCount();

    const start = allPosts - pageSize >= 0 ? allPosts - pageSize : 0;
    lenght = start + pageSize < allPosts ? pageSize : allPosts - start; // length can be more than pageSize + start
    var idxs = createBigNumberArray(start, lenght); //this just gets latest post ids
    console.log("fetchLatestInteractions", allPosts.toString(), start, lenght, idxs);
    try {
      // const posts_latest = await readContracts.SocialGraph.getPostsWith(idxs);
      setInteractionIds(idxs);
    } catch (e) {
      console.log("error", e);
    }
    setLoading(false);
  });
  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    const interactions = await readContracts.SocialGraph.getInteractions(interactionIds);
    console.log("fetchInteractions", interactions);
    var interaction_types = [
      "Post",
      "Follow",
      "Like",
      "Share",
      "Comment",
      "Bookmark",
      "Quote",
      "Process",
      "Analysis",
      "Merge",
      "Other",
    ];
    //                        Post,   Follow,   Like,   Share,   Comment,   Bookmark,   Process, Analysis, Merge, Other
    var interaction_colors = [
      "white",
      "#009900",
      "purple",
      "#000099",
      "#555500",
      "gray",
      "quartz",
      "#AAAAAA",
      "#BBBBBB",
      "#CCCCCC",
      "#777777",
    ];
    var nodes = [];
    var links = [];
    var interactedWithPostIds = [];
    for (var i = 0; i < interaction_types.length; i++) {
      // nodes.push({ id: interaction_types[i], type: "Interaction", color: "grey" });
    }

    for (var i = 0; i < interactions.length; i++) {
      var interaction = interactions[i];
      // console.log("interaction", interaction);
      var user = interaction.from.toString();
      var postId = interaction.post.toString();
      var interactionType = interaction_types[interaction.interactionType];

      var linkUserToInteraction = {
        source: user,
        target: interactionType,
        interactionType: interactionType,
        color: interaction_colors[interaction.interactionType],
        thickness: 1,
      };
      var linkInteractionToPost = {
        source: interactionType,
        target: postId,
        interactionType: interactionType,
        color: interaction_colors[interaction.interactionType],
        thickness: 1,
      };
      var linkUserToPost = {
        source: user,
        target: postId,
        interactionType: interactionType,
        color: interaction_colors[interaction.interactionType],
        thickness: 1,
      };

      var linkPostToInteraction = {
        source: postId,
        target: interactionType,
        interactionType: interactionType,
        color: "gray",
        thickness: 1,
      };
      //links.push(linkUserToInteraction);
      //links.push(linkInteractionToPost);
      // links.push(linkPostToInteraction);
      links.push(linkUserToPost);

      // var linkUserToPost = { source: user, target: postId, interactionType: interactionType };
      // links.push(linkUserToPost);

      // var linkPostToInteraction = { source: postId, target: interactionType, interactionType: interactionType };
      // links.push(linkPostToInteraction);

      // var linkInteractionToPost = { source: interactionType, target: postId, interactionType: interactionType };
      // links.push(linkInteractionToPost);

      if (nodes.filter(n => n.id === user).length === 0) {
        nodes.push({ id: user, type: "user", color: "green" });
      }
      if (nodes.filter(n => n.id === postId).length === 0) {
        nodes.push({ id: postId, type: "post", color: "purple" });

        interactedWithPostIds.push(postId);
      }
    }

    setInteractions(interactions);
    setGraphData({ nodes: nodes, links: links });
    setPostIds(interactedWithPostIds);
    setLoading(false);
  });
  const fetchIdsForPostWithComments = useCallback(async postIdx => {
    setLoading(true);
    const postStats = await readContracts.SocialGraph.getPostStats(postIdx);
    const maxCount = postStats.comments_count;
    // if (maxCount == 0) return;
    var comments = [];
    if (maxCount != 0) {
      const start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
      //comments = await readContracts.SocialGraph.getPostComments(postIdx, start, pageSize);
      comments = await readContracts.SocialGraph.getPostData(postIdx, 0, start, pageSize);
    }
    console.log("getPostComments", comments);
    return [postIdx, ...comments];
  }, []);
  const fetchInteractionsForPost = useCallback(
    async postId => {
      setLoading(true);
      //const iactionIds = await readContracts.SocialGraph.getInteractionsFromPost(postId, 0, 100);
      const iactionIds = await readContracts.SocialGraph.getPostData(postId, 1, 0, 100);
      console.log("getInteractionsFromPost", iactionIds);
      await pushMessagesOnStack();
      setInteractionIds(iactionIds);
    },
    [interactionIds],
  );
  const fetchSharesForPost = useCallback(
    async postId => {
      setLoading(true);
      const iactionIds = await readContracts.SocialGraph.getPostData(postId, 2, 0, 100);
      console.log("getInteractionsFromPost", iactionIds);
      await pushMessagesOnStack();
      setInteractionIds(iactionIds);
    },
    [interactionIds],
  );
  const fetchLikesForPost = useCallback(
    async postId => {
      setLoading(true);
      const iactionIds = await readContracts.SocialGraph.getPostData(postId, 3, 0, 100);
      console.log("getInteractionsFromPost", iactionIds);
      await pushMessagesOnStack();
      setInteractionIds(iactionIds);
    },
    [interactionIds],
  );
  const fetchInteractionsForUser = useCallback(
    async userId => {
      setLoading(true);
      const userStats = await readContracts.SocialGraph.getUserStats(userId);
      setUserStats(userStats);
      const iactionIds = await readContracts.SocialGraph.getUserInteractions(userId, 0, 100);
      console.log("getUserInteractions", iactionIds);
      await pushMessagesOnStack();
      setInteractionIds(iactionIds);
    },
    [interactionIds],
  );
  const fetchCoinList = useCallback(async () => {
    setLoading(true);
    setCoinList(CoinList);
    ///////////////////////////////////////////////////////////////
    //  or load latest from coinList
    /*
    const coinsResponse = await fetch("https://api.coingecko.com/api/v3/coins/list");
    if (!coinsResponse.ok) {
      throw new Error("Error fetching coin list");
    }
    const coinsData = await coinsResponse.json();
    setCoinList(coinsData); 
    */
    //console.log("coinsData", coinsData);
  }, []);

  useEffect(() => {
    console.log("start getting posts");
    fetchCoinList();
    fetchUserStats();
    setRetrivalFunction(() => fetchPostIdsPerDay);
    fetchTodayIndex();
  }, []);
  useEffect(() => {
    if (todayIndex == 0) return;
    console.log("todayIndex changed", todayIndex.toString());
    //fetchPostIdsPerDay();
  }, [todayIndex]);
  useEffect(() => {
    if (interactionIds.length == 0) return;
    console.log("interactionIds changed", interactionIds.length);
    fetchInteractions();
  }, [interactionIds]);
  useEffect(() => {
    if (postIds.length == 0) return;
    console.log("postIds changed", postIds.length);
    fetchPosts();
  }, [postIds]);
  useEffect(() => {
    if (posts.length === 0) return;
    console.log("posts changed", posts.length);
    fetchMessages();
  }, [posts]);
  const updateDailyPostsCount = useCallback(async day => {
    var todaysPostsCount = await readContracts.SocialGraph.getDayStats(day);
    console.log("updateDailyPostsCount", todaysPostsCount.toString(), day);
    setTotalItems(todaysPostsCount);
    return todaysPostsCount;
  });
  useEffect(() => {
    let isCancelled = false;
    const fetchData = async () => {
      try {
        const response = await updateDailyPostsCount(todayIndex);
        //const usrStats = await fetchUserStats(userStats?.userdata?.userAddress);
        //setUserStats(usrStats);
      } catch (error) {}
      if (!isCancelled) {
        setTimeout(fetchData, 13000); // Schedule the next call
      }
    };

    fetchData();
    // Cleanup function to set the isCancelled flag
    return () => {
      isCancelled = true;
    };
  }, [todayIndex]); // Empty dependency array means this effect will only run once (like componentDidMount in classes)

  function useQuery() {
    return new URLSearchParams(location.search);
  }
  const onPostCreated = async (text, attachments, tags, atStrings, hashStrings) => {
    setMessageToComment(null);
    setIsPostModalVisible(false);
    await fetchLatestPostIds();
    await fetchLatestInteractionIds();
    await fetchUserStats();
  };
  const loadMention = async mention => {
    var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(mention)).toString();
    var { tags, mentions, topics, tokens, categories } = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
    var maxCount = mentions;
    var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
    //const postIdxs = await readContracts.SocialGraph.getPostIdsWithMentions(hash, start, pageSize);
    const postIdxs = await readContracts.SocialGraph.getPostIdsByTypeFrom(hash, 0, start, pageSize);
    return postIdxs;
  };
  const loadTag = async tag => {
    var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tag)).toString();
    var { tags, mentions, topics, tokens, categories } = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
    var maxCount = tags;
    var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
    //const postIdxs = await readContracts.SocialGraph.getPostIdsWithTags(hash, start, pageSize);
    const postIdxs = await readContracts.SocialGraph.getPostIdsByTypeFrom(hash, 2, start, pageSize);
    return postIdxs;
  };
  const loadCategory = async cat => {
    var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(cat)).toString();
    var { tags, mentions, topics, tokens, categories } = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
    var maxCount = categories;
    var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
    //const postIdxs = await readContracts.SocialGraph.getPostIdsWithCategory(hash, start, pageSize);
    const postIdxs = await readContracts.SocialGraph.getPostIdsByTypeFrom(hash, 4, start, pageSize);
    return postIdxs;
  };
  const loadTopic = async topic => {
    var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(topic)).toString();
    var { tags, mentions, topics, tokens, categories } = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
    var maxCount = topics;
    var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
    //const postIdxs = await readContracts.SocialGraph.getPostIdsWithTopic(hash, start, pageSize);
    const postIdxs = await readContracts.SocialGraph.getPostIdsByTypeFrom(hash, 1, start, pageSize);
    return postIdxs;
  };
  const loadToken = async token => {
    var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(token)).toString();
    var { tags, mentions, topics, tokens, categories } = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
    var maxCount = tokens;
    var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
    //const postIdxs = await readContracts.SocialGraph.getPostIdsWithTokens(hash, start, pageSize);
    const postIdxs = await readContracts.SocialGraph.getPostIdsByTypeFrom(hash, 3, start, pageSize);
    return postIdxs;
  };
  const loadUserStats = async user => {
    var userStats = await readContracts.SocialGraph.getUserStats(user);
    return userStats;
  };
  const loadUserPostsFromStats = async userStats => {
    var maxCount = userStats.posts_count;
    var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
    const postIdxs = await readContracts.SocialGraph.getPostsFromUser(userStats.userdata.userAddress, start, pageSize);
    return postIdxs;
  };
  const loadUserStatsAndPosts = async user => {
    var userStats = await readContracts.SocialGraph.getUserStats(user);
    setUserStats(userStats);
    setUsers([...users, userStats.userdata]);
    var pidx = await loadUserPostsFromStats(userStats);
    return pidx;
  };

  const loadPostsFrom = async (mention, tag, cat, token, topic, userId) => {
    var postIndices = [];
    if (mention) {
      try {
        const postIdxs = await loadMention("@" + mention);
        postIndices = [...postIndices, ...postIdxs];
      } catch (e) {}
    }
    if (tag) {
      try {
        const postIdxs = await loadTag("#" + tag);
        postIndices = [...postIndices, ...postIdxs];
      } catch (e) {}
    }
    if (cat) {
      try {
        const postIdxs = await loadCategory("!" + cat);
        postIndices = [...postIndices, ...postIdxs];
      } catch (e) {}
    }
    if (token) {
      try {
        const postIdxs = await loadToken("$" + token);
        postIndices = [...postIndices, ...postIdxs];
      } catch (e) {}
    }
    if (topic) {
      try {
        const postIdxs = await loadTopic("!" + topic);
        postIndices = [...postIndices, ...postIdxs];
      } catch (e) {}
    }
    if (userId) {
      try {
        const stats = await loadUserStats(userId);
        const postIdxs = await loadUserPostsFromStats(stats);
        postIndices = [...postIndices, ...postIdxs];
      } catch (e) {}
    }
    return postIndices;
  };
  const onLoadPosts = async () => {
    let query = useQuery();
    let mention = query.get("mention");
    let tag = query.get("tag");
    let token = query.get("token");
    let userId = query.get("userId");
    let postId = query.get("postId");
    let cat = query.get("cat");
    let topic = query.get("topic");
    let followersFor = query.get("followers");
    let followingFor = query.get("following");
    let engaged = query.get("engaged");
    console.log("location", mention, tag, userId, postId, cat, topic);

    // load posts from mention, tag, cat, token, userId
    const multiPostIdxs = await loadPostsFrom(mention, tag, cat, token, topic, userId);
    if (multiPostIdxs.length > 0) {
      await pushMessagesOnStack();
      setPostIds(multiPostIdxs);
    }

    if (userId) {
      const stats = await loadUserStats(userId);
      setUserStats(stats);
    }
    if (postId) {
      //debugger;
      //await fetchInteractionsForPost(postId);
      // convert postId to bigNumber
      //var bnPostId = BigNumber.from(postId);
      //const postAndComments = await fetchIdsForPostWithComments({ type: "BigNumber", hex: "0x"+convertToHex(postId) });
      const postAndComments = await fetchIdsForPostWithComments(ethers.BigNumber.from(postId));
      if (postAndComments) {
        await pushMessagesOnStack();
        setPostIds(postAndComments);
      }
    }
    if (followersFor) {
      const stats = await loadUserStats(userId);
      setUserStats(stats);
      var maxCount = stats.followers_count;
      var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0; // followers
      const gotUsers = await readContracts.SocialGraph.getUsersByTypeFrom(followersFor, start, pageSize, 0);
      setUsers(gotUsers);
    }
    if (followingFor) {
      const stats = await loadUserStats(followingFor);
      setUserStats(stats);
      var maxCount = userStats.following_count;
      var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0; // following
      const gotUsers = await readContracts.SocialGraph.getUsersByTypeFrom(followingFor, start, pageSize, 1);
      setUsers(gotUsers);
    }
    if (engaged) {
      const stats = await loadUserStats(engaged);
      setUserStats(stats);
      var maxCount = userStats.engagedWith_count;
      var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0; // engaged with
      const gotUsers = await readContracts.SocialGraph.getUsersByTypeFrom(engaged, start, pageSize, 2);
      setUsers(gotUsers);
    }
  };
  const pushMessagesOnStack = async () => {
    if (messages.length === 0) return;
    var stack = messagesStack;
    stack.push(messages);
    setMessagesStack(stack);
    setMessages([]);
    console.log("pushMessagesOnStack", stack.length, stack);
  };
  const popMessagesStack = async () => {
    var lastStack = messagesStack[messagesStack.length - 1];
    setMessagesStack(messagesStack.slice(0, messagesStack.length - 1));
    setMessages(lastStack);
  };
  // when action to comment is clicked
  const onOpenToComment = async messageToComment => {
    setMessageToComment(messageToComment);
    setIsPostModalVisible(true);
  };
  const GoHome = async () => {
    console.log("GoHome");
    await fetchLatestPostIds();
    //console.log(postId, userId, tag, mention);
  };
  const GoExplore = async () => {
    console.log("GoExplore");
    await fetchLatestInteractionIds();
  };
  const GoMentions = async () => {
    console.log("GoMentions");
  };
  const GoBookmarks = async () => {
    console.log("GoBookmarks");
  };
  const GoTags = async () => {
    console.log("GoTags");
  };
  const GoInteractions = async () => {
    console.log("GoInteractions");
    try {
      const intetractionIdxs = await readContracts.SocialGraph.getUserInteractions(address, 0, 10);
      setInteractions(intetractionIdxs);
      console.log("intetractionIdxs", intetractionIdxs);
    } catch (e) {
      console.log("error", e);
    }
  };
  const onSearchChange = async (text, invoke) => {
    console.log("onSearchChange", text);
    var words = text.split(" ");
    var results = [];

    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      // check to see if word is a user address
      if (word.length === 42 && word.startsWith("0x")) {
        try {
          var userStats = await readContracts.SocialGraph.getUserStats(word);
          results.push({ name: word, count: 1, fn: loadUserStatsAndPosts });
        } catch (e) {
          //console.log("error", e);
        }
      }

      var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(word)).toString();
      var t = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
      console.log("search", t);

      if (t.mentions > 0) results.push({ name: word, count: t.mentions, fn: loadMention });
      if (t.tags > 0) results.push({ name: word, count: t.tags, fn: loadTag });
      if (t.categories > 0) results.push({ name: word, count: t.categories, fn: loadCategory });
      if (t.tokens > 0) results.push({ name: word, count: t.tokens, fn: loadToken });
      if (t.topics > 0) results.push({ name: word, count: t.topics, fn: loadTopic });
      // userId
      // results.push({ name: word, count: t.topics });
    }
    setSearchResults(results);
    if (invoke) {
      console.log("invoke", results);
      var multiPostIdxs = [];
      for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var postIdxs = await result.fn(result.name);
        multiPostIdxs = [...multiPostIdxs, ...postIdxs];
      }
      if (multiPostIdxs.length > 0) {
        await pushMessagesOnStack();
        setPostIds(multiPostIdxs);
      }
    }
  };

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h1 onClick={() => setComposePost(true)}>
        {messagesStack.length > 0 && (
          <span onClick={() => popMessagesStack()} style={{ cursor: "pointer" }}>
            🡄
          </span>
        )}{" "}
        Posts {loading && <Spin />}
        {(readContracts === undefined || readContracts.SocialGraph === undefined) && <h3>Unsupported network</h3>}
      </h1>

      <Layout>
        <Content>
          <div className="routeSubtitle">
            <div
              className="post-card-body post-input-body"
              style={{ maxHeight: "3rem" }}
              onClick={() => setIsPostModalVisible(true)}
            >
              <h3>
                <RollingText textArray={questions} interval={50000} />
                {userStats !== null && userStats !== undefined ? null : <> Seems you didn't post anything yet. </>}
                {/* {questions[Math.floor(Math.random() * questions.length)]} */}
              </h3>
            </div>
          </div>
          <CreatePost
            readContracts={readContracts}
            writeContracts={writeContracts}
            address={address}
            tx={tx}
            onCreatePost={onPostCreated}
            postToCommentOn={messageToComment}
            isOpen={isPostModalVisible}
            setIsOpen={setIsPostModalVisible}
            coinList={coinList}
          />
          {userStats !== null && userStats !== undefined ? (
            <>
              <DisplayUser
                userdata={userStats.userdata}
                userStats={userStats}
                readContracts={readContracts}
                writeContracts={writeContracts}
                ensProvider={ensProvider}
                currentAddress={address}
                history={history}
                onNotifyClick={onLoadPosts}
                tx={tx}
                setReplyTo={setReplyTo}
                setThreadTo={setThreadTo}
              />
            </>
          ) : null}

          <DisplayMessages
            messages={messages}
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            ensProvider={ensProvider}
            history={history}
            onNotifyClick={onLoadPosts}
            onComment={onOpenToComment}
            setReplyTo={setReplyTo}
            setThreadTo={setThreadTo}
          />
          {users.map((u, i) => {
            <DisplayUser key={"usr" + i} userData={u} ensProvider={ensProvider} currentAddress={address} />;
          })}
          {/* <Graph
            data={graphData}
            width={600}
            height={200}
            onPostClicked={fetchInteractionsForPost}
            onUserClicked={fetchInteractionsForUser}
          />  */}

          <div ref={loaderRef}>
            <small>
              ... Messages:{messages.length} Total:{totalItems.toString()} Day:{todayIndex.toString()}
            </small>
          </div>
        </Content>

        <Sider
          style={{
            //overflow: "auto",
            width: "200px",
            height: "100vh",
            //display: "flex",
            //flexDirection: "column",
            position: "fixed",
            background: "transparent",
            right: 0,
            // top: 0,
            // bottom: 0,
          }}
        >
          <Menu mode="inline" defaultSelectedKeys={["1"]}>
            <div style={{ width: "100%", position: "relative" }}>
              <Input
                placeholder="Search # @ $ !"
                style={{ width: "98%" }}
                onChange={e => onSearchChange(e.target.value, false)}
                onPressEnter={e => onSearchChange(e.target.value, true)}
              />
              <div className="search-results">
                {searchResults.map((r, i) => {
                  return (
                    <>
                      {r.count > 0 && (
                        <div className="search-result-item">
                          {r.name} <small>({r.count.toString()})</small>
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
            </div>
            <Menu.Item key="1" icon={<UserOutlined />}>
              <span to="#" onClick={() => GoHome()}>
                Latest
              </span>
            </Menu.Item>
            <Menu.Item key="2" icon={<VideoCameraOutlined />}>
              <span to="#" onClick={() => GoExplore()}>
                Explore
              </span>
            </Menu.Item>
            <Menu.Item key="3" icon={<UploadOutlined />}>
              <span to="#" onClick={() => GoMentions()}>
                Mentions
              </span>
            </Menu.Item>
            <Menu.Item key="4" icon={<BarChartOutlined />}>
              <span to="#" onClick={() => GoBookmarks()}>
                Bookmarks
              </span>
            </Menu.Item>
            <Menu.Item key="5" icon={<CloudOutlined />}>
              <span to="#" onClick={() => GoTags()}>
                Tags
              </span>
            </Menu.Item>
            <Menu.Item key="6" icon={<CloudOutlined />}>
              <span to="#" onClick={() => GoInteractions()}>
                Interactions
              </span>
            </Menu.Item>
            <Menu.Item key="7" icon={<CloudOutlined />}>
              <span to="#" onClick={() => GoInteractions()}>
                Followers
              </span>
            </Menu.Item>
            <Menu.Item key="8" icon={<CloudOutlined />}>
              <span to="#" onClick={() => GoInteractions()}>
                Following
              </span>
            </Menu.Item>
          </Menu>
          <Graph
            data={graphData}
            width={200}
            height={600}
            onPostClicked={fetchInteractionsForPost}
            onUserClicked={fetchInteractionsForUser}
          />
        </Sider>
      </Layout>
      {/* <Footer>footer</Footer> */}

      {/* <div className="paginationInfo">
        {startItem}-{endItem} of {totalItems} &nbsp;&nbsp;&nbsp;
        <a onClick={() => retrieveNewPage(page - 1)}>{"<"}</a>&nbsp;{page}/{maxPages}&nbsp;
        <a onClick={() => retrieveNewPage(page + 1)}>{">"}</a>
      </div> */}
    </div>
  );
}

export default SocialGraph;