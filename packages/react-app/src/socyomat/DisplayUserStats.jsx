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
}) {
  const handleFollowClick = mention => {
    console.log(`Mention clicked: ${mention}`);
    history.push("/sociomat?mention=" + mention.substring(1));
    onNotifyClick();
  };
  const follow = async message => {
    console.log("follow", message);
    //var newTx = await readContracts.SocialGraph.getPostStats(message.postId);
    console.log("follow", newTx);
  };

  //console.log("userStats", userStats);

  return (
    <div style={{ width: "70%" }}>
      <div style={{ width: "100%" }} className="user-card-body">
        <div className="post-layout">
          <div className="post-blockie">
            <Blockies seed={userStats?.userdata?.userAddress.toLowerCase()} size={32} scale={2} />
          </div>
          <div className="post-text">
            <div className="post-creator">
              <AddressSimple address={userStats?.userdata?.userAddress} ensProvider={ensProvider} />
              <small>&nbsp; · {timeAgo(userStats?.userdata?.timestamp.toNumber())}</small>
            </div>
            <Tooltip title="Last seen">
              <span onClick={() => handleFollowClick(p)} style={{ cursor: "pointer" }}>
                🎖
              </span>
              <small style={{ opacity: "0.5" }}>{userStats?.userdata?.timestamp.toString()}</small>
              &nbsp;
            </Tooltip>
            <Tooltip title="Days">
              <span onClick={() => handleFollowClick(p)} style={{ cursor: "pointer" }}>
                🎖
              </span>
              <small style={{ opacity: "0.5" }}>
                {" "}
                {timeAgo(userStats?.userdata?.dayIndex.toNumber() * 24 * 60 * 60)}
              </small>{" "}
              &nbsp;
            </Tooltip>
            <Tooltip title="Posts">
              <span onClick={() => handleFollowClick(p)} style={{ cursor: "pointer" }}>
                🎖
              </span>
              <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.userdata?.engagementScore.toString())}</small>{" "}
              &nbsp;
            </Tooltip>
            <br />
            <Tooltip title="Posts">
              <span onClick={() => handleFollowClick(p)} style={{ cursor: "pointer" }}>
                🗨
              </span>
              <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.posts_count.toString())}</small> &nbsp;
            </Tooltip>
            <Tooltip title="Followers">
              <span onClick={() => handleFollowClick(p)} style={{ cursor: "pointer" }}>
                ⚘
              </span>
              <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.followers_count.toString())}</small> &nbsp;
            </Tooltip>
            <Tooltip title="Following">
              <span onClick={() => handleFollowClick(p)} style={{ cursor: "pointer" }}>
                ✽
              </span>
              <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.following_count.toString())}</small> &nbsp;
            </Tooltip>
            <Tooltip title="Engagement">
              <span onClick={() => handleFollowClick(p)} style={{ cursor: "pointer" }}>
                ⚭
              </span>
              <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.engagedWith_count.toString())}</small> &nbsp;
            </Tooltip>
            <Tooltip title="Interactions">
              <span onClick={() => handleFollowClick(p)} style={{ cursor: "pointer" }}>
                ∑
              </span>
              <small style={{ opacity: "0.5" }}> {formatNumber(userStats?.interactions_count.toString())}</small> &nbsp;
            </Tooltip>
            {/* Last seen: {timeAgo(userStats?.timestamp.toString())}
            Engagement: {formatNumber(userStats?.engagementScore.toString())} */}
            {/* <TextInteractive
               text={p.message}
               onMentionClick={handleMentionClick}
               onHashtagClick={handleHashtagClick}
               onUrlClick={handleUrlClick}
             /> */}
          </div>
        </div>
      </div>
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
