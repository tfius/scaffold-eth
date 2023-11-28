// main component for SocialGraph contract visualization
import React, { useCallback, useEffect } from "react";
import Blockies from "react-blockies";
import { AddressSimple } from "../components";
import { Button, Collapse, Layout, Tooltip } from "antd";
import { formatNumber, timeAgo } from "../views/datetimeutils";

export function DisplayUser({
  userdata,
  userAddress,
  tx,
  writeContracts,
  readContracts,
  history,
  ensProvider,
  onNotifyClick,
  onComment,
  currentAddress,
}) {
  const handleUserClick = user => {
    console.log(`User clicked: ${user}`);
    // Handle post click (e.g., navigate to post)
    history.push("/sociomat?userId=" + user.userAddress);
    onNotifyClick();
  };
  const handleFollowClick = mention => {
    console.log(`handleFollowClick`);
    //history.push("/sociomat?mention=" + mention.substring(1));
    //onNotifyClick();
  };
  const follow = async userAddress => {
    console.log("follow", userAddress);
    // var newTx = await writeContracts.SocialGraph.follow(userAddress);
    let newTx = await tx(
      writeContracts.SocialGraph.follow(userAddress, {
        value: cost, // in wei
      }),
    );
    await newTx.wait();
  };
  const checkFollowing = useCallback(async () => {
    if (userdata === null || userdata === undefined) return;
    try {
      var isFollowing = await readContracts.SocialGraph.getRelations(currentAddress, userdata.userAddress);
      console.log("relations user - other", currentAddress, userdata.userAddress, isFollowing);
    } catch (e) {
      console.log("error", e);
    }
  }, [userdata]);
  useEffect(() => {
    checkFollowing();
  }, [userdata]);

  //console.log("user", user);

  return (
    <div style={{ width: "70%" }}>
      <div style={{ width: "100%" }} className="user-card-body">
        <div className="user-layout">
          <div className="post-blockie" onClick={() => handleUserClick(userdata)}>
            <Blockies seed={userdata.userAddress.toLowerCase()} size={32} scale={2} />
          </div>
          <div className="post-text">
            <div className="post-creator">
              <AddressSimple address={userdata?.userAddress} ensProvider={ensProvider} />
              <small>
                &nbsp; · {timeAgo(userdata?.timestamp.toNumber() * 1000)}
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
              <Button
                type="primary"
                style={{ maxHeight: "1.5em", paddingTop: "0px", marginTop: "0px", borderRadius: "10px" }}
                onClick={() => follow(userdata?.userAddress)}
              >
                <span style={{ fontSize: "1.0em", padding: "0px" }}>Follow</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DisplayUser;
