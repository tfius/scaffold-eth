// main component for SocialGraph contract visualization
import React, { useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useDropzone } from "react-dropzone";
import { uploadDataToBee, downloadDataFromBee } from "../Swarm/BeeService";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";

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

//import tf from "@tensorflow/tfjs";
//import * as tf from "@tensorflow/tfjs";
//import "@tensorflow/tfjs-backend-cpu";
import CreatePost from "./CreatePost";
//require("@tensorflow/tfjs");
//const toxicity = require("@tensorflow-models/toxicity");

import { Spin, Collapse, Card, Layout, Menu, Tooltip, Input } from "antd";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import { load } from "@tensorflow-models/toxicity";
import { DisplayMessages } from "./DisplayMessages";
import { DisplayUserStats } from "./DisplayUserStats";
import { add } from "@tensorflow/tfjs-core/dist/engine";
const { Header, Content, Footer, Sider } = Layout;
//import Sider from "antd/lib/layout/Sider";
//import { Footer } from "antd/lib/layout/layout";
const { Panel } = Collapse;

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
class CreatePostComponent extends React.Component {
  formRef = React.createRef();
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      attachments: [],
      tags: [],
      atStrings: [],
      hashStrings: [],
    };
  }
}

export function SocialGraph({ readContracts, writeContracts, address, tx, ensProvider }) {
  let history = useHistory();
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef(null);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [userStats, setUserStats] = useState(null); // [userId, followersCount, followingCount, postsCount
  const [todayIndex, setTodayIndex] = useState(0);
  const [postIds, setPostIds] = useState([]);
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
  const [pageSize, setPageSize] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [retrivalFunction, setRetrivalFunction] = useState(null);
  const [messageToComment, setMessageToComment] = useState(null);
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
    const dayIdx = await readContracts.SocialGraph.getTodayIndex();
    const todaysPostsCount = await readContracts.SocialGraph.getDayStats(dayIdx);
    setTotalItems(todaysPostsCount);
    setStartItem(todaysPostsCount - pageSize >= 0 ? todaysPostsCount - pageSize : 0);
    setItemsCount(pageSize);
    setTodayIndex(dayIdx);
    setLoading(false);
    console.log("dayIndex", dayIdx.toNumber(), "todaysPostsCount", todaysPostsCount.toNumber());
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
      const postsInfo = await readContracts.SocialGraph.getPostsWith(postIds);
      var postsEx = [];
      // add postIds to postsInfo
      for (var i = 0; i < postsInfo.length; i++) {
        postsEx.push({ ...postsInfo[i], postId: postIds[i] });
        //postsInfo[i].postId = postIds[i];
      }
      // sort posts by timestamp
      //postsEx = postsEx.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
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
    //debugger;
    for (var i = 0; i < posts.length; i++) {
      try {
        const p = posts[i];
        // check to see if postId is already in messages
        if (messages.filter(m => m.contentPosition === p.contentPosition).length > 0) continue;
        const data = await downloadDataFromBee(p.contentPosition);
        var m = JSON.parse(new TextDecoder().decode(data));
        var mp = { ...m, ...p };
        // console.log("message", mp);
        // add only if post.contentPosition does not exist in messages before
        //if (messages.filter(m => m.contentPosition === mp.contentPosition).length === 0) msgs.push(mp);
        // debugger;
      } catch (e) {
        console.log("error", e);
      }
    }
    // sort messages by timestamp
    //msgs = msgs.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

    //setMessages(msgs);
    // append msg to messages
    setMessages(messages => [...msgs, ...messages]);
    setLoading(false);
    console.log("messages", msgs);
  });
  const fetchLatest = useCallback(async () => {
    setLoading(true);
    var lenght = pageSize;
    const allPosts = await readContracts.SocialGraph.postCount();

    const start = allPosts - pageSize >= 0 ? allPosts - pageSize : 0;
    lenght = start + pageSize < allPosts ? pageSize : allPosts - start; // length can be more than pageSize + start
    console.log("fetchLatest todaysPostsCount", allPosts.toString(), start, lenght);
    try {
      //const posts_latest = await readContracts.SocialGraph.getPosts(start, lenght);
      setPosts(posts_latest);
    } catch (e) {
      console.log("error", e);
    }
    setLoading(false);
  });

  useEffect(() => {
    console.log("start getting posts");
    fetchUserStats();
    setRetrivalFunction(() => fetchPostIdsPerDay);
    fetchTodayIndex();
  }, []);
  useEffect(() => {
    if (todayIndex == 0) return;
    console.log("todayIndex changed", todayIndex.toString());
    //fetchPostIdsPerDay();
  }, [todayIndex]);

  /*useEffect(() => {
    fetchPostIdsPerDay();
  }, [startItem, itemsCount]);*/

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
    await fetchLatest();
    await fetchUserStats();
  };
  const onLoadPosts = async () => {
    let query = useQuery();
    let mention = query.get("mention");
    let tag = query.get("tag");
    let userId = query.get("userId");
    let postId = query.get("postId");
    let cat = query.get("cat");
    let topic = query.get("topic");
    let pageLen;
    //console.log("query", query);
    //let { mention } = useParams();
    console.log("location", mention, tag, userId, postId, cat, topic);
    if (mention) {
      // get posts with mention
      //console.log("mention", mention);
      var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("@" + mention)).toString();
      var { tags, mentions, topics, categories } = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
      var maxCount = mentions;
      var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
      const postIdxs = await readContracts.SocialGraph.getPostIdsWithMentions(hash, start, pageSize);
      await pushMessagesOnStack();
      setPostIds(postIdxs);
    }
    if (tag) {
      // get posts with tag
      //console.log("tag", tag);
      var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("#" + tag)).toString();
      var { tags, mentions, topics, categories } = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
      var maxCount = tags;
      var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
      const postIdxs = await readContracts.SocialGraph.getPostIdsWithTags(hash, start, pageSize);
      await pushMessagesOnStack();
      setPostIds(postIdxs);
    }
    if (cat) {
      // get posts with tag
      //console.log("tag", tag);
      var hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("!" + cat)).toString();
      var { tags, mentions, topics, categories } = await readContracts.SocialGraph.getInfoOn(hash); // tags, mentions, topics, categories
      var maxCount = categories;
      var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
      const postIdxs = await readContracts.SocialGraph.getPostIdsWithCategory(hash, start, pageSize);
      setPostIds(postIdxs);
    }
    if (userId) {
      var userStats = await readContracts.SocialGraph.getUserStats(userId);
      console.log("userStats", userStats);
      var maxCount = userStats.posts_count;
      var start = maxCount - pageSize >= 0 ? maxCount - pageSize : 0;
      const posted = await readContracts.SocialGraph.getPostsFromUser(userId, start, pageSize);
      await pushMessagesOnStack();
      setPosts(posted);
    }
  };
  const pushMessagesOnStack = async () => {
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
    await fetchLatest();
    //console.log(postId, userId, tag, mention);
  };
  const GoExplore = async () => {
    console.log("GoExplore");
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

  return (
    <div style={{ margin: "auto", width: "100%", paddingLeft: "10px", paddingTop: "20px" }}>
      <h1>
        {messagesStack.length > 0 && (
          <span onClick={() => popMessagesStack()} style={{ cursor: "pointer" }}>
            🡄
          </span>
        )}{" "}
        Posts {loading && <Spin />}
      </h1>

      <Layout>
        <Content>
          <div className="routeSubtitle">
            <div className="post-card-body post-input-body" onClick={() => setIsPostModalVisible(true)}>
              What is happening ? {todayIndex.toString()} {messages.length}{" "}
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
          />
          {userStats !== null && userStats !== undefined ? (
            <DisplayUserStats userStats={userStats} ensProvider={ensProvider} />
          ) : (
            <h3>Seems you didn't post anything yet.</h3>
          )}

          <DisplayMessages
            messages={messages}
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            ensProvider={ensProvider}
            history={history}
            onNotifyClick={onLoadPosts}
            onComment={onOpenToComment}
          />
          <div ref={loaderRef}>
            <small>... {totalItems.toString()}</small>
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
            right: 0,
            // top: 0,
            // bottom: 0,
          }}
        >
          <Menu mode="inline" defaultSelectedKeys={["1"]}>
            <Input placeholder="Search" style={{ width: "98%" }} />
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
