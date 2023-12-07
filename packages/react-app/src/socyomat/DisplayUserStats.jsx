// main component for SocialGraph contract visualization
import React from "react";
import Blockies from "react-blockies";
import { AddressSimple } from "../components";
import { Collapse, Layout, Tooltip } from "antd";
import { formatNumber, timeAgo } from "../views/datetimeutils";

export function DisplayUserStats({
  userStats,
  userAddress,
  tx,
  writeContracts,
  readContracts,
  ensProvider,
  onNotifyClick,
  onComment,
  currentAddress,
}) {
  const handleFollowClick = mention => {
    console.log(`handleFollowClick`);
    //history.push("/feed?mention=" + mention.substring(1));
    //onNotifyClick();
  };
  const onViewInteractions = mention => {
    console.log(`onViewInteractions`);
    //history.push("/feed?mention=" + mention.substring(1));
    //onNotifyClick();
  };
  const onViewFollowers = mention => {
    console.log(`onViewFollowers`);
    //history.push("/feed?mention=" + mention.substring(1));
    //onNotifyClick();
  };
  const onViewFollowing = mention => {
    console.log(`onViewFollowing`);
    //history.push("/feed?mention=" + mention.substring(1));
    //onNotifyClick();
  };
  const onViewPosts = mention => {
    console.log(`onViewFollowing`);
    //history.push("/feed?mention=" + mention.substring(1));
    //onNotifyClick();
  };
  const onViewEngagedWith = mention => {
    console.log(`onViewFollowing`);
    //history.push("/feed?mention=" + mention.substring(1));
    //onNotifyClick();
  };

  return (
    <div style={{ width: "70%" }}>
      <Tooltip title="Engagement">
        <span onClick={() => onViewEngagedWith()} style={{ cursor: "pointer" }}>
          ⚭
        </span>
        <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.engagedWith_count.toString())}</small> &nbsp;
      </Tooltip>
      <Tooltip title="Posts">
        <span onClick={() => onViewPosts()} style={{ cursor: "pointer" }}>
          🗨
        </span>
        <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.posts_count.toString())}</small> &nbsp;
      </Tooltip>
      <Tooltip title="Followers">
        <span onClick={() => onViewFollowers()} style={{ cursor: "pointer" }}>
          ⚘
        </span>
        <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.followers_count.toString())}</small> &nbsp;
      </Tooltip>
      <Tooltip title="Following">
        <span onClick={() => onViewFollowing()} style={{ cursor: "pointer" }}>
          ✽
        </span>
        <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.following_count.toString())}</small> &nbsp;
      </Tooltip>
      <Tooltip title="Interactions">
        <span onClick={() => onViewInteractions()} style={{ cursor: "pointer" }}>
          ∑
        </span>
        <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.interactions_count.toString())}</small> &nbsp;
      </Tooltip>
    </div>
  );
}
export default DisplayUserStats;

// {messages.map((p, i) => {
//     return (
//       <div key={i} style={{ width: "100%" }} className="post-card-body">
//         <div className="post-layout">
//           <div className="post-blockie" style={{ cursor: "pointer" }} onClick={() => handleUserClick(p)}>
//             <Blockies seed={p.creator.toLowerCase()} size={16} scale={2} />
//           </div>
//           <div className="post-text">
//             <div className="post-creator">
//               {/* <Link to={"/profile/" + p.creator}>{p.creator}</Link> */}
//               <AddressSimple address={p.creator} ensProvider={ensProvider} />
//               {"  "}
//               <small>&nbsp; · {timeAgo(p.sendTime)}</small>
//             </div>
//             <TextInteractive
//               text={p.message}
//               onMentionClick={handleMentionClick}
//               onHashtagClick={handleHashtagClick}
//               onUrlClick={handleUrlClick}
//             />
//           </div>
//         </div>
//         <div className="post-footer">
//           <Tooltip title="Comments">
//             <span onClick={() => comment(p)} style={{ cursor: "pointer" }}>
//               {" "}
//               🗨
//             </span>{" "}
//             <small style={{ opacity: "0.5" }}>{formatNumber(p.commentCount.toString())}</small> &nbsp;
//           </Tooltip>
//           <Tooltip title="Like">
//             <span onClick={() => like(p)} style={{ cursor: "pointer" }}>
//               {" "}
//               ♡
//             </span>{" "}
//             <small style={{ opacity: "0.5" }}>{formatNumber(p.likeCount.toString())}</small> &nbsp;
//           </Tooltip>
//           <Tooltip title="Shares">
//             <span onClick={() => share(p)} style={{ cursor: "pointer" }}>
//               {" "}
//               ☄
//             </span>{" "}
//             <small style={{ opacity: "0.5" }}>{formatNumber(p.shareCount.toString())}</small> &nbsp;
//           </Tooltip>
//           <Tooltip title="Bookmark">
//             <span onClick={() => bookmark(p)} style={{ cursor: "pointer" }}>
//               {" "}
//               🕮
//             </span>{" "}
//             <small style={{ opacity: "0.5" }}>{formatNumber(p.totalEngagement.toString())}</small> &nbsp;
//           </Tooltip>
//           <Tooltip title="Engagement">
//             <span> ⚭</span> <small style={{ opacity: "0.5" }}>{formatNumber(p.totalEngagement.toString())}</small>{" "}
//             &nbsp;
//           </Tooltip>
//         </div>

//       </div>
//     );
//   })}
