// main component for SocialGraph contract visualization
import React, { useCallback, useEffect } from "react";
import Blockies from "react-blockies";
import { AddressSimple } from "../components";
import { Button, Collapse, Layout, Tooltip } from "antd";
import { formatNumber, timeAgo } from "../views/datetimeutils";
const { utils } = require("ethers");
import { DisplayUserStats } from "./DisplayUserStats";

export function DisplayUser({
  userdata,
  userAddress,
  userStats,
  tx,
  writeContracts,
  readContracts,
  history,
  ensProvider,
  onNotifyClick,
  onComment,
  currentAddress,
}) {
  const [areYouFollowing, setAreYouFollowing] = React.useState(false);
  const handleUserClick = user => {
    console.log(`User clicked: ${user}`);
    // Handle post click (e.g., navigate to post)
    history.push("/feed?userId=" + user.userAddress);
    onNotifyClick();
  };
  const handleFollowClick = mention => {
    console.log(`handleFollowClick`);
    //history.push("/feed?mention=" + mention.substring(1));
    //onNotifyClick();
  };
  const follow = async userAddress => {
    console.log("follow", userAddress);
    try {
      var userStats = await readContracts.SocialGraph.getUserStats(userAddress);
      console.log("userStats", userStats.userdata.priceForFollow.toString());
      //userStats.userdata.priceForFollow
      // var newTx = await writeContracts.SocialGraph.follow(userAddress);
      let newTx = await tx(
        writeContracts.SocialGraph.follow(userAddress, {
          value: userStats.userdata.priceForFollow, // in wei
        }),
      );
      await newTx.wait();
      history.push("/feed?userId=" + user.userAddress); // after follow, go to users feed
      // TODO change state or user if you are following him
    } catch (e) {
      console.log("error", e);
    }
  };
  const checkFollowing = useCallback(async () => {
    if (userdata === null || userdata === undefined) return;
    try {
      if (currentAddress == userdata.userAddress) {
        setAreYouFollowing(true);
        return;
      }
      var relations = await readContracts.SocialGraph.getRelations(currentAddress, userdata.userAddress);
      console.log(
        "relations user - other",
        currentAddress,
        userdata.userAddress,
        relations,
        relations.user_following_other > 0 ? true : false,
      );
      setAreYouFollowing(relations.user_following_other > 0 ? true : false);
      // engagement_to_other
      // engagement_to_user
      // other_follower_user
      // other_following_user
      // user_follower_other
      // user_following_other
    } catch (e) {
      console.log("error", e);
    }
  }, [userdata]);
  useEffect(() => {
    checkFollowing();
  }, [userdata]);

  //console.log("userdata", userdata);

  return (
    <div style={{ width: "70%" }}>
      <div style={{ width: "100%" }} className="user-card-body">
        <div className="user-layout">
          <div className="post-blockie" onClick={() => handleUserClick(userdata)}>
            <Blockies seed={userdata.userAddress.toLowerCase()} size={32} scale={2} />
          </div>
          <div className="post-text">
            <div className="post-creator">
              <strong>
                <AddressSimple address={userdata?.userAddress} ensProvider={ensProvider} />
              </strong>
              <small>
                &nbsp; · {timeAgo(userdata?.time.toNumber() * 1000)}
                {currentAddress?.toLowerCase() === userdata?.userAddress?.toLowerCase() && (
                  <span>&nbsp; · Connected account</span>
                )}
                &nbsp;
                <span>
                  <Tooltip title="Score">
                    <span onClick={() => handleFollowClick()} style={{ cursor: "pointer" }}>
                      🎖
                    </span>
                    <small style={{ opacity: "0.5" }}> {formatNumber(userdata?.engagementScore.toString())}</small>{" "}
                    &nbsp;
                  </Tooltip>
                  <Tooltip title="Day">
                    <span onClick={() => handleFollowClick()} style={{ cursor: "pointer" }}>
                      ⧖
                    </span>
                    <small style={{ opacity: "0.5" }}>
                      {" "}
                      {timeAgo(userdata?.dayIndex.toNumber() * 24 * 60 * 60 * 1000)}
                    </small>{" "}
                    &nbsp;
                  </Tooltip>
                </span>
              </small>
              {areYouFollowing === false ? (
                <Button
                  type="primary"
                  style={{ maxHeight: "1.5em", paddingTop: "0px", marginTop: "0px", borderRadius: "10px" }}
                  onClick={() => follow(userdata?.userAddress)}
                >
                  <span style={{ fontSize: "1.0em", padding: "0px" }}>
                    Follow {userdata.priceForFollow > 0 && <>⬨{utils.formatEther(userdata.priceForFollow)}</>}
                  </span>
                </Button>
              ) : (
                <small>Following</small>
              )}
            </div>
            {userStats != null && (
              <DisplayUserStats
                userStats={userStats}
                ensProvider={ensProvider}
                currentAddress={currentAddress}
                history={history}
                onNotifyClick={onNotifyClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default DisplayUser;
